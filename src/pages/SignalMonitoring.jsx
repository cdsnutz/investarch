import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import moment from 'moment';

const CONVICTIONS = [
  { value: 'all', label: 'Any conviction' },
  { value: '7', label: '7+' },
  { value: '8', label: '8+' },
  { value: '9', label: '9+' }
];
const STATUSES = ['all', 'observed', 'actionable', 'struck'];

const statusClasses = {
  observed: '',
  actionable: 'bg-bottle text-bottle-foreground border-transparent',
  struck: 'bg-secondary text-secondary-foreground border-transparent'
};

export default function SignalMonitoring() {
  const [conviction, setConviction] = useState('all');
  const [status, setStatus] = useState('all');
  const [signals, setSignals] = useState(null);

  useEffect(() => {
    setSignals(null);
    const query = {};
    if (conviction !== 'all') query.confidence = { $gte: Number(conviction) };
    if (status !== 'all') query.status = status;
    base44.entities.LiveSignal.filter(query, { sort: '-observed_date', limit: 50 })
      .then((p) => setSignals(p.items)).catch(() => setSignals([]));
  }, [conviction, status]);

  const selectCls = "h-9 rounded-md border border-input bg-white px-3 text-sm";

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Signal Monitoring"
        subtitle="Raw market signals and indicators aggregated from the autonomous scan, filterable by conviction score."
      />

      <div className="flex flex-wrap gap-3">
        <select value={conviction} onChange={(e) => setConviction(e.target.value)} className={selectCls}>
          {CONVICTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
        </select>
      </div>

      {signals == null ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-md" />)}</div>
      ) : signals.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-md">
          <h3 className="font-heading text-xl tracking-tight">No signals match</h3>
          <p className="text-sm text-muted-foreground mt-2">Loosen the conviction or status filters, or wait for the next scan.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {signals.map((s) => (
            <Card key={s.id} className="p-5 rounded-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading text-lg tracking-tight">{s.signal_name}</span>
                    <Badge variant="outline" className={statusClasses[s.status] || ''}>{s.status}</Badge>
                    {s.domain && <span className="text-xs text-muted-foreground">{s.domain}</span>}
                  </div>
                  <p className="text-sm mt-2">{s.observation}</p>
                  {s.pre_emptive_gap && <p className="text-sm text-muted-foreground mt-1.5">Gap: {s.pre_emptive_gap}</p>}
                  {s.recommended_strike && <p className="text-sm mt-1.5"><span className="text-muted-foreground">Strike: </span>{s.recommended_strike}</p>}
                  <div className="text-xs text-muted-foreground mt-2">
                    {moment(s.observed_date || s.created_date).format('MMM D, YYYY')}
                    {s.action_window_days != null && <> · action window {s.action_window_days}d</>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-heading text-3xl tabular-nums leading-none">{s.confidence ?? '—'}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">Conviction</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}