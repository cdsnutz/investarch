import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const MANDATES = [
  { name: 'Pre-Seed', focus: 'Concept validation', min_scan: 60, min_value_scan: 50 },
  { name: 'Angel Round', focus: 'Early traction', min_scan: 70, min_value_scan: 60 },
  { name: 'Seed (VC)', focus: 'Product-market fit', min_scan: 75, min_value_scan: 65 },
  { name: 'Series A', focus: 'Scaling revenue', min_scan: 85, min_value_scan: 75 }
];

const readiness = (dossier, m) => {
  const scan = dossier.scan_score;
  const vs = dossier.value_scan && dossier.value_scan.total;
  if (scan == null) return { state: 'unknown', pct: null };
  const pct = Math.min(100, Math.round((scan / m.min_scan) * 100));
  if (scan >= m.min_scan && (vs == null || vs >= m.min_value_scan)) return { state: 'ready', pct };
  if (scan >= m.min_scan - 10) return { state: 'partial', pct };
  return { state: 'not_ready', pct };
};

const stateClasses = {
  ready: 'bg-bottle text-bottle-foreground border-transparent',
  partial: 'bg-bottle/10 text-bottle border-transparent',
  not_ready: '',
  unknown: 'opacity-50'
};

export default function CapitalReadiness() {
  const [dossiers, setDossiers] = useState(null);

  useEffect(() => {
    base44.entities.Project.filter({ status: 'complete' }, { sort: '-created_date', limit: 50, fields: ['company_name', 'industry', 'scan_score', 'value_scan', 'created_date'] })
      .then((p) => setDossiers(p.items)).catch(() => setDossiers([]));
  }, []);

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Capital Readiness"
        subtitle="Each completed dossier evaluated against venture capital investment mandates, using its own scan score and value-engine total."
      />

      {dossiers == null ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-md" />)}</div>
      ) : dossiers.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-md">
          <h3 className="font-heading text-xl tracking-tight">No completed dossiers</h3>
          <p className="text-sm text-muted-foreground mt-2">Readiness is evaluated on completed dossiers only.</p>
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MANDATES.map((m) => (
              <Card key={m.name} className="p-5 rounded-md space-y-1">
                <div className="font-heading text-lg tracking-tight">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.focus}</div>
                <div className="text-xs text-muted-foreground mt-2">Requires scan ≥ {m.min_scan} · value scan ≥ {m.min_value_scan}</div>
                <div className="text-xs text-muted-foreground">{dossiers.filter((d) => readiness(d, m).state === 'ready').length} of {dossiers.length} dossiers ready</div>
              </Card>
            ))}
          </div>

          <div className="overflow-x-auto rounded-md border border-border bg-white">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground py-3 px-4">Dossier</th>
                  <th className="text-left font-medium text-muted-foreground py-3 px-4 w-20">Scan</th>
                  {MANDATES.map((m) => (
                    <th key={m.name} className="text-left font-medium text-muted-foreground py-3 px-4">{m.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dossiers.map((d) => (
                  <tr key={d.id}>
                    <td className="py-3 px-4">
                      <Link to={`/projects/${d.id}`} className="font-medium hover:underline">{d.company_name || 'Untitled'}</Link>
                      <span className="block text-xs text-muted-foreground">{d.industry || ''}</span>
                    </td>
                    <td className="py-3 px-4 tabular-nums">{d.scan_score ?? '—'}</td>
                    {MANDATES.map((m) => {
                      const r = readiness(d, m);
                      return (
                        <td key={m.name} className="py-3 px-4">
                          <Badge variant="outline" className={cn('text-xs capitalize', stateClasses[r.state])}>
                            {r.state.replace(/_/g, ' ')}{r.pct != null ? ` ${r.pct}%` : ''}
                          </Badge>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}