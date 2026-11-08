import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import NetworkMap from '@/components/nexus/NetworkMap';
import ReadinessPanel from '@/components/nexus/ReadinessPanel';
import NodeInspector from '@/components/nexus/NodeInspector';
import SyndicateMap from '@/components/nexus/SyndicateMap';
import SyndicateList from '@/components/nexus/SyndicateList';
import { Skeleton } from '@/components/ui/skeleton';
import { buildNexus } from '@/lib/nexusGraph';
import { buildSyndicates } from '@/lib/syndicateMap';

export default function EntityNexus() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [syndicate, setSyndicate] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      base44.entities.Project.filter({}, { sort: '-created_date', limit: 20, fields: ['company_name', 'status', 'industry', 'tags', 'scan_score', 'created_date'] }),
      base44.entities.Competitor.filter({}, { sort: '-created_date', limit: 40, fields: ['project_id', 'name', 'overall_score', 'created_date'] }),
      base44.entities.FundingSource.filter({}, { sort: '-created_date', limit: 30, fields: ['project_id', 'name', 'type', 'focus_area', 'outreach_status', 'created_date'] }),
      base44.entities.ArchetypeImprint.filter({}, { sort: '-created_date', limit: 12, fields: ['archetype_name', 'population_segment', 'imprint_thesis', 'channels', 'imprint_depth_pct', 'status', 'created_date'] }),
      base44.entities.IpSeed.filter({}, { sort: '-created_date', limit: 120 }),
      base44.entities.MarketVector.filter({}, { sort: '-created_date', limit: 40 }),
      base44.entities.IpProspectus.filter({}, { sort: '-created_date', limit: 100 })
    ]).then(([p, c, f, a, s, v, pr]) => {
      setData({
        projects: p.status === 'fulfilled' ? p.value.items : [],
        competitors: c.status === 'fulfilled' ? c.value.items : [],
        funding: f.status === 'fulfilled' ? f.value.items : [],
        archetypes: a.status === 'fulfilled' ? a.value.items : [],
        seeds: s.status === 'fulfilled' ? s.value.items : [],
        vectors: v.status === 'fulfilled' ? v.value.items : [],
        prospectuses: pr.status === 'fulfilled' ? pr.value.items : []
      });
    });
  }, []);

  const graph = useMemo(() => (data ? buildNexus(data) : null), [data]);

  const syndicates = useMemo(() => (data
    ? buildSyndicates({ seeds: data.seeds, vectors: data.vectors, prospectuses: data.prospectuses })
    : null), [data]);

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

      {syndicates && syndicates.clusters.length > 0 && (
        <section className="space-y-4 pt-2 border-t border-border">
          <div>
            <h2 className="font-heading text-xl tracking-tight">Seed syndicates</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Which seeds already share an investor base or a market thesis, so they can be argued as one round instead of several. {syndicates.buyerClusters} shared investor bases and {syndicates.vectorClusters} shared market vectors cover {syndicates.coveredSeeds} seeds; every link comes from a named prospectus target, a drafted buyer lead, or a market vector's own vocabulary.
            </p>
          </div>
          {syndicates.buyerClusters === 0 && (
            <p className="text-xs text-muted-foreground">
              No two seeds name the same buyer yet, so only the market-vector axis is mapped. The nightly buyer-lead sweep adds three seeds' worth of named buyers per run, and investor clusters appear as soon as two of them share one.
            </p>
          )}
          <SyndicateMap clusters={syndicates.clusters} active={syndicate} onSelect={setSyndicate} />
          <SyndicateList clusters={syndicates.clusters} activeId={syndicate} onSelect={setSyndicate} />
        </section>
      )}
    </div>
  );
}