import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Skeleton } from '@/components/ui/skeleton';

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
    { label: 'Dossiers', value: stats?.projects },
    { label: 'IP Seeds', value: stats?.seeds },
    { label: 'Live Signals', value: stats?.signals },
    { label: 'Market Vectors', value: stats?.vectors }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(({ label, value }) => (
        <div key={label} className="rounded-md border border-border bg-white p-4">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1.5 font-heading text-3xl tracking-tight tabular-nums">
            {value == null ? <Skeleton className="h-8 w-10" /> : value}
          </div>
        </div>
      ))}
    </div>
  );
}