"""Service inferensi (FastAPI) untuk model XGBoost. Jalankan dari folder ini:
    uvicorn serve:app --port 8000
Artefak yang dibutuhkan di folder artifacts/: xgboost_model.json, preprocessor.pkl, tfidf.pkl
"""

import json
from pathlib import Path

import joblib
import numpy as np
import xgboost as xgb
from fastapi import FastAPI
from pydantic import BaseModel, Field

from preprocessing import BINARY_LABELS, THRESHOLD, build_matrix, describe_features

ARTIFACTS = Path(__file__).resolve().parent / "artifacts"
MODEL_PATH = ARTIFACTS / "xgboost_model.json"
PREPROCESSOR_PATH = ARTIFACTS / "preprocessor.pkl"
TFIDF_PATH = ARTIFACTS / "tfidf.pkl"
INFO_PATH = ARTIFACTS / "model_info.json"  # dibuat oleh export_jobs.py

for _p in (MODEL_PATH, PREPROCESSOR_PATH, TFIDF_PATH):
    if not _p.exists():
        raise RuntimeError(f"File tidak ditemukan: {_p}. Salin artefak model ke folder artifacts/.")

tfidf = joblib.load(TFIDF_PATH)
preprocessor = joblib.load(PREPROCESSOR_PATH)

booster = xgb.Booster()
booster.load_model(str(MODEL_PATH))

objective = json.loads(booster.save_config())["learner"]["objective"]["name"]
if objective != "binary:logistic":
    raise RuntimeError(f"Objective model adalah '{objective}', service ini mengharapkan 'binary:logistic'.")

FEATURES = describe_features(tfidf, preprocessor)
if booster.num_features() != len(FEATURES):
    raise RuntimeError(
        f"Jumlah fitur tidak cocok: model XGBoost memakai {booster.num_features()} fitur, "
        f"sedangkan tfidf.pkl + preprocessor.pkl menghasilkan {len(FEATURES)}. "
        "Pastikan ketiga file berasal dari proses pelatihan yang sama."
    )
KINDS = np.array([kind for kind, _ in FEATURES])
IS_BINARY = KINDS == "binary"

# Bila pelatihan memakai early stopping, pakai jumlah pohon terbaik, seperti XGBClassifier.predict.
try:
    ITERATION_RANGE = (0, int(booster.best_iteration) + 1)
except AttributeError:
    ITERATION_RANGE = (0, 0)  # 0 = semua pohon

DEFAULT_INFO = {"model_name": "XGBoost + TF-IDF", "threshold": THRESHOLD, "metrics": None}
info = dict(DEFAULT_INFO)
if INFO_PATH.exists():
    info.update(json.loads(INFO_PATH.read_text(encoding="utf-8")))

TOP_N = 6

app = FastAPI(title="VeriWork model service")


class JobIn(BaseModel):
    title: str = Field("", max_length=2000)
    location: str = Field("", max_length=2000)
    department: str = Field("", max_length=2000)
    salary_range: str = Field("", max_length=2000)
    company_profile: str = Field("", max_length=20000)
    description: str = Field("", max_length=20000)
    requirements: str = Field("", max_length=20000)
    benefits: str = Field("", max_length=20000)
    employment_type: str = Field("", max_length=200)
    required_experience: str = Field("", max_length=200)
    required_education: str = Field("", max_length=200)
    industry: str = Field("", max_length=500)
    function: str = Field("", max_length=500)
    telecommuting: int = 0
    has_company_logo: int = 0
    has_questions: int = 0


def _label(i: int, value: float) -> str:
    kind, key = FEATURES[i]
    if kind == "binary":
        return BINARY_LABELS[(key, int(value))]
    return key


@app.get("/health")
def health():
    return {"status": "ok", **info}


@app.post("/predict")
def predict(job: JobIn):
    x = build_matrix([job.model_dump()], tfidf, preprocessor)
    dmat = xgb.DMatrix(x, feature_names=booster.feature_names, feature_types=booster.feature_types)

    fraud_p = float(booster.predict(dmat, iteration_range=ITERATION_RANGE)[0])
    label = "fraudulent" if fraud_p >= THRESHOLD else "legitimate"

    # Penjelasan: nilai SHAP bawaan XGBoost (dalam log-odds). Hanya fitur yang AKTIF pada lowongan ini
    # (kata yang muncul, kategori yang dipilih, dan tiga fitur biner) yang ditampilkan.
    contribs = booster.predict(dmat, pred_contribs=True, iteration_range=ITERATION_RANGE)[0][:-1]
    row = x.toarray()[0]
    score = np.where(IS_BINARY | (row != 0), contribs, 0.0)
    order = np.argsort(score)

    signals = []
    for i in order[::-1][:TOP_N]:
        if score[i] > 0:
            signals.append({"term": _label(i, row[i]), "weight": round(float(score[i]), 4)})
    for i in order[:TOP_N]:
        if score[i] < 0:
            signals.append({"term": _label(i, row[i]), "weight": round(float(score[i]), 4)})

    return {
        "label": label,
        "fraud_probability": round(fraud_p, 4),
        "confidence": round(max(fraud_p, 1 - fraud_p), 4),
        "threshold": THRESHOLD,
        "signals": signals,
    }