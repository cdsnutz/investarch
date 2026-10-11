import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import moment from 'moment';

const statusClasses = {
  analyzing: '',
  complete: 'bg-bottle/10 text-bottle border-transparent',
  failed: 'bg-destructive/10 text-destructive border-transparent'
};

export default function SynthesisLogs() {
  const [runs, setRuns] = useState(null);
  const [kpi, setKpi] = useState(null);

  useEffect(() => {
    base44.entities.Project.filter({}, { sort: '-created_date', limit: 50 })
      .then((p) => setRuns(p.items)).catch(() => setRuns([]));
    base44.entities.Project.aggregate({ avg: 'scan_score' })
      .then((r) => setKpi(r.rows[0] || {})).catch(() => setKpi({}));
  }, []);

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Synthesis Logs"
        subtitle="A chronological log of every dossier synthesis run, with status, timestamps, and key performance indicators."
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md border border-border bg-white p-4">
          <div className="text-xs text-muted-foreground">Runs logged</div>
          <div className="mt-1.5 font-heading text-3xl tabular-nums">{kpi == null ? <Skeleton className="h-8 w-10" /> : kpi.count ?? 0}</div>
        </div>
        <div className="rounded-md border border-border bg-white p-4">
          <div className="text-xs text-muted-foreground">Average scan score</div>
          <div className="mt-1.5 font-heading text-3xl tabular-nums">{kpi == null ? <Skeleton className="h-8 w-10" /> : kpi.avg_scan_score != null ? Math.round(kpi.avg_scan_score) : '—'}</div>
        </div>
        <div className="rounded-md border border-border bg-white p-4">
          <div className="text-xs text-muted-foreground">Latest run</div>
          <div className="mt-1.5 font-heading text-xl">{runs == null ? <Skeleton className="h-8 w-16" /> : runs[0] ? moment(runs[0].created_date).format('MMM D, HH:mm') : '—'}</div>
        </div>
      </div>

      {runs == null ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-md" />)}</div>
      ) : runs.length === 0 ? (
        <div className="rounded-md border border-border border-dashed p-12 text-center">
          <h3 className="font-heading text-xl tracking-tight">No runs yet</h3>
          <p className="text-sm text-muted-foreground mt-2">Every synthesis run will be logged here in order.</p>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-white divide-y divide-border">
          {runs.map((r, i) => (
            <Link key={r.id} to={`/projects/${r.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3.5 hover:bg-secondary/50 transition">
              <span className="text-xs text-muted-foreground tabular-nums w-14">#{runs.length - i}</span>
              <span className="font-medium text-sm flex-1 min-w-40 truncate">{r.company_name || 'Untitled run'}</span>
              <span className="text-xs text-muted-foreground w-32">{moment(r.created_date).format('MMM D, YYYY HH:mm')}</span>
              <Badge variant="outline" className={statusClasses[r.status] || ''}>{r.status}</Badge>
              <span className="text-sm tabular-nums w-20 text-right">{r.scan_score != null ? `${r.scan_score} pts` : '—'}</span>
              <span className="text-xs text-muted-foreground w-20 text-right">{r.plan_revisions ? `${r.plan_revisions} rev` : ''}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}