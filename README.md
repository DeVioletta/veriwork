# VeriWork ML Demo

Demo integrasi model machine learning ke Next.js: memprediksi apakah lowongan kerja
legitimate atau fraudulent, memakai dataset Kaggle "Real / Fake Job Posting Prediction" (EMSCAD).

## Arsitektur

```
Browser  ->  Next.js (UI + route /api/predict)  ->  FastAPI (model_service/serve.py)  ->  XGBoost
```

- `app/`, `components/`, `lib/`: aplikasi Next.js (App Router, TypeScript, Tailwind v4).
- `app/api/predict/route.ts`: satu-satunya titik integrasi. Meneruskan data lowongan ke service model.
- `model_service/`: inferensi (`serve.py`), pra-pemrosesan (`preprocessing.py`), dan ekspor data UI (`export_jobs.py`).
  Tidak ada pelatihan di sini; model dilatih di notebook.
- `data/jobs.json`: data lowongan yang ditampilkan di UI.

Kontrak antara Next.js dan model:

```
POST /predict  <- field dataset (title, location, ..., telecommuting, has_company_logo, has_questions)
               -> { label, fraud_probability, confidence, threshold, signals[] }
GET  /health   -> { model_name, threshold, metrics{...} | null }
```

## Artefak model

Salin tiga file dari notebook ke `model_service/artifacts/` (folder dibuat manual):

```
model_service/artifacts/xgboost_model.json
model_service/artifacts/preprocessor.pkl
model_service/artifacts/tfidf.pkl
```

Ketiganya harus berasal dari satu proses pelatihan yang sama. Versi scikit-learn di environment
Python ini harus sama dengan yang dipakai di Colab (lihat `print(sklearn.__version__)` di notebook).

## Menjalankan

Prasyarat: Node.js 20.9+ dan Python 3.10+.

**1. Ekspor data UI dan metrik (sekali saja)**

Taruh `fake_job_postings.csv` di `model_service/`, lalu:

```bash
cd model_service
pip install -r requirements.txt
python export_jobs.py
```

Skrip ini mereproduksi data uji notebook (`test_size=0.2, random_state=42, stratify=y`), menskornya
dengan model Anda, menulis `artifacts/model_info.json` (metrik) dan menimpa `data/jobs.json`
dengan 200 lowongan sampel dari data uji (40 fraud, 160 legit).

**2. Jalankan service model** (terminal 1, di `model_service/`)

```bash
uvicorn serve:app --port 8000
```

**3. Jalankan Next.js** (terminal 2, dari root proyek)

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Jika service model berjalan di alamat lain, salin `.env.example`
menjadi `.env.local` dan ubah `MODEL_API_URL`.

## Catatan penting

- `data/jobs.json` bawaan hanya 6 lowongan contoh dari rancangan HTML, bukan data EMSCAD asli,
  dan belum punya skor. Jalankan `export_jobs.py` untuk menggantinya.
- Model dilatih pada teks bahasa Inggris. Input bahasa Indonesia tidak akan diprediksi dengan andal.
- Dataset tidak punya kolom nama perusahaan maupun tanggal posting, jadi UI tidak menampilkannya.
- Threshold 0.5 didefinisikan di `model_service/preprocessing.py` (`THRESHOLD`) dan `lib/risk.ts`
  (`FRAUD_THRESHOLD`). Keduanya harus sama.
- "Faktor yang paling mempengaruhi" dihitung dari nilai SHAP XGBoost, hanya untuk fitur yang aktif
  pada lowongan tersebut (kata yang muncul, kategori yang dipilih, dan tiga fitur biner).
- `preprocessing.py` adalah salinan pipeline notebook. Jika notebook diubah, ubah file itu juga.
- XGBoost dilatih pada matriks SPARSE, jadi fitur dikirim ke model sebagai sparse (nol dianggap "hilang").
  Mengubahnya menjadi dense mengubah prediksi secara drastis.
