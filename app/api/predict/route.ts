import { NextResponse } from 'next/server';

// Route ini adalah jembatan antara UI Next.js dan service model Python (FastAPI).
// Browser tidak pernah berbicara langsung ke service model.
const MODEL_API_URL = process.env.MODEL_API_URL ?? 'http://127.0.0.1:8000';

export const dynamic = 'force-dynamic';

const OFFLINE_MESSAGE =
  'Service model tidak dapat dihubungi. Jalankan "uvicorn serve:app --port 8000" dari folder model_service.';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body request bukan JSON yang valid.' }, { status: 400 });
  }

  const title = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim();
  if (!title || !description) {
    return NextResponse.json(
      { error: 'Field title dan description wajib diisi.' },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${MODEL_API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Service model mengembalikan error (HTTP ${res.status}).` },
        { status: 502 },
      );
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: OFFLINE_MESSAGE }, { status: 503 });
  }
}

// Dipakai halaman analisis untuk menampilkan model yang sedang aktif.
export async function GET() {
  try {
    const res = await fetch(`${MODEL_API_URL}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return NextResponse.json({ error: 'Model tidak sehat.' }, { status: 502 });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: OFFLINE_MESSAGE }, { status: 503 });
  }
}
