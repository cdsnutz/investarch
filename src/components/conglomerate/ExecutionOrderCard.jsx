import { ClipboardList } from 'lucide-react';

const COLUMNS = [
  { key: 'build', title: 'Build', accent: 'border-emerald-200 bg-emerald-50/60 text-emerald-800' },
  { key: 'protect', title: 'Protect', accent: 'border-blue-200 bg-blue-50/60 text-blue-800' },
  { key: 'liquidate', title: 'Liquidate', accent: 'border-amber-200 bg-amber-50/60 text-amber-800' },
  { key: 'leverage', title: 'Leverage', accent: 'border-violet-200 bg-violet-50/60 text-violet-800' }
];

export default function ExecutionOrderCard({ order, seedsById }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Sovereign Execution Order{order ? ` — ${order.order_date}` : ''}
        </h2>
      </div>
      {!order ? (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
          No order issued yet. Run the daily cycle or press "Issue Execution Order".
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className={`rounded-xl border p-4 space-y-3 ${col.accent}`}>
              <div className="text-xs font-bold uppercase tracking-wider">{col.title}</div>
              {(order[col.key] || []).length === 0 ? (
                <p className="text-xs text-muted-foreground">Nothing directed today.</p>
              ) : (
                (order[col.key] || []).map((item, i) => (
                  <div key={i} className="rounded-lg bg-white/70 p-3 space-y-1">
                    <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                    <p className="text-xs leading-relaxed text-slate-600">{item.rationale}</p>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}