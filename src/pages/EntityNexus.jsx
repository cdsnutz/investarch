import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import NetworkMap from '@/components/nexus/NetworkMap';
import ReadinessPanel from '@/components/nexus/ReadinessPanel';
import NodeInspector from '@/components/nexus/NodeInspector';
import SyndicateMap from '@/components/nexus/SyndicateMap';
import SyndicateList from '@/components/nexus/SyndicateList';
import InvestorBaseFilter from '@/components/nexus/InvestorBaseFilter';
import { Skeleton } from '@/components/ui/skeleton';
import { buildNexus } from '@/lib/nexusGraph';
import { buildSyndicates } from '@/lib/syndicateMap';

export default function EntityNexus() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [syndicate, setSyndicate] = useState(null);
  const [investor, setInvestor] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      base44.entities.Project.filter({}, { sort: '-created_date', limit: 20, fields: ['company_name', 'status', 'industry', 'tags', 'scan_score', 'created_date'] }),
      base44.entities.Competitor.filter({}, { sort: '-created_date', limit: 40, fields: ['project_id', 'name', 'overall_score', 'created_date'] }),
      base44.entities.FundingSource.filter({}, { sort: '-created_date', limit: 200, fields: ['project_id', 'name', 'type', 'focus_area', 'outreach_status', 'created_date'] }),
      base44.entities.ArchetypeImprint.filter({}, { sort: '-created_date', limit: 12, fields: ['archetype_name', 'population_segment', 'imprint_thesis', 'channels', 'imprint_depth_pct', 'status', 'created_date'] }),
      base44.entities.IpSeed.filter({}, {
        sort: '-created_date',
        limit: 200,
        fields: ['title', 'gap', 'solution', 'pain_signal', 'source_channel', 'ecosystem_interlocks', 'mix_thesis', 'asymmetric_score', 'strategy', 'buyer_leads', 'acquisition_playbook', 'funding_playbook']
      }),
      base44.entities.MarketVector.filter({}, { sort: '-created_date', limit: 40 }),
      base44.entities.IpProspectus.filter({}, { sort: '-created_date', limit: 100 }),
      base44.entities.BuyerResearch.filter({}, {
        sort: '-researched_date',
        limit: 300,
        fields: ['company', 'company_name', 'confidence', 'sources', 'buying_trigger', 'seed_ids', 'researched_date']
      })
    ]).then(([p, c, f, a, s, v, pr, br]) => {
      setData({
        projects: p.status === 'fulfilled' ? p.value.items : [],
        competitors: c.status === 'fulfilled' ? c.value.items : [],
        funding: f.status === 'fulfilled' ? f.value.items : [],
        archetypes: a.status === 'fulfilled' ? a.value.items : [],
        seeds: s.status === 'fulfilled' ? s.value.items : [],
        vectors: v.status === 'fulfilled' ? v.value.items : [],
        prospectuses: pr.status === 'fulfilled' ? pr.value.items : [],
        research: br.status === 'fulfilled' ? br.value.items : []
      });
    });
  }, []);

  const graph = useMemo(() => (data ? buildNexus(data) : null), [data]);

  const syndicates = useMemo(() => (data
    ? buildSyndicates({ seeds: data.seeds, vectors: data.vectors, prospectuses: data.prospectuses, funding: data.funding })
    : null), [data]);

  const investorFocus = useMemo(() => {
    if (!syndicates || !investor) return null;
    const label = syndicates.investorBase.find((b) => b.key === investor)?.label;
    const buyer = syndicates.buyers.find((b) => b.id === `buyer:${investor}`);
    return {
      id: `buyer:${investor}`,
      kind: 'buyer',
      label: label || buyer?.label || investor,
      sub: 'shared investor base',
      seeds: buyer?.seeds || [],
      count: buyer?.count || 0,
      combinedAsym: buyer?.combinedAsym || 0,
      avgAsym: buyer?.avgAsym || 0,
      owned: true
    };
  }, [syndicates, investor]);

  const investorOptions = useMemo(() => (syndicates ? syndicates.investorBase : []), [syndicates]);

  const visibleClusters = useMemo(() => {
    if (!syndicates) return [];
    if (!investor) return syndicates.clusters;
    const vectors = syndicates.clusters.filter((c) => c.kind !== 'buyer');
    return investorFocus?.count ? [investorFocus, ...vectors] : vectors;
  }, [syndicates, investor, investorFocus]);

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

  const total = graph.nodes.length;

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-8">
      <PageHeader
        title="Entity Nexus"
        subtitle="Dossiers, competitors, capital claims, archetypes, IP seeds and their buyer leads mapped together. Links are inferred from shared market vocabulary and from researched buyer demand, and each dossier's funding readiness is scored by what its network actually contributes."
      />

      {total === 0 ? (
        <div className="rounded-md border border-border border-dashed p-12 text-center">
          <h3 className="font-heading text-xl tracking-tight">Nothing to map yet</h3>
          <p className="text-sm text-muted-foreground mt-2">Run analyses, competitive scoring and archetype imprints to populate the nexus.</p>
        </div>
      ) : (
        <>
          {!graph.nodes.some((n) => n.type === 'seed') && (
            <p className="text-xs text-muted-foreground">
              No seed has verified buyer research yet. A seed joins the map once research grades one of its buyer leads “verified” with public source URLs behind it — run the buyer book export in the IP Factory to research the ledger.
            </p>
          )}

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
              Which seeds already share an investor base or a market thesis, so they can be argued as one round instead of several. {syndicates.buyerClusters} shared investor bases and {syndicates.vectorClusters} shared market vectors cover {syndicates.coveredSeeds} seeds; every link comes from a named buyer lead, a prospectus target, or a market vector's own vocabulary.
            </p>
          </div>
          <InvestorBaseFilter
            options={investorOptions}
            baseTotal={syndicates.investorBase.length}
            value={investor}
            onChange={(next) => { setInvestor(next); setSyndicate(null); }}
            focus={investorFocus}
          />
          {syndicates.buyerClusters === 0 && (
            <p className="text-xs text-muted-foreground">
              No two seeds name the same buyer yet, so only the market-vector axis is mapped. The nightly buyer-lead sweep names buyers for twelve seeds a night, and investor clusters appear as soon as two of them share one.
            </p>
          )}
          <SyndicateMap clusters={visibleClusters} active={syndicate || (investor ? `buyer:${investor}` : null)} onSelect={setSyndicate} />
          <SyndicateList clusters={visibleClusters} activeId={syndicate || (investor ? `buyer:${investor}` : null)} onSelect={setSyndicate} />
        </section>
      )}
    </div>
  );
}