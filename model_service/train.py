"""Latih model, simpan artefak, dan ekspor sampel lowongan ke data/jobs.json.

Cara pakai (dari folder model_service):
    python train.py
Prasyarat: unduh fake_job_postings.csv dari Kaggle ke folder ini.
"""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    classification_report,
    precision_recall_fscore_support,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from features import TEXT_FIELDS, clean_text, to_model_text

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
ARTIFACTS = HERE / "artifacts"
THRESHOLD = 0.5  # harus sama dengan FRAUD_THRESHOLD di lib/risk.ts


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default=str(HERE / "fake_job_postings.csv"))
    ap.add_argument("--export", default=str(ROOT / "data" / "jobs.json"))
    ap.add_argument("--n-fraud", type=int, default=40, help="jumlah lowongan fraud pada sampel UI")
    ap.add_argument("--n-legit", type=int, default=160, help="jumlah lowongan legit pada sampel UI")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        raise SystemExit(f"CSV tidak ditemukan: {csv_path}\nUnduh fake_job_postings.csv dari Kaggle.")

    df = pd.read_csv(csv_path)
    df["text"] = [to_model_text(row) for row in df.to_dict("records")]
    y = df["fraudulent"].astype(int)

    idx_train, idx_test = train_test_split(
        df.index, test_size=0.2, stratify=y, random_state=args.seed
    )

    model = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    ngram_range=(1, 2),
                    min_df=3,
                    max_features=150_000,
                    sublinear_tf=True,
                    stop_words="english",
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    C=5.0, class_weight="balanced", max_iter=2000, solver="liblinear"
                ),
            ),
        ]
    )
    model.fit(df.loc[idx_train, "text"], y[idx_train])

    proba_test = model.predict_proba(df.loc[idx_test, "text"])[:, 1]
    pred_test = (proba_test >= THRESHOLD).astype(int)
    y_test = y[idx_test]

    print(classification_report(y_test, pred_test, target_names=["legitimate", "fraudulent"]))
    p, r, f1, _ = precision_recall_fscore_support(y_test, pred_test, pos_label=1, average="binary")
    metrics = {
        "precision": round(float(p), 4),
        "recall": round(float(r), 4),
        "f1": round(float(f1), 4),
        "roc_auc": round(float(roc_auc_score(y_test, proba_test)), 4),
        "pr_auc": round(float(average_precision_score(y_test, proba_test)), 4),
    }
    print("Metrik kelas fraud pada data uji:", metrics)

    ARTIFACTS.mkdir(exist_ok=True)
    joblib.dump(model, ARTIFACTS / "model.joblib")
    info = {
        "model_name": "TF-IDF + Logistic Regression",
        "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "threshold": THRESHOLD,
        "n_train": int(len(idx_train)),
        "n_test": int(len(idx_test)),
        "metrics": metrics,
    }
    (ARTIFACTS / "metrics.json").write_text(json.dumps(info, indent=2))
    print(f"Model disimpan di {ARTIFACTS}")

    # Ekspor sampel dari DATA UJI saja, supaya skor yang tampil di UI tidak bocor dari data latih.
    test_df = df.loc[idx_test].assign(proba=proba_test)
    n_fraud = min(args.n_fraud, int((test_df["fraudulent"] == 1).sum()))
    n_legit = min(args.n_legit, int((test_df["fraudulent"] == 0).sum()))
    sample = pd.concat(
        [
            test_df[test_df["fraudulent"] == 1].sample(n_fraud, random_state=args.seed),
            test_df[test_df["fraudulent"] == 0].sample(n_legit, random_state=args.seed),
        ]
    ).sample(frac=1, random_state=args.seed)

    def flag(v) -> int:
        return 1 if pd.notna(v) and int(v) == 1 else 0

    records = []
    for row in sample.to_dict("records"):
        rec = {"job_id": int(row["job_id"])}
        for f in TEXT_FIELDS:
            rec[f] = clean_text(row.get(f))
        rec["telecommuting"] = flag(row.get("telecommuting"))
        rec["has_company_logo"] = flag(row.get("has_company_logo"))
        rec["has_questions"] = flag(row.get("has_questions"))
        rec["fraudulent"] = int(row["fraudulent"])
        rec["fraud_probability"] = round(float(row["proba"]), 4)
        records.append(rec)

    out = Path(args.export)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(records, ensure_ascii=False))
    print(f"{len(records)} lowongan ({n_fraud} fraud, {n_legit} legit) ditulis ke {out}")


if __name__ == "__main__":
    main()
