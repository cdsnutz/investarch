import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import moment from 'moment';

const SECTIONS = [
  { key: 'build', label: 'Build' },
  { key: 'protect', label: 'Protect' },
  { key: 'liquidate', label: 'Liquidate' },
  { key: 'leverage', label: 'Leverage' }
];

export default function ExecutionOrders() {
  const [orders, setOrders] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    base44.entities.ExecutionOrder.filter({}, { sort: '-order_date', limit: 50 })
      .then((p) => setOrders(p.items)).catch(() => setOrders([]));
  }, []);

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Execution Orders"
        subtitle="Build, protect, liquidate, and leverage directives for portfolio assets, newest first."
      />

      {orders == null ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-md" />)}</div>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-md">
          <h3 className="font-heading text-xl tracking-tight">No execution orders yet</h3>
          <p className="text-sm text-muted-foreground mt-2">Orders issued by the engine appear here with their full directives.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const counts = SECTIONS.map((s) => ({ ...s, items: o[s.key] || [] }));
            return (
              <Card key={o.id} className="p-5 rounded-md space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-heading text-lg tracking-tight">Order · {moment(o.order_date).format('MMM D, YYYY')}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Portfolio value ${Number(o.total_portfolio_value || 0).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    {counts.map((s) => (
                      <Badge key={s.key} variant="outline" className="text-xs">{s.label} {s.items.length}</Badge>
                    ))}
                  </div>
                </div>
                <button onClick={() => setOpen(open === o.id ? null : o.id)} className="text-xs text-bottle hover:underline">
                  {open === o.id ? 'Collapse directives' : 'View directives'}
                </button>
                {open === o.id && (
                  <div className="grid md:grid-cols-2 gap-4 border-t border-border pt-3">
                    {counts.map((s) => (
                      <div key={s.key}>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{s.label}</div>
                        {s.items.length === 0 ? (
                          <p className="text-xs text-muted-foreground">None</p>
                        ) : (
                          <ul className="space-y-2">
                            {s.items.map((it, i) => (
                              <li key={i} className="text-sm">
                                <span className="font-medium">{it.title}</span>
                                {it.filing_type && <span className="text-xs text-muted-foreground"> · {it.filing_type}</span>}
                                {it.rationale && <span className="block text-xs text-muted-foreground mt-0.5">{it.rationale}</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}