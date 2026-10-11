import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Radio, ArrowUpRight } from 'lucide-react';
import moment from 'moment';

export default function SignalFeed() {
  const [signals, setSignals] = useState(null);

  useEffect(() => {
    base44.entities.LiveSignal.filter({}, { sort: '-observed_date', limit: 6 })
      .then((page) => setSignals(page.items))
      .catch(() => setSignals([]));
  }, []);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="size-4 text-emerald-600" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Live Signal Feed</h2>
        </div>
        <Link to="/simulator" className="text-xs text-muted-foreground hover:text-slate-900 inline-flex items-center gap-1">
          Simulator <ArrowUpRight className="size-3" />
        </Link>
      </div>

      {signals === null ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : signals.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No signals observed yet. Run a market scan from the Simulator.</p>
      ) : (
        <ul className="space-y-3">
          {signals.map((s) => (
            <li key={s.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium tracking-tight truncate">{s.signal_name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.observation}</div>
                  {s.recommended_strike && (
                    <div className="text-xs mt-1.5 line-clamp-1"><span className="font-medium">Strike:</span> {s.recommended_strike}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge variant={s.status === 'actionable' ? 'default' : 'outline'}
                    className={s.status === 'actionable' ? 'bg-emerald-600' : s.status === 'struck' ? 'bg-slate-200 text-slate-700' : ''}>
                    {s.status}
                  </Badge>
                  {s.confidence != null && <span className="text-[11px] text-muted-foreground tabular-nums">{s.confidence}/10 conf.</span>}
                  <span className="text-[11px] text-muted-foreground">{moment(s.observed_date).fromNow()}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}