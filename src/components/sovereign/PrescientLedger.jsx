import { Telescope } from 'lucide-react';

const STATUS_STYLE = {
  predicted: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  staked: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  foundation_building: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  operational: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
};

export default function PrescientLedger({ vectors }) {
  if (!vectors.length) {
    return <p className="text-sm text-muted-foreground">The Oracle has not predicted yet. Run the Prescient Oracle to map the next Gold Rush.</p>;
  }
  return (
    <div className="space-y-3">
      {vectors.map((v) => (
        <div key={v.id} className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Telescope className="size-4 text-slate-500" />
            <h3 className="font-semibold tracking-tight">{v.vector_name}</h3>
            <span className={`text-[10px] uppercase tracking-wide rounded-md border px-2 py-0.5 ${STATUS_STYLE[v.status] || STATUS_STYLE.predicted}`}>{v.status?.replace('_', ' ')}</span>
            {v.sector && <span className="text-[10px] uppercase tracking-wide rounded-md bg-muted px-2 py-0.5 text-muted-foreground">{v.sector}</span>}
          </div>
          <div className="flex flex-wrap items-baseline gap-4 text-xs text-muted-foreground mb-2">
            <span>Conviction <span className="font-semibold text-foreground tabular-nums">{v.conviction_score}/10</span></span>
            <span>Arrival <span className="font-semibold text-foreground tabular-nums">{v.arrival_probability}%</span></span>
            <span>Horizon <span className="font-semibold text-foreground tabular-nums">{v.horizon_months} mo</span></span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{v.gold_rush_thesis}</p>
          {(v.leading_indicators || []).length > 0 && (
            <ul className="mt-3 space-y-1">
              {v.leading_indicators.map((ind, i) => (
                <li key={i} className="flex gap-2 text-xs"><span className="size-1 rounded-full bg-sky-500 mt-1.5 shrink-0" />{ind}</li>
              ))}
            </ul>
          )}
          {(v.staked_assets || []).length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Claims Staked</div>
              <div className="flex flex-wrap gap-1.5">
                {v.staked_assets.map((s, i) => (
                  <span key={i} className="text-[11px] rounded-md bg-background border px-2 py-0.5" title={s.detail}>
                    <span className="font-semibold uppercase text-muted-foreground">{s.type}</span>: {s.detail}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}