export default function ConsciousnessHeatmap({ imprints }) {
  if (!imprints.length) {
    return <p className="text-sm text-muted-foreground">No archetypal imprints designed yet. Run the Psionic Pod to seed the first cultural positions.</p>;
  }
  const depthTone = (pct) => {
    const v = Number(pct) || 0;
    if (v >= 60) return 'bg-emerald-500';
    if (v >= 30) return 'bg-amber-500';
    return 'bg-slate-400';
  };
  return (
    <div className="space-y-3">
      {imprints.map((i) => (
        <div key={i.id} className="rounded-xl border bg-card p-5 space-y-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="text-base font-semibold tracking-tight">{i.archetype_name}</h3>
            <span className="text-xs text-muted-foreground flex-1 min-w-40">{i.population_segment}</span>
            <span className="text-[10px] uppercase tracking-wide rounded-md bg-muted px-2 py-0.5 text-muted-foreground">{i.status}</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{i.imprint_thesis}</p>
          {i.necessity_note && <p className="text-xs text-muted-foreground leading-relaxed">{i.necessity_note}</p>}
          {(i.channels || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {i.channels.map((c, j) => (
                <span key={j} className="text-[10px] rounded-md border border-border px-2 py-0.5 text-muted-foreground">{c}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${depthTone(i.imprint_depth_pct)}`} style={{ width: `${i.imprint_depth_pct || 0}%` }} />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground w-16 text-right">Depth {i.imprint_depth_pct || 0}%</span>
          </div>
          {i.disclosure && <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{i.disclosure}</p>}
        </div>
      ))}
    </div>
  );
}