import { ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const severityTint = (s) => (s === 'high' ? 'bg-red-100 text-red-800' : s === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600');

export default function PatentFortress({ filings, alerts, seedsById }) {
  const alertBySeed = new Map(alerts.map((a) => [a.seed_id, a]));
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Patent Fortress {filings.length ? `— ${filings.length} filings` : ''}
        </h2>
      </div>
      {filings.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
          No filings yet. Draft IP filings from the IP Factory to man the fortress.
        </div>
      ) : (
        <>
          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Asset</th>
                  <th className="px-4 py-2.5 font-medium">Filing</th>
                  <th className="px-4 py-2.5 font-medium">Brand</th>
                  <th className="px-4 py-2.5 font-medium">Enforcement</th>
                </tr>
              </thead>
              <tbody>
                {filings.slice(0, 10).map((f) => {
                  const alert = alertBySeed.get(f.seed_id);
                  return (
                    <tr key={f.id} className="border-b last:border-0">
                      <td className="px-4 py-2.5 font-medium text-slate-900">{seedsById[f.seed_id] || 'Asset'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground capitalize">{f.filing_type}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{f.brand_name || '—'}</td>
                      <td className="px-4 py-2.5">
                        {alert ? (
                          <Badge className={severityTint(alert.severity)}>Under enforcement — {alert.severity}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Clear</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {alerts.map((a) => (
            <div key={a.id} className="rounded-xl border border-red-200 bg-red-50/50 p-5 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={severityTint(a.severity)}>{a.severity}</Badge>
                <div className="text-sm font-semibold text-slate-900">{a.suspected_infringer}</div>
                <span className="text-xs text-muted-foreground">vs {seedsById[a.seed_id] || 'asset'} · {a.detected_date}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">{a.evidence_note}</p>
              {a.cease_desist_text && (
                <details className="group">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-800">Surgical Cease &amp; Desist — drafted for attorney review</summary>
                  <p className="mt-2 rounded-lg bg-white p-3 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">{a.cease_desist_text}</p>
                </details>
              )}
            </div>
          ))}
        </>
      )}
    </section>
  );
}