import { Badge } from '@/components/ui/badge';

const fmtUsd = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

export default function ValueStandardIndex({ axiom }) {
  if (!axiom) {
    return <p className="text-sm text-muted-foreground">No Synthetic Value Standard defined yet. Run the Axiom Pod to define the founding standard and index the ledger.</p>;
  }
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold tracking-tight">{axiom.metric_name}</h3>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">{axiom.unit || 'unit pending'}</Badge>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{axiom.definition}</p>
        {axiom.derivation_note && (
          <p className="text-xs text-muted-foreground leading-relaxed">Derivation: {axiom.derivation_note}</p>
        )}
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Revalued {axiom.revaluation_date}</p>
      </div>

      {(axiom.indexed_assets || []).length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Planetary Ledger — Indexed Against the Axiom</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium">Asset</th>
                  <th className="py-2 pr-3 font-medium text-right">Fiat Value (yr)</th>
                  <th className="py-2 pr-3 font-medium text-right">Axiom Value</th>
                  <th className="py-2 font-medium">Drift</th>
                </tr>
              </thead>
              <tbody>
                {axiom.indexed_assets.map((a, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0 align-top">
                    <td className="py-2 pr-3 font-medium">{a.asset_name}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">{fmtUsd(a.fiat_value)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{(a.axiom_value || 0).toLocaleString()}</td>
                    <td className="py-2 text-xs text-muted-foreground">{a.drift_note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}