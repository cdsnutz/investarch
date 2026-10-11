import { Scale, Bot } from 'lucide-react';

const LEVER_STYLE = { identified: 'bg-slate-500/15 text-slate-400 border-slate-500/30', analyzed: 'bg-amber-500/15 text-amber-400 border-amber-500/30', positioned: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
const PERSONA_STYLE = { designed: 'bg-slate-500/15 text-slate-400 border-slate-500/30', launched: 'bg-amber-500/15 text-amber-400 border-amber-500/30', scaled: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };

export default function InfluenceLedger({ levers, personas }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Regulatory Leverage ({levers.length})</h3>
        {levers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No regulatory positions mapped. Run the Sovereign Diplomat.</p>
        ) : (
          <div className="space-y-2">
            {levers.map((l) => (
              <div key={l.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <Scale className="size-4 text-slate-500" />
                  <span className="font-semibold text-sm">{l.lever_name}</span>
                  <span className={`text-[10px] uppercase tracking-wide rounded-md border px-2 py-0.5 ${LEVER_STYLE[l.status] || LEVER_STYLE.identified}`}>{l.status}</span>
                  <span className="text-[10px] text-muted-foreground">{l.jurisdiction}</span>
                </div>
                {l.framework && <div className="text-xs text-muted-foreground mb-1.5"><span className="font-semibold">Framework:</span> {l.framework}</div>}
                {l.positioning_rationale && <p className="text-xs text-muted-foreground leading-relaxed">{l.positioning_rationale}</p>}
                {l.compliance_path && (
                  <p className="text-xs mt-2 rounded-lg bg-muted p-3 leading-relaxed"><span className="font-semibold">Lawful path:</span> {l.compliance_path}</p>
                )}
                <div className="text-xs text-muted-foreground mt-2">Moat strength <span className="font-semibold text-foreground tabular-nums">{l.moat_strength}/10</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Synthetic Personas ({personas.length})</h3>
        {personas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No personas designed. Run the Synthetic Face Pod.</p>
        ) : (
          <div className="space-y-2">
            {personas.map((p) => (
              <div key={p.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <Bot className="size-4 text-slate-500" />
                  <span className="font-semibold text-sm">{p.persona_name}</span>
                  <span className="text-xs text-muted-foreground">{p.role_title}</span>
                  <span className={`text-[10px] uppercase tracking-wide rounded-md border px-2 py-0.5 ${PERSONA_STYLE[p.status] || PERSONA_STYLE.designed}`}>{p.status}</span>
                  <span className="ml-auto text-[10px] rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 px-2 py-0.5">{p.disclosure}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-1.5">{p.niche}{p.platform ? ` · ${p.platform}` : ''}</div>
                {p.positioning && <p className="text-xs text-muted-foreground leading-relaxed">{p.positioning}</p>}
                {(p.content_pillars || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.content_pillars.map((c, i) => <span key={i} className="text-[11px] rounded-md bg-muted px-2 py-0.5">{c}</span>)}
                  </div>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-2">
                  <span>Est. audience <span className="font-semibold text-foreground tabular-nums">{(p.audience_estimate || 0).toLocaleString()}</span></span>
                  {p.trust_note && <span className="max-w-lg"><span className="font-semibold">Trust model:</span> {p.trust_note}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}