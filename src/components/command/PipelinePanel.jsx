import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import Panel from '@/components/command/Panel';
import BuildButton from '@/components/command/BuildButton';
import { cn } from '@/lib/utils';

const TONE = { analyzing: 'text-bottle', complete: 'text-foreground', ready_for_review: 'text-bottle', failed: 'text-destructive', captured: 'text-muted-foreground' };

export default function PipelinePanel({ refreshKey }) {
  const [inFlight, setInFlight] = useState(null);
  const [ready, setReady] = useState(null);
  const [recent, setRecent] = useState(null);

  const load = () => Promise.all([
    base44.entities.Project.count({ status: 'analyzing' }),
    base44.entities.Project.count({ status: 'ready_for_review' }),
    base44.entities.Project.filter({}, { sort: '-updated_date', limit: 10, fields: ['company_name', 'url', 'status', 'updated_date'] })
  ]).then(([n, r, page]) => { setInFlight(n); setReady(r); setRecent(page.items); });

  useEffect(() => { load(); }, [refreshKey]);

  return (
    <Panel code="A" title="Dossier Pipeline" action={<span className="text-xs text-muted-foreground">{inFlight ?? '–'} in flight · {ready ?? '–'} ready for review</span>}>
      <BuildButton onComplete={load} />
      <table className="w-full text-xs mt-4">
        <thead><tr className="text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><th className="py-1.5 font-normal">Dossier</th><th className="font-normal">Status</th><th className="font-normal text-right">Updated</th></tr></thead>
        <tbody>
          {!recent ? <tr><td colSpan={3} className="py-3 text-muted-foreground">Loading…</td></tr>
            : recent.length === 0 ? <tr><td colSpan={3} className="py-3 text-muted-foreground">No runs recorded.</td></tr>
            : recent.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="py-1.5 pr-2 truncate max-w-[180px]"><Link to={`/projects/${p.id}`} className="hover:underline">{p.company_name || p.url}</Link></td>
                <td className={cn('uppercase tracking-wide text-[10px]', TONE[p.status])}>{p.status === 'ready_for_review' ? 'Ready for review' : p.status}</td>
                <td className="text-right font-mono text-muted-foreground">{format(new Date(p.updated_date), 'MMM d HH:mm')}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </Panel>
  );
}