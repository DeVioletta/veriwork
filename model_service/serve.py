"""Service inferensi (FastAPI). Jalankan dari folder ini:
    uvicorn serve:app --port 8000
Untuk mengganti model (mis. deep learning), pertahankan kontrak POST /predict dan GET /health.
"""

import json
from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field

from features import to_model_text

ARTIFACTS = Path(__file__).resolve().parent / "artifacts"
MODEL_PATH = ARTIFACTS / "model.joblib"
INFO_PATH = ARTIFACTS / "metrics.json"

if not MODEL_PATH.exists():
    raise RuntimeError("Model belum ada. Jalankan dulu: python train.py")

pipeline = joblib.load(MODEL_PATH)
info = json.loads(INFO_PATH.read_text())
THRESHOLD = float(info["threshold"])

vectorizer = pipeline.named_steps["tfidf"]
classifier = pipeline.named_steps["clf"]
feature_names = vectorizer.get_feature_names_out()
coefficients = classifier.coef_[0]
# Bigram yang mengandung token buatan (zz_...) tidak ditampilkan sebagai penjelasan, karena hanya duplikat.
hidden_terms = np.array([(" " in n and "zz_" in n) for n in feature_names])

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


@app.get("/health")
def health():
    return {"status": "ok", **info}


@app.post("/predict")
def predict(job: JobIn):
    text = to_model_text(job.model_dump())
    x = vectorizer.transform([text])
    fraud_p = float(classifier.predict_proba(x)[0, 1])
    label = "fraudulent" if fraud_p >= THRESHOLD else "legitimate"

    # Penjelasan: kontribusi tiap fitur = nilai TF-IDF x koefisien regresi logistik.
    coo = x.tocoo()
    contrib = coo.data * coefficients[coo.col]
    contrib[hidden_terms[coo.col]] = 0.0
    order = np.argsort(contrib)
    signals = []
    for i in order[::-1][:TOP_N]:  # paling mendorong ke fraudulent
        if contrib[i] > 0:
            signals.append({"term": str(feature_names[coo.col[i]]), "weight": round(float(contrib[i]), 4)})
    for i in order[:TOP_N]:  # paling mendorong ke legitimate
        if contrib[i] < 0:
            signals.append({"term": str(feature_names[coo.col[i]]), "weight": round(float(contrib[i]), 4)})

    return {
        "label": label,
        "fraud_probability": round(fraud_p, 4),
        "confidence": round(max(fraud_p, 1 - fraud_p), 4),
        "threshold": THRESHOLD,
        "signals": signals,
    }
