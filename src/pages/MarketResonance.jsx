import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function MarketResonance() {
  const [narratives, setNarratives] = useState(null);
  const [imprints, setImprints] = useState(null);
  const [reception, setReception] = useState(null);

  useEffect(() => {
    base44.entities.NarrativeVector.filter({}, { sort: '-adoption_forecast_pct', limit: 20, fields: ['narrative_name', 'target_market', 'adoption_forecast_pct', 'status'] })
      .then((p) => setNarratives(p.items)).catch(() => setNarratives([]));
    base44.entities.ArchetypeImprint.filter({}, { sort: '-created_date', limit: 20, fields: ['archetype_name', 'population_segment', 'imprint_depth_pct', 'status', 'channels', 'created_date'] })
      .then((p) => setImprints(p.items)).catch(() => setImprints([]));
    base44.entities.LiveSignal.aggregate({ groupBy: 'domain', count: true, avg: 'confidence', sort: '-count' })
      .then((r) => setReception(r.rows)).catch(() => setReception([]));
  }, []);

  if (narratives == null || imprints == null) {
    return (
      <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-16 w-64" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-md" />)}
      </div>
    );
  }

  const narrativeData = narratives
    .filter((n) => n.adoption_forecast_pct != null)
    .map((n) => ({ name: n.narrative_name.length > 22 ? `${n.narrative_name.slice(0, 21)}…` : n.narrative_name, Adoption: n.adoption_forecast_pct }));

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Market Resonance"
        subtitle="How business narratives and signals are landing across market segments and domains."
      />

      <Card className="p-5 rounded-md">
        <h2 className="font-heading text-lg tracking-tight mb-4">Narrative adoption forecast</h2>
        {narrativeData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">No adoption forecasts recorded yet.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={narrativeData} layout="vertical" margin={{ top: 0, right: 16, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                <Tooltip />
                <Bar dataKey="Adoption" fill="#1a3c34" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div>
        <h2 className="font-heading text-xl tracking-tight mb-4">Segment imprints</h2>
        {imprints.length === 0 ? (
          <Card className="p-10 text-center border-dashed rounded-md"><p className="text-sm text-muted-foreground">No archetype imprints yet.</p></Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {imprints.map((im) => (
              <Card key={im.id} className="p-5 rounded-md space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-heading text-lg tracking-tight">{im.archetype_name}</span>
                  <Badge variant="outline" className="text-xs">{im.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{im.population_segment}</div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Imprint depth</span><span className="tabular-nums">{im.imprint_depth_pct ?? '—'}%</span></div>
                  <div className="h-1.5 rounded-full bg-secondary">
                    <div className="h-1.5 rounded-full bg-bottle" style={{ width: `${Math.min(100, im.imprint_depth_pct ?? 0)}%` }} />
                  </div>
                </div>
                {Array.isArray(im.channels) && im.channels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">{im.channels.map((c, i) => <Badge key={i} variant="outline" className="text-[10px] font-normal">{c}</Badge>)}</div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="p-5 rounded-md">
        <h2 className="font-heading text-lg tracking-tight mb-3">Signal reception by domain</h2>
        {reception == null ? (
          <Skeleton className="h-20 w-full" />
        ) : reception.length === 0 ? (
          <p className="text-sm text-muted-foreground">No signals recorded yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {reception.map((r) => (
              <div key={r.domain || 'general'} className="flex items-center gap-4 py-2.5">
                <span className="text-sm font-medium flex-1 min-w-32">{r.domain || 'General'}</span>
                <span className="text-xs text-muted-foreground w-20 text-right tabular-nums">{r.count} signals</span>
                <span className="text-xs text-muted-foreground w-24 text-right tabular-nums">avg conviction {r.avg_confidence != null ? Math.round(r.avg_confidence * 10) / 10 : '—'}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}