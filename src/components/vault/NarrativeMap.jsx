import { Megaphone } from 'lucide-react';

const STATUS_STYLE = {
  seeding: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  amplifying: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  locked: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
};

export default function NarrativeMap({ narratives }) {
  if (!narratives.length) {
    return <p className="text-sm text-muted-foreground">No narratives engineered yet. Run the Perception Pod to seed the map.</p>;
  }
  return (
    <div className="space-y-3">
      {narratives.map((n) => (
        <div key={n.id} className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Megaphone className="size-4 text-slate-500" />
            <h3 className="font-semibold tracking-tight">{n.narrative_name}</h3>
            <span className={`text-[10px] uppercase tracking-wide rounded-md border px-2 py-0.5 ${STATUS_STYLE[n.status] || STATUS_STYLE.seeding}`}>{n.status}</span>
            {n.target_market && <span className="text-[10px] uppercase tracking-wide rounded-md bg-muted px-2 py-0.5 text-muted-foreground">{n.target_market}</span>}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{n.narrative_thesis}</p>
          {n.cultural_shift && (
            <p className="text-xs mt-2 border-l-2 border-sky-500/50 pl-3 text-foreground/80"><span className="font-semibold">Belief in motion:</span> {n.cultural_shift}</p>
          )}
          {n.demand_vacuum && (
            <p className="text-xs mt-2 text-muted-foreground"><span className="font-semibold">The vacuum:</span> {n.demand_vacuum}</p>
          )}
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            {(n.trigger_events || []).length > 0 && (
              <div className="rounded-lg bg-muted p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Trigger Events</div>
                <ul className="space-y-1">{n.trigger_events.map((e, i) => <li key={i} className="flex gap-2 text-xs"><span className="size-1 rounded-full bg-sky-500 mt-1.5 shrink-0" />{e}</li>)}</ul>
              </div>
            )}
            {(n.pull_levers || []).length > 0 && (
              <div className="rounded-lg bg-muted p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Pull Levers</div>
                <ul className="space-y-1">{n.pull_levers.map((e, i) => <li key={i} className="flex gap-2 text-xs"><span className="size-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />{e}</li>)}</ul>
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-3">12-month share-of-mind forecast <span className="font-semibold text-foreground tabular-nums">{n.adoption_forecast_pct}%</span></div>
        </div>
      ))}
    </div>
  );
}