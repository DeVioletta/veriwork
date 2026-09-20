import type { Signal } from '@/lib/types';
import { signalLabel } from '@/lib/risk';

/** Fitur yang paling mempengaruhi prediksi (koefisien model linear x bobot TF-IDF). */
export default function Signals({ signals }: { signals: Signal[] }) {
  const toFraud = signals.filter((s) => s.weight > 0);
  const toLegit = signals.filter((s) => s.weight < 0);
  if (toFraud.length === 0 && toLegit.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <SignalColumn
        title="Mendorong ke fraudulent"
        items={toFraud}
        chipClass="bg-rose-50 text-rose-700 border-rose-200"
      />
      <SignalColumn
        title="Mendorong ke legitimate"
        items={toLegit}
        chipClass="bg-emerald-50 text-emerald-700 border-emerald-200"
      />
    </div>
  );
}

function SignalColumn({
  title,
  items,
  chipClass,
}: {
  title: string;
  items: Signal[];
  chipClass: string;
}) {
  return (
    <div>
      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
        {title}
      </h5>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">Tidak ada sinyal menonjol.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((s) => (
            <span
              key={s.term}
              className={`px-2 py-0.5 rounded-md border text-[11px] font-medium ${chipClass}`}
              title={`kontribusi ${s.weight > 0 ? '+' : ''}${s.weight.toFixed(2)}`}
            >
              {signalLabel(s.term)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
