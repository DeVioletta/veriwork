// Skema mengikuti kolom dataset "Real / Fake Job Posting Prediction" (EMSCAD).
// Catatan: dataset TIDAK memiliki kolom nama perusahaan.

export type Flag = 0 | 1;

/** Field yang dikirim ke model. */
export interface JobInput {
  title: string;
  location: string;
  department: string;
  salary_range: string;
  company_profile: string;
  description: string;
  requirements: string;
  benefits: string;
  employment_type: string;
  required_experience: string;
  required_education: string;
  industry: string;
  function: string;
  telecommuting: Flag;
  has_company_logo: Flag;
  has_questions: Flag;
}

/** Satu baris lowongan di data/jobs.json. */
export interface Job extends JobInput {
  job_id: number;
  /** Label asli dari dataset (1 = fraudulent). null jika data contoh tanpa label. */
  fraudulent: Flag | null;
  /** Probabilitas fraud dari model. null jika belum dianalisis. */
  fraud_probability: number | null;
}

export interface Signal {
  term: string;
  weight: number;
}

export interface Prediction {
  label: 'fraudulent' | 'legitimate';
  fraud_probability: number;
  confidence: number;
  threshold: number;
  /** Kata/fitur yang paling mendorong ke fraudulent (weight > 0) dan ke legitimate (weight < 0). */
  signals: Signal[];
}

export interface ModelInfo {
  status: string;
  model_name: string;
  trained_at: string;
  threshold: number;
  n_train: number;
  n_test: number;
  metrics: {
    precision: number;
    recall: number;
    f1: number;
    roc_auc: number;
    pr_auc: number;
  };
}
