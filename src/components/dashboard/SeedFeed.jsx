import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, ArrowUpRight } from 'lucide-react';
import moment from 'moment';

export default function SeedFeed() {
  const [seeds, setSeeds] = useState(null);

  useEffect(() => {
    base44.entities.IpSeed.filter({}, { sort: '-created_date', limit: 6, fields: ['title', 'gap', 'asymmetric_score', 'strategy', 'status', 'created_date'] })
      .then((page) => setSeeds(page.items))
      .catch(() => setSeeds([]));
  }, []);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-amber-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Latest IP Seeds</h2>
        </div>
        <Link to="/ip-factory" className="text-xs text-muted-foreground hover:text-slate-900 inline-flex items-center gap-1">
          IP Factory <ArrowUpRight className="size-3" />
        </Link>
      </div>

      {seeds === null ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : seeds.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No seeds yet. Run a hunt from the IP Factory.</p>
      ) : (
        <ul className="space-y-3">
          {seeds.map((s) => (
            <li key={s.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium tracking-tight truncate">{s.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.gap}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex gap-1.5">
                    <Badge variant="outline">{s.strategy}</Badge>
                    {s.asymmetric_score != null && <Badge variant="outline" className="tabular-nums">{s.asymmetric_score}</Badge>}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{moment(s.created_date).fromNow()}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}