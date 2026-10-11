export default function TemporalMap({ anchors }) {
  if (!anchors.length) {
    return <p className="text-sm text-muted-foreground">No Value-Anchors planted yet. Run the Chronos Pod to identify the first inevitabilities and plant the steering anchors.</p>;
  }
  return (
    <div className="space-y-3">
      {anchors.map((a) => (
        <div key={a.id} className="rounded-xl border bg-card p-5 space-y-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Anchor Year {a.anchor_year}</span>
            <h3 className="text-base font-semibold tracking-tight">{a.anchor_name}</h3>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{a.inevitability}</p>
          {a.target_state && (
            <p className="text-sm"><span className="text-xs uppercase tracking-wide text-muted-foreground">Target state: </span><span className="font-medium">{a.target_state}</span></p>
          )}
          {a.steering_design && <p className="text-xs text-muted-foreground leading-relaxed">Steering: {a.steering_design}</p>}
          {a.toll_note && (
            <p className="text-xs"><span className="uppercase tracking-wide text-muted-foreground">Toll: </span><span className="text-foreground">{a.toll_note}</span></p>
          )}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${a.current_progress_pct || 0}%` }} />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground w-16 text-right">Steering {a.current_progress_pct || 0}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}