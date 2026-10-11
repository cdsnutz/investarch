import { Landmark } from 'lucide-react';

const usd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

export default function TreasuryPanel({ snapshot }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Landmark className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Corporate Balance Sheet{snapshot ? ` — ${snapshot.snapshot_date}` : ''}
        </h2>
      </div>
      {!snapshot ? (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
          No appraisal yet. Press "Reprice Treasury" or run the daily cycle.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Portfolio Value</div>
              <div className="text-2xl font-semibold tracking-tight mt-1">{usd(snapshot.total_valuation)}</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Assets</div>
              <div className="text-2xl font-semibold tracking-tight mt-1">{snapshot.asset_count}</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Built</div>
              <div className="text-2xl font-semibold tracking-tight mt-1">{snapshot.built_count}</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Patent-Hardened</div>
              <div className="text-2xl font-semibold tracking-tight mt-1">{snapshot.protected_count}</div>
            </div>
          </div>

          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Asset</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Demand</th>
                  <th className="px-4 py-2.5 font-medium text-right">Appraised Value</th>
                </tr>
              </thead>
              <tbody>
                {(snapshot.assets || []).slice(0, 8).map((a) => (
                  <tr key={a.seed_id} className="border-b last:border-0">
                    <td className="px-4 py-2.5 font-medium text-slate-900">{a.title}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{a.status}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{a.demand_score ? `${a.demand_score}/10` : '—'}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{usd(a.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(snapshot.leverage_matrix || []).length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Leverage Matrix — No-Credit Facilities</div>
              {snapshot.leverage_matrix.map((l, i) => (
                <div key={i} className="rounded-xl border bg-white p-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-sm font-semibold text-slate-900">{l.collateral}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">{l.rationale}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold tracking-tight text-emerald-700">{usd(l.loan_amount)}</div>
                    <div className="text-xs text-muted-foreground">{l.ltv} LTV</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}