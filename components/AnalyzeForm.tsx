'use client';

import { useEffect, useRef, useState } from 'react';
import type { JobInput, ModelInfo, Prediction } from '@/lib/types';
import { fetchModelInfo, requestPrediction } from '@/lib/api';
import Icon from './Icon';
import ResultCard from './ResultCard';

const EMPTY: JobInput = {
  title: '',
  location: '',
  department: '',
  salary_range: '',
  company_profile: '',
  description: '',
  requirements: '',
  benefits: '',
  employment_type: '',
  required_experience: '',
  required_education: '',
  industry: '',
  function: '',
  telecommuting: 0,
  has_company_logo: 1,
  has_questions: 1,
};

// Model dilatih pada teks bahasa Inggris, jadi contoh juga berbahasa Inggris.
const PRESETS: Record<'legitimate' | 'suspicious', JobInput> = {
  legitimate: {
    title: 'Product Designer - SaaS Platforms',
    location: 'US, CA, San Francisco',
    department: 'Product & Design',
    salary_range: '95000-130000',
    company_profile:
      'Finovasi is a payments startup building financial dashboards for small businesses across Southeast Asia and North America.',
    description:
      'You will create user flows, wireframes and high-fidelity designs in Figma, maintain our design system, and run usability testing sessions for our analytics dashboard together with product managers and engineers.',
    requirements:
      '3+ years of experience in UI/UX design for web applications. Strong Figma skills, experience with design systems, and a portfolio of shipped product work. Basic understanding of HTML and CSS.',
    benefits:
      'Private health insurance, 401(k) matching, laptop allowance, and flexible working arrangements.',
    employment_type: 'Full-time',
    required_experience: 'Mid-Senior level',
    required_education: "Bachelor's Degree",
    industry: 'Information Technology and Services',
    function: 'Design',
    telecommuting: 1,
    has_company_logo: 1,
    has_questions: 1,
  },
  suspicious: {
    title: 'Work from Home Account Manager / Immediate Cash Handler',
    location: 'US, NV, Las Vegas',
    department: 'Payment Processing',
    salary_range: '110000-140000',
    company_profile: 'Global Asset Remittance Syndicate.',
    description:
      'Looking for urgent agents to receive cashier checks into personal checking accounts and disburse via wire within 24 hours. Keep 12% commission per payout. No experience needed.',
    requirements: 'Personal checking account required. Fast SMS response.',
    benefits: '$1,000/week guaranteed plus wire commission percentages.',
    employment_type: 'Part-time',
    required_experience: 'Entry level',
    required_education: 'High School or equivalent',
    industry: 'Financial Services',
    function: 'Finance',
    telecommuting: 1,
    has_company_logo: 0,
    has_questions: 0,
  },
};

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Other'];
const EXPERIENCE_LEVELS = [
  'Internship',
  'Entry level',
  'Associate',
  'Mid-Senior level',
  'Director',
  'Executive',
  'Not Applicable',
];
const EDUCATION_LEVELS = [
  'High School or equivalent',
  'Vocational',
  'Certification',
  'Associate Degree',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate',
];

const inputCls =
  'w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none placeholder:text-slate-400';
const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5';

export default function AnalyzeForm() {
  const [form, setForm] = useState<JobInput>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Prediction | null>(null);
  const [model, setModel] = useState<ModelInfo | null | undefined>(undefined); // undefined = memuat
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchModelInfo().then(setModel);
  }, []);

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [result]);

  const set = <K extends keyof JobInput>(key: K, value: JobInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await requestPrediction(form));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan tidak dikenal.');
    } finally {
      setLoading(false);
    }
  }

  function loadPreset(type: 'legitimate' | 'suspicious') {
    setForm(PRESETS[type]);
    setResult(null);
    setError(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold mb-2">
            <Icon name="document" className="w-3.5 h-3.5" />
            Input Manual ke Model
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Analisis Lowongan Baru</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Isi field sesuai variabel dataset. Data dikirim ke model dan hasilnya berupa probabilitas
            legitimate atau fraudulent. Lowongan tidak disimpan.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => loadPreset('legitimate')}
            className="text-xs px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg border border-emerald-200 transition-colors flex items-center gap-1.5"
          >
            <Icon name="checkCircle" className="w-3.5 h-3.5" />
            Contoh Biasa
          </button>
          <button
            type="button"
            onClick={() => loadPreset('suspicious')}
            className="text-xs px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5"
          >
            <Icon name="warning" className="w-3.5 h-3.5" />
            Contoh Mencurigakan
          </button>
        </div>
      </div>

      <ModelStatus model={model} />

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label className={labelCls}>
            Judul Lowongan (title) <span className="text-rose-500">*</span>
          </label>
          <input
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className={inputCls}
            placeholder="Contoh: Senior Full Stack Engineer"
            type="text"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Lokasi (location)</label>
            <input
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              className={inputCls}
              placeholder="Format dataset: US, CA, San Francisco"
              type="text"
            />
          </div>
          <div>
            <label className={labelCls}>Departemen (department)</label>
            <input
              value={form.department}
              onChange={(e) => set('department', e.target.value)}
              className={inputCls}
              placeholder="Contoh: Engineering"
              type="text"
            />
          </div>
          <div>
            <label className={labelCls}>Rentang Gaji (salary_range)</label>
            <input
              value={form.salary_range}
              onChange={(e) => set('salary_range', e.target.value)}
              className={inputCls}
              placeholder="Format dataset: 60000-80000"
              type="text"
            />
          </div>
          <div>
            <label className={labelCls}>Industri (industry)</label>
            <input
              value={form.industry}
              onChange={(e) => set('industry', e.target.value)}
              className={inputCls}
              placeholder="Contoh: Information Technology and Services"
              type="text"
            />
          </div>
          <div>
            <label className={labelCls}>Fungsi (function)</label>
            <input
              value={form.function}
              onChange={(e) => set('function', e.target.value)}
              className={inputCls}
              placeholder="Contoh: Engineering, Sales, Marketing"
              type="text"
            />
          </div>
          <div>
            <label className={labelCls}>Tipe Pekerjaan (employment_type)</label>
            <select
              value={form.employment_type}
              onChange={(e) => set('employment_type', e.target.value)}
              className={inputCls}
            >
              <option value="">Tidak ditentukan</option>
              {EMPLOYMENT_TYPES.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Pengalaman (required_experience)</label>
            <select
              value={form.required_experience}
              onChange={(e) => set('required_experience', e.target.value)}
              className={inputCls}
            >
              <option value="">Tidak ditentukan</option>
              {EXPERIENCE_LEVELS.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Pendidikan (required_education)</label>
            <select
              value={form.required_education}
              onChange={(e) => set('required_education', e.target.value)}
              className={inputCls}
            >
              <option value="">Tidak ditentukan</option>
              {EDUCATION_LEVELS.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Fitur Biner Dataset
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                ['telecommuting', 'Telecommuting (remote)'],
                ['has_company_logo', 'Memiliki logo perusahaan'],
                ['has_questions', 'Memiliki pertanyaan skrining'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={form[key] === 1}
                  onChange={(e) => set(key, e.target.checked ? 1 : 0)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-600"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Profil Perusahaan (company_profile)</label>
            <textarea
              rows={2}
              value={form.company_profile}
              onChange={(e) => set('company_profile', e.target.value)}
              className={inputCls}
              placeholder="Tentang perusahaan..."
            />
          </div>
          <div>
            <label className={labelCls}>
              Deskripsi Pekerjaan (description) <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className={inputCls}
              placeholder="Rincian tugas sehari-hari..."
            />
          </div>
          <div>
            <label className={labelCls}>Kualifikasi (requirements)</label>
            <textarea
              rows={3}
              value={form.requirements}
              onChange={(e) => set('requirements', e.target.value)}
              className={inputCls}
              placeholder="Keahlian dan syarat yang dibutuhkan..."
            />
          </div>
          <div>
            <label className={labelCls}>Benefit (benefits)</label>
            <textarea
              rows={2}
              value={form.benefits}
              onChange={(e) => set('benefits', e.target.value)}
              className={inputCls}
              placeholder="Tunjangan dan fasilitas..."
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Model dilatih pada teks berbahasa Inggris. Teks berbahasa Indonesia akan menghasilkan
          prediksi yang tidak dapat diandalkan.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Icon name="sparkle" />
          <span>{loading ? 'Menganalisis...' : 'Analisis dengan Model'}</span>
        </button>
      </form>

      {loading && (
        <div className="mt-6 p-6 bg-slate-900 text-white rounded-xl text-center space-y-3">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-slate-700 border-t-sky-400 rounded-full" />
          <p className="font-semibold text-sm">Mengirim data ke model...</p>
          <p className="text-xs text-slate-400 font-mono">POST /api/predict</p>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <div ref={resultRef} className="scroll-mt-24">
        {result && (
          <div className="mt-6">
            <ResultCard prediction={result} />
          </div>
        )}
      </div>
    </div>
  );
}

function ModelStatus({ model }: { model: ModelInfo | null | undefined }) {
  if (model === undefined) {
    return <p className="mt-4 text-xs text-slate-400">Memeriksa service model...</p>;
  }
  if (model === null) {
    return (
      <div className="mt-4 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs">
        Service model tidak dapat dihubungi. Jalankan{' '}
        <code className="font-mono">uvicorn serve:app --port 8000</code> dari folder{' '}
        <code className="font-mono">model_service</code>, lalu muat ulang halaman ini.
      </div>
    );
  }
  const m = model.metrics;
  return (
    <div className="mt-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="flex items-center gap-1.5 font-semibold">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        Model aktif: {model.model_name}
      </span>
      {m ? (
        <span className="font-mono">
          Data uji (kelas fraud): precision {m.precision.toFixed(2)} | recall {m.recall.toFixed(2)} | F1{' '}
          {m.f1.toFixed(2)} | ROC-AUC {m.roc_auc.toFixed(2)}
        </span>
      ) : (
        <span>
          Metrik belum tersedia. Jalankan <code className="font-mono">python export_jobs.py</code>.
        </span>
      )}
    </div>
  );
}
