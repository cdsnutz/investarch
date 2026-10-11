import { Handshake } from 'lucide-react';

const TYPE_LABEL = {
  distribution: 'Distribution', data_sharing: 'Data Sharing', dependency: 'Dependency', partnership: 'Partnership', acquisition_target: 'Acquisition Target'
};
const STATUS_STYLE = {
  proposed: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  negotiating: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  secured: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  dependency_locked: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  acquired: 'bg-violet-500/15 text-violet-400 border-violet-500/30'
};

export default function AllianceMatrix({ alliances, layers }) {
  if (!alliances.length) {
    return <p className="text-sm text-muted-foreground">No alliances formed. The Synthetic Swarm has not been deployed.</p>;
  }
  const layerName = (id) => (layers.find((l) => l.id === id) || {}).layer_name || 'Unknown layer';
  const byType = {};
  alliances.forEach((a) => { (byType[a.alliance_type] = byType[a.alliance_type] || []).push(a); });
  return (
    <div className="space-y-5">
      {Object.entries(byType).map(([type, list]) => (
        <div key={type}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">{TYPE_LABEL[type] || type} ({list.length})</h3>
          <div className="space-y-2">
            {list.map((a) => (
              <div key={a.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <Handshake className="size-4 text-slate-500" />
                  <span className="font-semibold text-sm">{a.partner_name}</span>
                  <span className={`text-[10px] uppercase tracking-wide rounded-md border px-2 py-0.5 ${STATUS_STYLE[a.status] || STATUS_STYLE.proposed}`}>{a.status?.replace('_', ' ')}</span>
                  <span className="text-[10px] text-muted-foreground">{layerName(a.layer_id)}</span>
                </div>
                {a.leverage_note && <p className="text-xs text-muted-foreground leading-relaxed">{a.leverage_note}</p>}
                <div className="flex flex-wrap items-baseline gap-4 text-xs text-muted-foreground mt-2">
                  <span>Partner strength <span className="font-semibold text-foreground tabular-nums">{a.partner_strength}/10</span></span>
                  <span>Dependency <span className="font-semibold text-foreground tabular-nums">{a.dependency_score}/10</span></span>
                  {a.terms && <span className="max-w-md">Terms: <span className="text-foreground">{a.terms}</span></span>}
                </div>
                {a.opening_pitch && (
                  <p className="text-xs mt-2 rounded-lg bg-muted p-3 leading-relaxed"><span className="font-semibold">Agent opener:</span> {a.opening_pitch}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}