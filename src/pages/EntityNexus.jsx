import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import NetworkMap from '@/components/nexus/NetworkMap';
import ReadinessPanel from '@/components/nexus/ReadinessPanel';
import NodeInspector from '@/components/nexus/NodeInspector';
import { Skeleton } from '@/components/ui/skeleton';
import { buildNexus } from '@/lib/nexusGraph';

export default function EntityNexus() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      base44.entities.Project.filter({}, { sort: '-created_date', limit: 20, fields: ['company_name', 'status', 'industry', 'tags', 'scan_score', 'created_date'] }),
      base44.entities.Competitor.filter({}, { sort: '-created_date', limit: 40, fields: ['project_id', 'name', 'overall_score', 'created_date'] }),
      base44.entities.FundingSource.filter({}, { sort: '-created_date', limit: 30, fields: ['project_id', 'name', 'type', 'focus_area', 'outreach_status', 'created_date'] }),
      base44.entities.ArchetypeImprint.filter({}, { sort: '-created_date', limit: 12, fields: ['archetype_name', 'population_segment', 'imprint_thesis', 'channels', 'imprint_depth_pct', 'status', 'created_date'] })
    ]).then(([p, c, f, a]) => {
      setData({
        projects: p.status === 'fulfilled' ? p.value.items : [],
        competitors: c.status === 'fulfilled' ? c.value.items : [],
        funding: f.status === 'fulfilled' ? f.value.items : [],
        archetypes: a.status === 'fulfilled' ? a.value.items : []
      });
    });
  }, []);

  const graph = useMemo(() => (data ? buildNexus(data) : null), [data]);

  const rows = useMemo(() => {
    if (!graph) return [];
    return data.projects
      .filter((p) => graph.readiness[p.id])
      .map((project) => ({ project, reading: graph.readiness[project.id] }))
      .sort((a, b) => b.reading.score - a.reading.score);
  }, [graph, data]);

  if (!data || !graph) {
    return (
      <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-96 rounded-md" />
      </div>
    );
  }

  const total = data.projects.length + data.competitors.length + data.funding.length + data.archetypes.length;

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-8">
      <PageHeader
        title="Entity Nexus"
        subtitle="Dossiers, competitors, capital claims and archetypes mapped together. Links are inferred from shared market vocabulary, and each dossier's funding readiness is scored by what its network actually contributes."
      />

      {total === 0 ? (
        <div className="rounded-md border border-border border-dashed p-12 text-center">
          <h3 className="font-heading text-xl tracking-tight">Nothing to map yet</h3>
          <p className="text-sm text-muted-foreground mt-2">Run analyses, competitive scoring and archetype imprints to populate the nexus.</p>
        </div>
      ) : (
        <>
          <NetworkMap graph={graph} selected={selected} onSelect={setSelected} />

          <div className="grid gap-6 lg:grid-cols-2">
            <ReadinessPanel rows={rows} selected={selected} onSelect={setSelected} />
            <NodeInspector graph={graph} selectedId={selected} onSelect={setSelected} />
          </div>
        </>
      )}
    </div>
  );
}