import type { JobInput, ModelInfo, Prediction } from './types';

/** Memanggil route Next.js /api/predict, yang meneruskan ke service model Python. */
export async function requestPrediction(input: JobInput): Promise<Prediction> {
  const res = await fetch('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `Permintaan gagal (HTTP ${res.status})`);
  }
  return data as Prediction;
}

/** Info model yang sedang aktif. null jika service model tidak dapat dihubungi. */
export async function fetchModelInfo(): Promise<ModelInfo | null> {
  try {
    const res = await fetch('/api/predict', { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as ModelInfo;
  } catch {
    return null;
  }
}

/** Ambil hanya field yang dibutuhkan model dari objek lowongan. */
export function toInput(job: JobInput): JobInput {
  return {
    title: job.title,
    location: job.location,
    department: job.department,
    salary_range: job.salary_range,
    company_profile: job.company_profile,
    description: job.description,
    requirements: job.requirements,
    benefits: job.benefits,
    employment_type: job.employment_type,
    required_experience: job.required_experience,
    required_education: job.required_education,
    industry: job.industry,
    function: job.function,
    telecommuting: job.telecommuting,
    has_company_logo: job.has_company_logo,
    has_questions: job.has_questions,
  };
}
