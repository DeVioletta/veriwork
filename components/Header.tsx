'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';

const ACTIVE = 'text-sky-600 bg-sky-50/80 font-semibold';
const IDLE = 'text-slate-600 hover:text-slate-900 hover:bg-slate-100';

export default function Header() {
  const pathname = usePathname();
  const onAnalyze = pathname.startsWith('/analyze');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Icon name="shield" className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                Veri<span className="text-sky-600">Work</span>
              </span>
              <p className="text-[11px] text-slate-500 font-medium leading-none hidden sm:block mt-0.5">
                Temukan lowongan, cek keamanannya
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                onAnalyze ? IDLE : ACTIVE
              }`}
            >
              <Icon name="search" />
              Cari Lowongan
            </Link>
            <Link
              href="/analyze"
              className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                onAnalyze ? ACTIVE : IDLE
              }`}
            >
              <Icon name="document" />
              Analisis Lowongan Baru
            </Link>
          </nav>
        </div>

        <Link
          href={onAnalyze ? '/' : '/analyze'}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Icon name={onAnalyze ? 'search' : 'sparkle'} className="w-3.5 h-3.5 text-slate-500" />
          {onAnalyze ? 'Cari Lowongan' : 'Analisis Lowongan'}
        </Link>
      </div>
    </header>
  );
}