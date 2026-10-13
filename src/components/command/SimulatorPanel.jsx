import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import Panel from '@/components/command/Panel';

export default function SimulatorPanel() {
  const [d, setD] = useState(null);

  useEffect(() => {
    (async () => {
      const me = await base44.auth.me();
      const [access, runs, paidCount, paid] = await Promise.all([
        base44.entities.SimulatorAccess.filter({ app_user_id: me.id }, { sort: '-created_date', limit: 1 }),
        base44.entities.SimulationRun.count({}),
        base44.entities.Base44Purchase.count({ status: 'paid' }),
        base44.entities.Base44Purchase.filter({ status: 'paid' }, { sort: '-paidAt', limit: 5, fields: ['productName', 'amount', 'currency', 'paidAt'] })
      ]);
      setD({ access: access.items[0], runs, paidCount, paid: paid.items });
    })();
  }, []);

  const Stat = ({ label, value }) => (
    <div><div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div><div className="font-heading text-2xl mt-0.5">{value}</div></div>
  );

  return (
    <Panel code="B" title="Precision Business Simulator">
      {!d ? <p className="text-xs text-muted-foreground">Loading…</p> : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Entitlement" value={d.access?.status === 'active' ? 'Active' : 'None'} />
            <Stat label="Simulations" value={d.runs} />
            <Stat label="Paid orders" value={d.paidCount} />
          </div>
          {d.access && <p className="text-xs text-muted-foreground mt-3">{d.access.plan} · {d.access.billing_interval} · since {d.access.started_date?.slice(0, 10)}</p>}
          <div className="mt-4 border-t border-border pt-3 space-y-1.5">
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Revenue signals</div>
            {d.paid.length === 0 ? <p className="text-xs text-muted-foreground">No settled payments.</p> : d.paid.map((p) => (
              <div key={p.id} className="flex justify-between text-xs">
                <span className="truncate">{p.productName || 'Order'}</span>
                <span className="font-mono">{p.amount} {p.currency} · {p.paidAt ? format(new Date(p.paidAt), 'MMM d') : '–'}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}