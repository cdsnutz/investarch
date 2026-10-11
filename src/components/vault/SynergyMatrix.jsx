import { Layers } from 'lucide-react';

const STATUS_STYLE = {
  concept: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  prototyping: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  live: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
};

export default function SynergyMatrix({ hybrids }) {
  if (!hybrids.length) {
    return <p className="text-sm text-muted-foreground">No super-assets synthesized yet. Run the Convergence Engine.</p>;
  }
  return (
    <div className="space-y-3">
      {hybrids.map((h) => (
        <div key={h.id} className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Layers className="size-4 text-slate-500" />
            <h3 className="font-semibold tracking-tight">{h.asset_name}</h3>
            <span className={`text-[10px] uppercase tracking-wide rounded-md border px-2 py-0.5 ${STATUS_STYLE[h.status] || STATUS_STYLE.concept}`}>{h.status}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(h.sectors || []).map((s, i) => (
              <span key={i} className="text-[11px] rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-600 px-2 py-0.5">{s}</span>
            ))}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{h.synthesis_thesis}</p>
          {h.value_lock && (
            <p className="text-xs mt-2 border-l-2 border-violet-500/50 pl-3 text-foreground/80"><span className="font-semibold">Value-Lock:</span> {h.value_lock}</p>
          )}
          <div className="grid sm:grid-cols-2 gap-3 mt-3 text-xs">
            <div className="rounded-lg bg-muted p-3">
              <div className="font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Monopoly Score</div>
              <div className="text-lg font-semibold tabular-nums">{h.monopoly_score ?? '-'}</div>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <div className="font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Dismantle Difficulty</div>
              <div>{h.dismantle_difficulty || '-'}</div>
            </div>
          </div>
          {(h.interlock_layers || []).length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Interlocking Value</div>
              <div className="space-y-1.5">
                {h.interlock_layers.map((l, i) => (
                  <div key={i} className="flex gap-2 text-xs"><span className="font-semibold text-foreground shrink-0">{l.name}</span><span className="text-muted-foreground">{l.dependency_note}</span></div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}