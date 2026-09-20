import Link from 'next/link';
import AnalyzeForm from '@/components/AnalyzeForm';
import Icon from '@/components/Icon';

export const metadata = { title: 'Analisis Lowongan Baru | VeriWork' };

export default function AnalyzePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors"
      >
        <Icon name="back" />
        Kembali ke Daftar Lowongan
      </Link>
      <AnalyzeForm />
    </div>
  );
}
