const REALM_LABEL = { orbital: 'Orbital', lunar: 'Lunar', asteroid: 'Asteroid', deep_space: 'Deep Space' };

export default function ForgeRegistry({ claims }) {
  if (!claims.length) {
    return <p className="text-sm text-muted-foreground">No celestial claims drafted yet. Run the Galactic Forge to architect the first off-world frameworks.</p>;
  }
  return (
    <div className="space-y-3">
      {claims.map((c) => (
        <div key={c.id} className="rounded-xl border bg-card p-5 space-y-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[10px] uppercase tracking-[0.18em] rounded-md bg-slate-900 text-emerald-300 px-2 py-0.5">{REALM_LABEL[c.realm] || c.realm}</span>
            <h3 className="text-base font-semibold tracking-tight">{c.claim_name}</h3>
          </div>
          {c.legal_framework && (
            <p className="text-sm text-foreground leading-relaxed"><span className="text-xs uppercase tracking-wide text-muted-foreground">Legal framework: </span>{c.legal_framework}</p>
          )}
          {c.trade_protocol && (
            <p className="text-xs text-muted-foreground leading-relaxed"><span className="uppercase tracking-wide">Trade protocol: </span>{c.trade_protocol}</p>
          )}
          {c.infrastructure_plan && (
            <p className="text-xs text-muted-foreground leading-relaxed"><span className="uppercase tracking-wide">Infrastructure: </span>{c.infrastructure_plan}</p>
          )}
          {c.monopoly_note && (
            <p className="text-xs"><span className="uppercase tracking-wide text-muted-foreground">Displacement moat: </span><span className="text-foreground">{c.monopoly_note}</span></p>
          )}
        </div>
      ))}
    </div>
  );
}