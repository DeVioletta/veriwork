'use client';

import { useEffect, useState } from 'react';
import type { Job, Prediction } from '@/lib/types';
import { requestPrediction, toInput } from '@/lib/api';
import { getRiskTheme, pct } from '@/lib/risk';
import { initials } from '@/lib/utils';
import Icon from './Icon';
import Signals from './Signals';

interface Props {
  job: Job;
  onClose: () => void;
  onScored: (jobId: number, prediction: Prediction) => void;
}

export default function JobDetailModal({ job, onClose, onScored }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function runPrediction() {
    setLoading(true);
    setError(null);
    try {
      const result = await requestPrediction(toInput(job));
      setPrediction(result);
      onScored(job.job_id, result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan tidak dikenal.');
    } finally {
      setLoading(false);
    }
  }

  const theme = getRiskTheme(job.fraud_probability);
  const percent = job.fraud_probability === null ? 0 : pct(job.fraud_probability);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 z-10 my-auto">
        {/* Banner skor model */}
        <div className={`p-4 sm:p-5 border-b border-transparent transition-colors ${theme.bannerBg}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${theme.bannerSub}`}>
                Skor Keamanan Lowongan
              </span>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono">
                  {job.fraud_probability === null ? '--%' : `${percent}%`}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-white/20 border-white/30 text-white">
                  {theme.label}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              title="Tutup"
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 flex items-center justify-center shadow-xs transition-colors"
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="mt-3 w-full bg-white/40 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${theme.progressClass}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Header lowongan + aksi */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
              {initials(job.title)}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                {job.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <Icon name="pin" className="w-3.5 h-3.5 text-slate-400" />
                  {job.location || 'Lokasi tidak dicantumkan'}
                </span>
                <span>•</span>
                <span className="font-bold text-emerald-700">
                  {job.salary_range || 'Gaji tidak dicantumkan'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={runPrediction}
            disabled={loading}
            className="self-end sm:self-center px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Icon name="sparkle" />
            <span>{loading ? 'Menganalisis...' : job.fraud_probability === null ? 'Analisis dengan Model' : 'Analisis Ulang'}</span>
          </button>
        </div>

        {/* Isi */}
        <div className="overflow-y-auto custom-scrollbar p-6 space-y-6 flex-1 text-slate-700 text-sm">
          {error && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {prediction && (
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                <span>
                  Klasifikasi model:{' '}
                  <b className="font-mono">{prediction.label.toUpperCase()}</b>
                </span>
                <span>
                  Confidence: <b className="font-mono">{pct(prediction.confidence)}%</b>
                </span>
              </div>
              <Signals signals={prediction.signals} />
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Ringkasan Spesifikasi Pekerjaan
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
              <Spec label="Departemen" value={job.department} />
              <Spec label="Fungsi" value={job.function} />
              <Spec label="Industri" value={job.industry} />
              <Spec label="Tipe Pekerjaan" value={job.employment_type} />
              <Spec label="Pengalaman Dibutuhkan" value={job.required_experience} />
              <Spec label="Tingkat Pendidikan" value={job.required_education} />
              <Spec label="Nomor Referensi (ID)" value={`#${job.job_id}`} mono />
              <Spec
                label="Label Asli Dataset"
                value={
                  job.fraudulent === null
                    ? 'Tidak ada (data contoh)'
                    : job.fraudulent === 1
                      ? 'Fraudulent'
                      : 'Legitimate'
                }
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Fitur Biner Dataset
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <Flag ok={!!job.telecommuting} yes="Telecommuting: Ya (Remote)" no="Telecommuting: On-site" neutral />
              <Flag ok={!!job.has_company_logo} yes="Logo Perusahaan: Ada" no="Logo Perusahaan: Kosong" />
              <Flag ok={!!job.has_questions} yes="Pertanyaan Skrining: Ada" no="Pertanyaan Skrining: Tidak Ada" />
            </div>
          </div>

          <hr className="border-slate-100" />

          <TextBlock title="Tentang Perusahaan" text={job.company_profile} empty="Profil perusahaan tidak dicantumkan." />
          <TextBlock title="Deskripsi Pekerjaan" text={job.description} empty="-" />
          <TextBlock title="Kualifikasi & Persyaratan" text={job.requirements} empty="Tidak dicantumkan." />
          <TextBlock title="Benefit & Fasilitas" text={job.benefits} empty="Tidak dicantumkan." />
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-400">VeriWork</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-slate-400 block mb-0.5">{label}</span>
      <span className={`font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>
        {value || '-'}
      </span>
    </div>
  );
}

function Flag({
  ok,
  yes,
  no,
  neutral,
}: {
  ok: boolean;
  yes: string;
  no: string;
  neutral?: boolean;
}) {
  const good = neutral ? false : ok;
  return (
    <div className="p-2.5 rounded-lg border border-slate-200 flex items-center gap-2 text-xs">
      <Icon
        name={ok ? 'check' : 'close'}
        className={`w-4 h-4 ${
          neutral ? 'text-slate-500' : good ? 'text-emerald-600' : 'text-rose-500'
        }`}
      />
      <span className={ok ? 'font-semibold text-slate-800' : 'text-slate-600'}>
        {ok ? yes : no}
      </span>
    </div>
  );
}

function TextBlock({ title, text, empty }: { title: string; text: string; empty: string }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{title}</h4>
      <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
        {text?.trim() || empty}
      </div>
    </div>
  );
}