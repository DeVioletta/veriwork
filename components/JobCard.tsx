import type { Job } from '@/lib/types';
import { getRiskTheme } from '@/lib/risk';
import { initials } from '@/lib/utils';
import Icon from './Icon';

export default function JobCard({ job, onOpen }: { job: Job; onOpen: (id: number) => void }) {
  const theme = getRiskTheme(job.fraud_probability);

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 ${theme.borderClass} hover:shadow-md transition-all duration-200 p-5 sm:p-6 group`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-slate-800 to-slate-950 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            {initials(job.title)}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono">#{job.job_id}</span>
              {job.department && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-700">{job.department}</span>
                </>
              )}
            </div>

            <h3
              onClick={() => onOpen(job.job_id)}
              className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-sky-600 cursor-pointer transition-colors leading-snug"
            >
              {job.title}
            </h3>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
              <div className="flex items-center gap-1 font-semibold text-emerald-700">
                <Icon name="dollar" className="w-3.5 h-3.5 text-emerald-600" />
                <span>{job.salary_range || 'Gaji tidak dicantumkan'}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <Icon name="pin" className="w-3.5 h-3.5" />
                <span>{job.location || 'Lokasi tidak dicantumkan'}</span>
              </div>
              <div
                className={`flex items-center gap-1 ${
                  job.telecommuting ? 'text-sky-700 font-medium' : 'text-slate-500'
                }`}
              >
                <Icon name="desktop" className="w-3.5 h-3.5" />
                <span>{job.telecommuting ? 'Remote (Telecommuting)' : 'Di Kantor (On-site)'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold border ${theme.badgeClass} flex items-center gap-1.5 shadow-xs`}
          >
            <Icon name="shield" className="w-3.5 h-3.5" />
            <span>{theme.badgeText}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed sm:pl-16">
        {job.description}
      </p>

      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 sm:pl-16">
        <div className="flex flex-wrap items-center gap-1.5">
          {[job.employment_type, job.required_experience, job.industry]
            .filter(Boolean)
            .map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-700 font-medium truncate max-w-[180px]"
              >
                {tag}
              </span>
            ))}
        </div>

        <button
          onClick={() => onOpen(job.job_id)}
          className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-1"
        >
          <span>Lihat Detail</span>
          <Icon name="chevronRight" className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
