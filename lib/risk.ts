// Batas tier disamakan dengan threshold klasifikasi model (0.5),
// sehingga label "fraudulent" dari model selalu sama dengan tier HIGH.
export const FRAUD_THRESHOLD = 0.5;
export const SAFE_MAX = 0.3;

export type RiskTier = 'SAFE' | 'MEDIUM' | 'HIGH' | 'UNSCORED';

export interface RiskTheme {
  tier: RiskTier;
  label: string;
  badgeText: string;
  badgeClass: string;
  bannerBg: string;
  bannerSub: string;
  progressClass: string;
  borderClass: string;
}

export const pct = (p: number) => Math.round(p * 100);

export function getRiskTheme(prob: number | null | undefined): RiskTheme {
  if (prob === null || prob === undefined) {
    return {
      tier: 'UNSCORED',
      label: 'Belum Dianalisis',
      badgeText: 'Belum dianalisis',
      badgeClass: 'bg-slate-50 text-slate-500 border-slate-200',
      bannerBg: 'bg-slate-700 text-white',
      bannerSub: 'text-slate-300',
      progressClass: 'bg-slate-400',
      borderClass: 'hover:border-sky-300',
    };
  }
  if (prob >= FRAUD_THRESHOLD) {
    return {
      tier: 'HIGH',
      label: 'Risiko Tinggi',
      badgeText: `Risiko Tinggi (${pct(prob)}%)`,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      bannerBg: 'bg-rose-600 text-white',
      bannerSub: 'text-rose-100',
      progressClass: 'bg-rose-300',
      borderClass: 'hover:border-rose-300',
    };
  }
  if (prob >= SAFE_MAX) {
    return {
      tier: 'MEDIUM',
      label: 'Perlu Waspada',
      badgeText: `Waspada (${pct(prob)}%)`,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      bannerBg: 'bg-amber-500 text-white',
      bannerSub: 'text-amber-100',
      progressClass: 'bg-amber-200',
      borderClass: 'hover:border-amber-300',
    };
  }
  return {
    tier: 'SAFE',
    label: 'Risiko Rendah',
    badgeText: `Risiko Rendah (${pct(prob)}%)`,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bannerBg: 'bg-emerald-600 text-white',
    bannerSub: 'text-emerald-100',
    progressClass: 'bg-emerald-200',
    borderClass: 'hover:border-sky-300',
  };
}

// Nama fitur sudah dibuat mudah dibaca oleh service model (model_service/serve.py).
export function signalLabel(term: string): string {
  return term;
}
