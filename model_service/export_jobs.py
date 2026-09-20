"""Skor data uji dengan model XGBoost Anda, lalu tulis:
  - ../data/jobs.json               (200 lowongan sampel untuk UI, lengkap dengan skor)
  - artifacts/model_info.json       (metrik pada data uji, ditampilkan di halaman /analyze)

Pakai (dari folder model_service, environment yang sama dengan service):
    python export_jobs.py --csv fake_job_postings.csv

Data uji direproduksi dengan train_test_split(test_size=0.2, random_state=42, stratify=y),
sama dengan notebook, sehingga model tidak dinilai pada data yang dipakai melatihnya.
"""

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import average_precision_score, precision_recall_fscore_support, roc_auc_score
from sklearn.model_selection import train_test_split

from preprocessing import (
    BINARY_COLUMNS,
    CAT_COLUMNS,
    TEXT_COLUMNS,
    THRESHOLD,
    build_matrix,
    clean_for_display,
)

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
ARTIFACTS = HERE / "artifacts"
BATCH = 500


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default=str(HERE / "fake_job_postings.csv"))
    ap.add_argument("--export", default=str(ROOT / "data" / "jobs.json"))
    ap.add_argument("--n-fraud", type=int, default=40)
    ap.add_argument("--n-legit", type=int, default=160)
    ap.add_argument("--seed", type=int, default=42, help="seed untuk memilih sampel UI")
    args = ap.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        raise SystemExit(f"CSV tidak ditemukan: {csv_path}")

    tfidf = joblib.load(ARTIFACTS / "tfidf.pkl")
    preprocessor = joblib.load(ARTIFACTS / "preprocessor.pkl")
    booster = xgb.Booster()
    booster.load_model(str(ARTIFACTS / "xgboost_model.json"))
    try:
        iteration_range = (0, int(booster.best_iteration) + 1)
    except AttributeError:
        iteration_range = (0, 0)

    df = pd.read_csv(csv_path)
    y = df["fraudulent"].astype(int)
    _, test_idx = train_test_split(df.index, test_size=0.2, random_state=42, stratify=y)
    test_df = df.loc[test_idx]
    records = test_df.to_dict("records")
    print(f"Data uji: {len(records)} lowongan. Membersihkan teks dan menskor (bisa beberapa menit)...")

    probs = []
    for start in range(0, len(records), BATCH):
        x = build_matrix(records[start : start + BATCH], tfidf, preprocessor)  # sparse, seperti saat pelatihan
        dmat = xgb.DMatrix(x, feature_names=booster.feature_names, feature_types=booster.feature_types)
        probs.append(booster.predict(dmat, iteration_range=iteration_range))
        print(f"  {min(start + BATCH, len(records))}/{len(records)}")
    proba = np.concatenate(probs)

    y_test = y.loc[test_idx].to_numpy()
    pred = (proba >= THRESHOLD).astype(int)
    p, r, f1, _ = precision_recall_fscore_support(y_test, pred, pos_label=1, average="binary", zero_division=0)
    metrics = {
        "precision": round(float(p), 4),
        "recall": round(float(r), 4),
        "f1": round(float(f1), 4),
        "roc_auc": round(float(roc_auc_score(y_test, proba)), 4),
        "pr_auc": round(float(average_precision_score(y_test, proba)), 4),
    }
    print("Metrik kelas fraud pada data uji (threshold %.2f):" % THRESHOLD, metrics)

    ARTIFACTS.mkdir(exist_ok=True)
    (ARTIFACTS / "model_info.json").write_text(
        json.dumps(
            {"model_name": "XGBoost + TF-IDF", "threshold": THRESHOLD, "n_test": len(records), "metrics": metrics},
            indent=2,
        ),
        encoding="utf-8",
    )

    scored = test_df.assign(_proba=proba)
    n_fraud = min(args.n_fraud, int((scored["fraudulent"] == 1).sum()))
    n_legit = min(args.n_legit, int((scored["fraudulent"] == 0).sum()))
    sample = pd.concat(
        [
            scored[scored["fraudulent"] == 1].sample(n_fraud, random_state=args.seed),
            scored[scored["fraudulent"] == 0].sample(n_legit, random_state=args.seed),
        ]
    ).sample(frac=1, random_state=args.seed)

    def flag(v) -> int:
        return 1 if pd.notna(v) and int(v) == 1 else 0

    out_records = []
    for row in sample.to_dict("records"):
        rec = {"job_id": int(row["job_id"])}
        for col in TEXT_COLUMNS + CAT_COLUMNS:
            rec[col] = clean_for_display(row.get(col))
        for col in BINARY_COLUMNS:
            rec[col] = flag(row.get(col))
        rec["fraudulent"] = int(row["fraudulent"])
        rec["fraud_probability"] = round(float(row["_proba"]), 4)
        out_records.append(rec)

    out = Path(args.export)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(out_records, ensure_ascii=False), encoding="utf-8")  # wajib utf-8, default Windows adalah cp1252
    print(f"{len(out_records)} lowongan ({n_fraud} fraud, {n_legit} legit) ditulis ke {out}")


if __name__ == "__main__":
    main()