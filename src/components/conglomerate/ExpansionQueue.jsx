import { TrendingUp } from 'lucide-react';

export default function ExpansionQueue({ expansions, seedsById }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Expansion Queue</h2>
      </div>
      {expansions.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
          Nothing in the queue. Ghost-validations from the Amplifier rank the next expansion targets here.
        </div>
      ) : (
        <div className="space-y-2">
          {expansions.map((v, i) => {
            const roi = ((v.demand_score || 0) * (v.asym || 0)) / 10;
            return (
              <div key={v.id} className="rounded-xl border bg-white p-4 flex items-start gap-3">
                <div className="text-lg font-bold text-slate-300 w-6 text-center">#{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">{seedsById[v.seed_id] || 'IP-seed'}</div>
                    <span className="text-xs text-muted-foreground">demand {v.demand_score}/10 · asymmetric {v.asym || '—'}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 mt-1">{v.verdict}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-semibold tracking-tight text-emerald-700">{roi.toFixed(1)}</div>
                  <div className="text-[11px] text-muted-foreground">ROI index</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}