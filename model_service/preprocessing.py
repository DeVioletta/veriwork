"""Pra-pemrosesan yang meniru PERSIS notebook pelatihan (ProjekDeepLearning.ipynb):
gabung 5 kolom teks -> clean_text (NLTK) -> TF-IDF, kolom kategorikal dan biner -> preprocessor.
Jangan mengubah logika di sini tanpa mengubah notebook, karena model dilatih dengan pipeline ini."""

import html
import math
import re

import nltk
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix, hstack

# Sumber daya NLTK yang sama dengan notebook. Gagal unduh (offline) diabaikan bila data sudah ada.
for _res in ("punkt", "punkt_tab", "stopwords", "wordnet"):
    try:
        nltk.download(_res, quiet=True)
    except Exception:  # noqa: BLE001
        pass

from nltk.corpus import stopwords  # noqa: E402
from nltk.stem import WordNetLemmatizer  # noqa: E402
from nltk.tokenize import word_tokenize  # noqa: E402

# Harus sama dengan FRAUD_THRESHOLD di lib/risk.ts
THRESHOLD = 0.5

TEXT_COLUMNS = ["title", "company_profile", "description", "requirements", "benefits"]
CAT_COLUMNS = [
    "location",
    "department",
    "salary_range",
    "employment_type",
    "required_experience",
    "required_education",
    "industry",
    "function",
]
BINARY_COLUMNS = ["telecommuting", "has_company_logo", "has_questions"]

BINARY_LABELS = {
    ("telecommuting", 1): "remote (telecommuting)",
    ("telecommuting", 0): "on-site",
    ("has_company_logo", 1): "ada logo perusahaan",
    ("has_company_logo", 0): "tanpa logo perusahaan",
    ("has_questions", 1): "ada pertanyaan skrining",
    ("has_questions", 0): "tanpa pertanyaan skrining",
}

_STOP_WORDS = set(stopwords.words("english"))
_LEMMATIZER = WordNetLemmatizer()


def clean_text(text: str) -> str:
    """Salinan persis fungsi clean_text di notebook."""
    text = text.lower()
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"http[s]?://\S+", " ", text)
    text = re.sub(r"\S+@\S+", " ", text)
    text = re.sub(r"[^a-z\s]", " ", text)
    tokens = word_tokenize(text)
    tokens = [
        _LEMMATIZER.lemmatize(w) for w in tokens if w not in _STOP_WORDS and len(w) > 2
    ]
    return " ".join(tokens)


# Pemanasan: lazy-loading WordNet tidak aman dipanggil pertama kali dari banyak thread.
clean_text("warm up engineer jobs")


def _s(value) -> str:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return ""
    return str(value)


def _flag(value) -> int:
    try:
        return 1 if int(float(value)) == 1 else 0
    except (TypeError, ValueError):
        return 0


def build_cat_frame(records: list[dict]) -> pd.DataFrame:
    """Kolom kategorikal kosong -> 'missing', biner kosong -> 0 (sama dengan notebook)."""
    rows = []
    for r in records:
        row = {}
        for c in CAT_COLUMNS:
            v = _s(r.get(c))
            row[c] = v if v.strip() else "missing"
        for c in BINARY_COLUMNS:
            row[c] = _flag(r.get(c))
        rows.append(row)
    return pd.DataFrame(rows, columns=CAT_COLUMNS + BINARY_COLUMNS)


def build_matrix(records: list[dict], tfidf, preprocessor) -> csr_matrix:
    """Matriks fitur SPARSE (CSR, float32) dengan urutan kolom [TF-IDF | one-hot | biner].

    Model XGBoost dilatih pada matriks sparse hstack([tfidf, cat]). Pada matriks sparse, nol yang tidak
    tersimpan dianggap "hilang" oleh XGBoost, bukan bernilai 0. Jangan diubah menjadi dense, karena
    prediksinya akan berbeda dari saat pelatihan."""
    texts = [clean_text(" ".join(_s(r.get(c)) for c in TEXT_COLUMNS)) for r in records]
    x_text = tfidf.transform(texts)
    x_cat = preprocessor.transform(build_cat_frame(records))
    x = hstack([x_text, x_cat]).tocsr().astype(np.float32)
    x.eliminate_zeros()  # nol eksplisit dihapus agar diperlakukan sama seperti saat pelatihan
    return x


def describe_features(tfidf, preprocessor) -> list[tuple[str, str]]:
    """Daftar (jenis, nama) untuk setiap kolom fitur, dipakai untuk menjelaskan prediksi."""
    names: list[tuple[str, str]] = [("tfidf", str(t)) for t in tfidf.get_feature_names_out()]
    encoder = preprocessor.named_transformers_["cat"]
    for col, cats in zip(CAT_COLUMNS, encoder.categories_):
        for cat in cats:
            value = "kosong" if str(cat) == "missing" else str(cat)
            names.append(("cat", f"{col}: {value}"))
    for col in BINARY_COLUMNS:
        names.append(("binary", col))
    return names


# --- Pembersihan HTML hanya untuk TAMPILAN di UI (tidak mempengaruhi model) ---
_BLOCK_TAGS = re.compile(r"(?i)<\s*(br|/p|/li|/div|/h[1-6]|/ul|/ol)\s*/?>")
_TAGS = re.compile(r"<[^>]+>")
_SPACES = re.compile(r"[ \t\r\f\v]+")
_NEWLINES = re.compile(r"\n\s*\n\s*\n+")


def clean_for_display(value) -> str:
    text = html.unescape(_s(value))
    text = _BLOCK_TAGS.sub("\n", text)
    text = _TAGS.sub(" ", text)
    text = _SPACES.sub(" ", text)
    text = re.sub(r" *\n *", "\n", text)
    text = _NEWLINES.sub("\n\n", text)
    return text.strip()
