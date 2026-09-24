import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm">
                VW
              </div>
              <span className="font-bold text-lg text-slate-900">VeriWork</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bantu kamu menemukan lowongan pekerjaan dan mengecek keamanannya sebelum melamar.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Navigasi
            </h5>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>
                <Link className="hover:text-sky-600" href="/">
                  Jelajahi Lowongan
                </Link>
              </li>
              <li>
                <Link className="hover:text-sky-600" href="/analyze">
                  Analisis Lowongan Baru
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Bantuan
            </h5>
            <p className="text-xs text-slate-500 leading-relaxed">
              Skor keamanan bersifat perkiraan. Tetap periksa perusahaan secara mandiri sebelum
              memberikan data pribadi atau uang.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} VeriWork. Semua hak dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}