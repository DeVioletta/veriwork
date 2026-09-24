'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Job, Prediction } from '@/lib/types';
import { FRAUD_THRESHOLD, SAFE_MAX, pct } from '@/lib/risk';
import { salaryValue } from '@/lib/utils';
import Icon from './Icon';
import JobCard from './JobCard';
import JobDetailModal from './JobDetailModal';

type Tele = 'ALL' | 'REMOTE' | 'ONSITE';
type Risk = 'ALL' | 'SAFE' | 'MEDIUM' | 'HIGH';
type Sort = 'DEFAULT' | 'SAFETY_HIGH' | 'RISK_HIGH' | 'SALARY_HIGH';

const PAGE_SIZE = 20;
const EMP_TYPES = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Other'];
const EXP_LEVELS = [
  'Entry level',
  'Associate',
  'Mid-Senior level',
  'Director',
  'Executive',
  'Internship',
  'Not Applicable',
];

export default function JobBoard({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [keyword, setKeyword] = useState('');
  const [locQuery, setLocQuery] = useState('');
  const [risk, setRisk] = useState<Risk>('ALL');
  const [exp, setExp] = useState('ALL');
  const [empTypes, setEmpTypes] = useState<string[]>([]);
  const [tele, setTele] = useState<Tele>('ALL');
  const [logoOnly, setLogoOnly] = useState(false);
  const [sort, setSort] = useState<Sort>('DEFAULT');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const loc = locQuery.trim().toLowerCase();

    const list = jobs.filter((job) => {
      const p = job.fraud_probability;

      const textMatch =
        !kw ||
        [job.title, job.department, job.industry, job.function, job.description]
          .join(' ')
          .toLowerCase()
          .includes(kw);

      const locMatch =
        !loc || job.location.toLowerCase().includes(loc) || (loc === 'remote' && job.telecommuting === 1);

      let riskMatch = true;
      if (risk !== 'ALL') {
        if (p === null) riskMatch = false;
        else if (risk === 'SAFE') riskMatch = p < SAFE_MAX;
        else if (risk === 'MEDIUM') riskMatch = p >= SAFE_MAX && p < FRAUD_THRESHOLD;
        else riskMatch = p >= FRAUD_THRESHOLD;
      }

      const empMatch = empTypes.length === 0 || empTypes.includes(job.employment_type);
      const expMatch = exp === 'ALL' || job.required_experience === exp;
      const teleMatch =
        tele === 'ALL' || (tele === 'REMOTE' ? job.telecommuting === 1 : job.telecommuting === 0);
      const logoMatch = !logoOnly || job.has_company_logo === 1;

      return textMatch && locMatch && riskMatch && empMatch && expMatch && teleMatch && logoMatch;
    });

    // Job yang belum dianalisis selalu di akhir saat diurutkan berdasarkan risiko.
    const prob = (j: Job, fallback: number) => j.fraud_probability ?? fallback;
    if (sort === 'SAFETY_HIGH') list.sort((a, b) => prob(a, 2) - prob(b, 2));
    else if (sort === 'RISK_HIGH') list.sort((a, b) => prob(b, -1) - prob(a, -1));
    else if (sort === 'SALARY_HIGH')
      list.sort((a, b) => salaryValue(b.salary_range) - salaryValue(a.salary_range));

    return list;
  }, [jobs, keyword, locQuery, risk, exp, empTypes, tele, logoOnly, sort]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [keyword, locQuery, risk, exp, empTypes, tele, logoOnly, sort]);

  const selectedJob = jobs.find((j) => j.job_id === selectedId) ?? null;

  function handleScored(jobId: number, prediction: Prediction) {
    setJobs((prev) =>
      prev.map((j) => (j.job_id === jobId ? { ...j, fraud_probability: prediction.fraud_probability } : j)),
    );
  }

  function resetAll() {
    setKeyword('');
    setLocQuery('');
    setRisk('ALL');
    setExp('ALL');
    setEmpTypes([]);
    setTele('ALL');
    setLogoOnly(false);
    setSort('DEFAULT');
  }

  function toggleEmpType(type: string) {
    setEmpTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  const scoredCount = jobs.filter((j) => j.fraud_probability !== null).length;

  return (
    <div>
      {/* HERO */}
      <section className="bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-sky-300 text-xs font-medium border border-white/10 backdrop-blur-xs">
            <Icon name="shield" className="w-4 h-4 text-emerald-400" />
            <span>Setiap lowongan sudah dicek tingkat keamanannya</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Cari Lowongan, Cek Risiko <span className="text-sky-400">Lowongan Palsu</span>
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base font-normal">
            Setiap lowongan punya skor keamanan. Kamu juga bisa memasukkan lowongan sendiri untuk
            dicek.
          </p>

          <div className="mt-8 bg-white p-2.5 sm:p-3 rounded-2xl shadow-2xl border border-slate-100/20 max-w-4xl mx-auto text-slate-800 text-left">
            <form
              className="grid grid-cols-1 md:grid-cols-12 gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="md:col-span-6 relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                  <Icon name="search" />
                </div>
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-transparent text-sm font-medium border-0 focus:ring-0 placeholder:text-slate-400 rounded-lg"
                  placeholder="Posisi, industri, atau kata kunci..."
                  type="text"
                />
              </div>
              <div className="md:col-span-6 relative flex items-center md:border-l md:border-slate-200">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                  <Icon name="pin" />
                </div>
                <input
                  value={locQuery}
                  onChange={(e) => setLocQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-transparent text-sm font-medium border-0 focus:ring-0 placeholder:text-slate-400 rounded-lg"
                  placeholder="Lokasi, contoh: US, CA atau 'Remote'..."
                  type="text"
                />
              </div>
            </form>

            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-600">Paling dicari:</span>
              {['Engineer', 'Marketing', 'Customer', 'Finance'].map((k) => (
                <button
                  key={k}
                  onClick={() => setKeyword(k)}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  {k}
                </button>
              ))}
              <button
                onClick={() => setTele('REMOTE')}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Remote / WFH
              </button>
              <button onClick={resetAll} className="text-sky-600 hover:underline ml-auto text-xs font-semibold">
                Reset Filter
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* KONTEN */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* SIDEBAR */}
          {showFilters && (
          <aside className="lg:col-span-3 space-y-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:sticky lg:top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Icon name="filter" className="w-4 h-4 text-slate-600" />
                <h3 className="font-bold text-slate-900 text-sm">Filter Pencarian</h3>
              </div>
              <button onClick={resetAll} className="text-xs text-sky-600 hover:underline font-semibold">
                Reset
              </button>
            </div>

            <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl space-y-2">
              <label className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                <Icon name="shield" className="w-3.5 h-3.5 text-sky-600" />
                Tingkat Risiko (Model)
              </label>
              <select
                value={risk}
                onChange={(e) => setRisk(e.target.value as Risk)}
                className="w-full text-xs bg-white border-slate-200 rounded-lg text-slate-700 py-1.5 focus:ring-sky-600 focus:border-sky-600"
              >
                <option value="ALL">Semua Tingkat Risiko</option>
                <option value="SAFE">Risiko Rendah (&lt; {pct(SAFE_MAX)}%)</option>
                <option value="MEDIUM">
                  Perlu Waspada ({pct(SAFE_MAX)}% - {pct(FRAUD_THRESHOLD) - 1}%)
                </option>
                <option value="HIGH">Risiko Tinggi (≥ {pct(FRAUD_THRESHOLD)}%)</option>
              </select>
              <p className="text-[10px] text-sky-800 leading-tight">
                Filter ini hanya berlaku untuk lowongan yang sudah punya skor model.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Tipe Pekerjaan
              </label>
              <div className="space-y-1.5">
                {EMP_TYPES.map((t) => (
                  <label
                    key={t}
                    className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                  >
                    <input
                      type="checkbox"
                      checked={empTypes.includes(t)}
                      onChange={() => toggleEmpType(t)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Model Kerja
              </label>
              <div className="space-y-1.5">
                {(
                  [
                    ['ALL', 'Semua Model (Remote & On-site)'],
                    ['REMOTE', 'Hanya Remote / Telecommuting'],
                    ['ONSITE', 'Hanya On-site di Kantor'],
                  ] as [Tele, string][]
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                  >
                    <input
                      type="radio"
                      name="filter-tele"
                      checked={tele === value}
                      onChange={() => setTele(value)}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Pengalaman Kerja
              </label>
              <select
                value={exp}
                onChange={(e) => setExp(e.target.value)}
                className="w-full text-xs bg-slate-50 border-slate-200 rounded-lg text-slate-700 py-2 focus:ring-sky-600"
              >
                <option value="ALL">Semua Tingkat Pengalaman</option>
                {EXP_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <hr className="border-slate-100" />

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900">
              <input
                type="checkbox"
                checked={logoOnly}
                onChange={(e) => setLogoOnly(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Hanya yang memiliki logo perusahaan</span>
            </label>
          </aside>
          )}

          {/* DAFTAR */}
          <div className={showFilters ? 'lg:col-span-9 space-y-4' : 'lg:col-span-12 space-y-4'}>
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Lowongan Pekerjaan</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
                    {filtered.length} Posisi
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  {scoredCount} dari {jobs.length} lowongan sudah punya skor keamanan.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Icon name="filter" className="w-3.5 h-3.5 text-slate-500" />
                  {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
                </button>
                <span className="text-xs font-medium text-slate-500">Urutkan:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="text-xs bg-slate-50 border-slate-200 rounded-lg text-slate-700 py-1.5 focus:ring-sky-600 font-medium"
                >
                  <option value="DEFAULT">Urutan Dataset</option>
                  <option value="SAFETY_HIGH">Risiko Terendah Dulu</option>
                  <option value="RISK_HIGH">Risiko Tertinggi Dulu</option>
                  <option value="SALARY_HIGH">Gaji Tertinggi</option>
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Icon name="search" className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-base">
                  Tidak ada lowongan yang sesuai kriteria
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Coba hapus beberapa filter atau gunakan kata kunci yang lebih umum.
                </p>
                <button
                  onClick={resetAll}
                  className="mt-4 px-4 py-2 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-lg text-xs font-semibold transition-colors"
                >
                  Reset Semua Filter
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.slice(0, visible).map((job) => (
                  <JobCard key={job.job_id} job={job} onOpen={setSelectedId} />
                ))}
                {filtered.length > visible && (
                  <button
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    className="w-full py-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Tampilkan lebih banyak ({filtered.length - visible} tersisa)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedJob && (
        <JobDetailModal
          key={selectedJob.job_id}
          job={selectedJob}
          onClose={() => setSelectedId(null)}
          onScored={handleScored}
        />
      )}
    </div>
  );
}