import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import moment from 'moment';

const compareRows = [
  { key: 'industry', label: 'Industry', get: (p) => p.industry || '—' },
  { key: 'created_date', label: 'Synthesized', get: (p) => moment(p.created_date).format('MMM D, YYYY') },
  { key: 'scan_score', label: 'Scan score', get: (p) => p.scan_score ?? '—' },
  { key: 'plan_revisions', label: 'Plan revisions', get: (p) => p.plan_revisions ?? 0 },
  { key: 'plan_points', label: 'Plan points', get: (p) => (p.plan_points || []).length },
  { key: 'forecast', label: 'Forecast years', get: (p) => (p.forecast_years || []).length },
  { key: 'value_scan', label: 'Value scan total', get: (p) => p.value_scan?.total ?? '—' }
];

export default function SynthesisArchive() {
  const [projects, setProjects] = useState(null);
  const [selected, setSelected] = useState([]);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    base44.entities.Project.filter({}, { sort: '-created_date', limit: 50 })
      .then((p) => setProjects(p.items)).catch(() => setProjects([]));
  }, []);

  const toggle = (id) => {
    setSelected((sel) => sel.includes(id) ? sel.filter((s) => s !== id) : sel.length < 2 ? [...sel, id] : [sel[1], id]);
    setOpen(null);
  };
  const picked = (projects || []).filter((p) => selected.includes(p.id));

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Synthesis Archive"
        subtitle="Every dossier version ever synthesized. Select two to compare scores, revisions, and the research data behind them."
      />

      {picked.length === 2 && (
        <Card className="p-5 rounded-md overflow-x-auto">
          <h2 className="font-heading text-lg tracking-tight mb-4">Comparison</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-medium text-muted-foreground py-2 pr-4">Metric</th>
                {picked.map((p) => (
                  <th key={p.id} className="text-left font-medium py-2 pr-4 font-heading text-base">{p.company_name || 'Untitled'}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {compareRows.map((row) => (
                <tr key={row.key}>
                  <td className="py-2 pr-4 text-muted-foreground">{row.label}</td>
                  {picked.map((p) => <td key={p.id} className="py-2 pr-4 tabular-nums">{row.get(p)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {projects == null ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-md" />)}</div>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-md">
          <h3 className="font-heading text-xl tracking-tight">Archive is empty</h3>
          <p className="text-sm text-muted-foreground mt-2">Dossier versions appear here as synthesis runs complete.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const isSel = selected.includes(p.id);
            return (
              <Card key={p.id} className={`p-5 rounded-md space-y-2 transition ${isSel ? 'border-foreground/40' : ''}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-3 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggle(p.id)}
                      className="size-4 accent-[#1a3c34]"
                    />
                    <span className="font-heading text-lg tracking-tight truncate">{p.company_name || 'Untitled'}</span>
                    <Badge variant="outline" className="text-xs shrink-0">{p.status}</Badge>
                  </label>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                    <span>{moment(p.created_date).format('MMM D, YYYY')}</span>
                    <span className="tabular-nums">score {p.scan_score ?? '—'}</span>
                    <button onClick={() => setOpen(open === p.id ? null : p.id)} className="text-bottle hover:underline">
                      {open === p.id ? 'Hide' : 'Research data'}
                    </button>
                  </div>
                </div>
                {open === p.id && (
                  <div className="border-t border-border pt-3 grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Market analysis</div>
                      <p className="line-clamp-4 whitespace-pre-line">{p.market_analysis || '—'}</p>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Key milestones</div>
                      {p.key_milestones?.length ? (
                        <ul className="list-disc pl-4 space-y-0.5">{p.key_milestones.map((m, i) => <li key={i}>{m}</li>)}</ul>
                      ) : '—'}
                    </div>
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