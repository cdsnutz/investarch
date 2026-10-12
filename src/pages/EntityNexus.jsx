import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import NetworkMap from '@/components/nexus/NetworkMap';
import { Skeleton } from '@/components/ui/skeleton';

export default function EntityNexus() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      base44.entities.Project.filter({}, { sort: '-created_date', limit: 20, fields: ['company_name', 'status', 'industry', 'tags', 'created_date'] }),
      base44.entities.Competitor.filter({}, { sort: '-created_date', limit: 60, fields: ['project_id', 'name', 'overall_score', 'created_date'] }),
      base44.entities.FundingSource.filter({}, { sort: '-created_date', limit: 60, fields: ['project_id', 'name', 'type', 'focus_area', 'created_date'] })
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

  const total = data.projects.length + data.competitors.length + data.funding.length;

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Entity Nexus"
        subtitle="A live network map of analyzed competitors, funding sources, and generated dossiers. Brick lines mark direct competition, blue lines mark funding, dashed lines mark shared markets. Hover to trace a node, click to lock focus."
      />

      {total === 0 ? (
        <div className="rounded-md border border-border border-dashed p-12 text-center">
          <h3 className="font-heading text-xl tracking-tight">Nothing to map yet</h3>
          <p className="text-sm text-muted-foreground mt-2">Run analyses and competitive scoring to populate the nexus.</p>
        </div>
      ) : (
        <NetworkMap projects={data.projects} competitors={data.competitors} funding={data.funding} />
      )}
    </div>
  );
}