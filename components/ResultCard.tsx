import type { Prediction } from '@/lib/types';
import { getRiskTheme, pct } from '@/lib/risk';
import Icon from './Icon';
import Signals from './Signals';

const HEADLINE = {
  HIGH: 'Terindikasi Fraudulent',
  MEDIUM: 'Mencurigakan, verifikasi manual disarankan',
  SAFE: 'Kemungkinan Legitimate',
  UNSCORED: '',
} as const;

export default function ResultCard({ prediction }: { prediction: Prediction }) {
  const theme = getRiskTheme(prediction.fraud_probability);
  const p = pct(prediction.fraud_probability);

  return (
    <div className="space-y-4">
      <div className={`p-5 sm:p-6 rounded-2xl ${theme.bannerBg} shadow-xs`}>
        <span className={`text-[11px] font-bold uppercase tracking-wider ${theme.bannerSub}`}>
          Hasil Prediksi Model
        </span>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-1">
          <span className="text-4xl font-extrabold tracking-tight font-mono">{p}%</span>
          <span className="text-sm font-semibold">probabilitas fraud</span>
        </div>
        <p className="mt-1 text-lg sm:text-xl font-bold">{HEADLINE[theme.tier]}</p>
        <div className="mt-4 w-full bg-white/30 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${theme.progressClass}`}
            style={{ width: `${p}%` }}
          />
        </div>
        <div className={`mt-1 flex justify-between text-[10px] font-mono ${theme.bannerSub}`}>
          <span>0%</span>
          <span>threshold {pct(prediction.threshold)}%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <Stat label="Klasifikasi model" value={prediction.label.toUpperCase()} />
        <Stat label="Confidence" value={`${pct(prediction.confidence)}%`} />
        <Stat label="Probabilitas legitimate" value={`${100 - p}%`} />
      </div>

      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Faktor yang paling mempengaruhi
        </h4>
        <Signals signals={prediction.signals} />
      </div>

      <div className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
        <Icon name="warning" className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
        <p>
          Skor ini bersifat perkiraan, bukan bukti penipuan. Tetap periksa perusahaan secara mandiri
          sebelum melamar atau membagikan data pribadi.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
      <span className="text-slate-400 block mb-0.5">{label}</span>
      <span className="font-mono font-bold text-slate-800 text-sm">{value}</span>
    </div>
  );
}