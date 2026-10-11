import { Dices } from 'lucide-react';

export default function ProbabilityMatrix({ runs }) {
  if (!runs.length) {
    return <p className="text-sm text-muted-foreground">No simulations run yet. Fire the Quantum-Simulation Pod.</p>;
  }
  return (
    <div className="space-y-3">
      {runs.map((r) => (
        <div key={r.id} className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Dices className="size-4 text-slate-500" />
            <h3 className="font-semibold tracking-tight">{r.subject_name}</h3>
            <span className="text-[10px] uppercase tracking-wide rounded-md bg-muted px-2 py-0.5 text-muted-foreground">{r.subject_type}</span>
            <span className="ml-auto flex items-baseline gap-1 text-xs text-muted-foreground">
              success <span className="text-xl font-semibold tabular-nums text-foreground">{r.success_probability}%</span>
            </span>
          </div>
          {(r.scenarios || []).length > 0 && (
            <div className="space-y-2 mt-3">
              {r.scenarios.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate" title={s.scenario}>{s.scenario}</div>
                    <div className="text-[11px] text-muted-foreground truncate" title={s.outcome}>{s.outcome}</div>
                  </div>
                  <div className="w-28 shrink-0 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.max(0, Math.min(100, s.probability))}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs tabular-nums shrink-0">{s.probability}%</span>
                </div>
              ))}
            </div>
          )}
          {r.optimal_path && (
            <p className="text-xs mt-3 rounded-lg bg-emerald-500/5 border border-emerald-500/30 p-3 leading-relaxed"><span className="font-semibold">Optimal Path:</span> {r.optimal_path}</p>
          )}
          {(r.failure_modes || []).length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Failure Modes</div>
              <ul className="space-y-1">{r.failure_modes.map((f, i) => <li key={i} className="flex gap-2 text-xs"><span className="size-1 rounded-full bg-rose-500 mt-1.5 shrink-0" />{f}</li>)}</ul>
            </div>
          )}
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-3">{r.scenario_count} branches · simulated {r.simulated_date}</div>
        </div>
      ))}
    </div>
  );
}