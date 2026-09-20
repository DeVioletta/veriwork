"""Pembersihan teks dan pembentukan fitur. Dipakai bersama oleh train.py dan serve.py
agar data saat pelatihan dan saat prediksi diproses dengan cara yang persis sama."""

import html
import math
import re

_BLOCK_TAGS = re.compile(r"(?i)<\s*(br|/p|/li|/div|/h[1-6]|/ul|/ol)\s*/?>")
_TAGS = re.compile(r"<[^>]+>")
_URL = re.compile(r"#URL_[A-Za-z0-9]+#")
_EMAIL = re.compile(r"#EMAIL_[A-Za-z0-9]+#")
_PHONE = re.compile(r"#PHONE_[A-Za-z0-9]+#")
_SPACES = re.compile(r"[ \t\r\f\v]+")
_NEWLINES = re.compile(r"\n\s*\n\s*\n+")

TEXT_FIELDS = [
    "title",
    "location",
    "department",
    "salary_range",
    "company_profile",
    "description",
    "requirements",
    "benefits",
    "employment_type",
    "required_experience",
    "required_education",
    "industry",
    "function",
]


def clean_text(value) -> str:
    """Bersihkan HTML dari teks untuk ditampilkan di UI (placeholder #URL_xxx# dibiarkan)."""
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return ""
    text = html.unescape(str(value))
    text = _BLOCK_TAGS.sub("\n", text)
    text = _TAGS.sub(" ", text)
    text = _SPACES.sub(" ", text)
    text = re.sub(r" *\n *", "\n", text)
    text = _NEWLINES.sub("\n\n", text)
    return text.strip()


def _flag(value) -> int:
    try:
        return 1 if int(float(value)) == 1 else 0
    except (TypeError, ValueError):
        return 0


def _slug(value: str) -> str:
    return re.sub(r"\W+", "_", value.strip().lower()).strip("_") or "none"


def to_model_text(job: dict) -> str:
    """Gabungkan semua field lowongan menjadi satu string untuk TF-IDF.

    Field kategorikal dan fitur biner diubah menjadi token buatan berawalan "zz_"
    supaya ikut dipelajari model dan bisa dijelaskan di UI."""
    fields = {f: clean_text(job.get(f)) for f in TEXT_FIELDS}

    body = " . ".join(fields[f] for f in TEXT_FIELDS if fields[f])
    body = _URL.sub(" tok_url ", body)
    body = _EMAIL.sub(" tok_email ", body)
    body = _PHONE.sub(" tok_phone ", body)

    tokens = []
    if not _flag(job.get("has_company_logo")):
        tokens.append("zz_no_logo")
    if not _flag(job.get("has_questions")):
        tokens.append("zz_no_questions")
    if _flag(job.get("telecommuting")):
        tokens.append("zz_remote")
    if not fields["salary_range"]:
        tokens.append("zz_no_salary")
    if not fields["company_profile"]:
        tokens.append("zz_no_profile")

    country = fields["location"].split(",")[0] if fields["location"] else ""
    tokens.append(f"zz_country_{_slug(country)}")
    tokens.append(f"zz_emp_{_slug(fields['employment_type'])}")
    tokens.append(f"zz_exp_{_slug(fields['required_experience'])}")
    tokens.append(f"zz_edu_{_slug(fields['required_education'])}")
    tokens.append(f"zz_ind_{_slug(fields['industry'])}")
    tokens.append(f"zz_fn_{_slug(fields['function'])}")

    return body + " " + " ".join(tokens)
