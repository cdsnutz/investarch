import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderOpen, Lightbulb, Radio, TrendingUp } from 'lucide-react';

export default function StatStrip() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [projects, seeds, signals, vectors] = await Promise.all([
          base44.entities.Project.count({}),
          base44.entities.IpSeed.count({}),
          base44.entities.LiveSignal.count({}),
          base44.entities.MarketVector.count({})
        ]);
        setStats({ projects, seeds, signals, vectors });
      } catch {
        setStats({ projects: 0, seeds: 0, signals: 0, vectors: 0 });
      }
    })();
  }, []);

  const items = [
    { label: 'Dossiers', value: stats?.projects, icon: FolderOpen, to: '/' },
    { label: 'IP Seeds', value: stats?.seeds, icon: Lightbulb, to: '/ip-factory' },
    { label: 'Live Signals', value: stats?.signals, icon: Radio, to: '/simulator' },
    { label: 'Market Vectors', value: stats?.vectors, icon: TrendingUp, to: '/simulator' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {value == null ? <Skeleton className="h-7 w-10" /> : value}
          </div>
        </div>
      ))}
    </div>
  );
}