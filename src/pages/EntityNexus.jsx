import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const NODE_H = 44, GAP = 14, TOP = 44, W = 800;
const COL = [
  { x: 0, w: 200 },
  { x: 300, w: 200 },
  { x: 600, w: 200 }
];
const y = (i) => TOP + i * (NODE_H + GAP);

function Node({ col, i, node, active, dimmed, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ position: 'absolute', left: COL[col].x, top: y(i), width: COL[col].w, height: NODE_H }}
      className={cn(
        'rounded-md border text-xs text-left px-3 py-2 truncate transition',
        active ? 'border-bottle bg-bottle/10' : 'border-border bg-white',
        dimmed && 'opacity-30'
      )}
    >
      <span className="block truncate font-medium">{node.label}</span>
      <span className="block truncate text-[10px] text-muted-foreground">{node.sub}</span>
    </button>
  );
}

export default function EntityNexus() {
  const [data, setData] = useState(null);
  const [focus, setFocus] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      base44.entities.Project.filter({}, { sort: '-created_date', limit: 20, fields: ['company_name', 'status', 'created_date'] }),
      base44.entities.Competitor.filter({}, { sort: '-created_date', limit: 60, fields: ['project_id', 'name', 'overall_score'] }),
      base44.entities.FundingSource.filter({}, { sort: '-created_date', limit: 60, fields: ['project_id', 'name', 'type'] })
    ]).then(([p, c, f]) => {
      setData({
        projects: p.status === 'fulfilled' ? p.value.items : [],
        competitors: c.status === 'fulfilled' ? c.value.items : [],
        funding: f.status === 'fulfilled' ? f.value.items : []
      });
    });
  }, []);

  if (!data) {
    return (
      <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-96 rounded-md" />
      </div>
    );
  }

  const projects = data.projects;
  const projIndex = Object.fromEntries(projects.map((p, i) => [p.id, i]));
  const projectFor = (id) => (id && projIndex[id] != null ? projIndex[id] : null);

  const rows = Math.max(1, projects.length, Math.ceil(data.competitors.length / 2), data.funding.length);
  const height = TOP + rows * (NODE_H + GAP);

  const edges = [];
  data.competitors.forEach((c, ci) => {
    const pi = projectFor(c.project_id);
    if (pi == null) return;
    edges.push({ x1: COL[0].x + COL[0].w, y1: y(Math.floor(ci / 2)) + NODE_H / 2, x2: COL[1].x, y2: y(pi) + NODE_H / 2, kind: 'competitor', projectId: c.project_id });
  });
  data.funding.forEach((f, fi) => {
    const pi = projectFor(f.project_id);
    if (pi == null) return;
    edges.push({ x1: COL[1].x + COL[1].w, y1: y(pi) + NODE_H / 2, x2: COL[2].x, y2: y(fi) + NODE_H / 2, kind: 'funding', projectId: f.project_id });
  });

  const dimEdge = (e) => focus && e.projectId !== focus;
  const colHeader = (col, label) => (
    <div style={{ position: 'absolute', left: COL[col].x, top: 8, width: COL[col].w }} className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
  );

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Entity Nexus"
        subtitle="How analyzed competitors, funding sources, and generated dossiers connect. Click a dossier to isolate its links."
      />

      {projects.length === 0 ? (
        <div className="rounded-md border border-border border-dashed p-12 text-center">
          <h3 className="font-heading text-xl tracking-tight">Nothing to map yet</h3>
          <p className="text-sm text-muted-foreground mt-2">Run analyses and competitive scoring to populate the nexus.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-white">
          <div className="relative" style={{ width: W, height }}>
            <svg className="absolute inset-0" width={W} height={height}>
              {edges.map((e, i) => (
                <line
                  key={i}
                  x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                  stroke={e.kind === 'competitor' ? '#1a3c34' : '#a8a29e'}
                  strokeWidth={1.5}
                  opacity={dimEdge(e) ? 0.08 : focus ? 0.9 : 0.35}
                />
              ))}
            </svg>
            {colHeader(0, `Competitors (${data.competitors.length})`)}
            {colHeader(1, `Dossiers (${projects.length})`)}
            {colHeader(2, `Funding Sources (${data.funding.length})`)}
            {data.competitors.map((c, i) => (
              <Node key={c.id} col={0} i={Math.floor(i / 2)} node={{ label: c.name, sub: c.overall_score != null ? `score ${c.overall_score}` : 'competitor' }} dimmed={focus && c.project_id !== focus} />
            ))}
            {projects.map((p, i) => (
              <Node key={p.id} col={1} i={i} node={{ label: p.company_name || 'Untitled', sub: p.status }} active={focus === p.id} onClick={() => setFocus(focus === p.id ? null : p.id)} />
            ))}
            {data.funding.map((f, i) => (
              <Node key={f.id} col={2} i={i} node={{ label: f.name, sub: f.type || 'investor' }} dimmed={focus && f.project_id !== focus} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}