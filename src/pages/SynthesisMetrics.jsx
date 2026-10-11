import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import moment from 'moment';

export default function SynthesisMetrics() {
  const [kpis, setKpis] = useState(null);
  const [scoreTrend, setScoreTrend] = useState(null);
  const [signalTrend, setSignalTrend] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      base44.entities.Project.count({}),
      base44.entities.NarrativeVector.count({}),
      base44.entities.LiveSignal.count({}),
      base44.entities.FundingSource.count({}),
      base44.entities.Project.filter({ status: 'complete' }, { sort: '-created_date', limit: 50, fields: ['created_date', 'updated_date'] }),
      base44.entities.Project.aggregate({ dateBucket: { field: 'created_date', unit: 'week' }, avg: 'scan_score' }),
      base44.entities.LiveSignal.aggregate({ dateBucket: { field: 'created_date', unit: 'week' }, avg: 'confidence' })
    ]).then(([pc, nc, sc, fc, projects, scores, confs]) => {
      const projItems = projects.status === 'fulfilled' ? projects.value.items : [];
      const durations = projItems
        .map((p) => moment(p.updated_date).diff(moment(p.created_date)))
        .filter((d) => d > 0);
      const avgHours = durations.length ? durations.reduce((a, d) => a + d, 0) / durations.length / 3600000 : null;

      const scoreRows = scores.status === 'fulfilled' ? scores.value.rows : [];
      const confRows = confs.status === 'fulfilled' ? confs.value.rows : [];
      const weeks = [...new Set([...scoreRows.map((r) => r.dateBucket), ...confRows.map((r) => r.dateBucket)])].sort();
      const scoreMap = Object.fromEntries(scoreRows.map((r) => [r.dateBucket, r.avg_scan_score]));
      const confMap = Object.fromEntries(confRows.map((r) => [r.dateBucket, r.avg_confidence]));

      setKpis({
        projects: pc.status === 'fulfilled' ? pc.value : null,
        narratives: nc.status === 'fulfilled' ? nc.value : null,
        signals: sc.status === 'fulfilled' ? sc.value : null,
        funding: fc.status === 'fulfilled' ? fc.value : null,
        avgHours
      });
      setScoreTrend(weeks.map((w) => ({ week: moment(w).format('MMM D'), Score: scoreMap[w] != null ? Math.round(scoreMap[w]) : null })));
      setSignalTrend(weeks.map((w) => ({ week: moment(w).format('MMM D'), Confidence: confMap[w] != null ? Math.round(confMap[w] * 10) / 10 : null })));
    });
  }, []);

  if (!kpis) {
    return (
      <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-16 w-64" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-md" />)}
      </div>
    );
  }

  const strip = [
    { label: 'Dossiers synthesized', value: kpis.projects },
    { label: 'Narratives in play', value: kpis.narratives },
    { label: 'Live signals', value: kpis.signals },
    { label: 'Funding matches', value: kpis.funding },
    { label: 'Avg synthesis time', value: kpis.avgHours != null ? `${Math.round(kpis.avgHours)}h` : null }
  ];

  const chart = (title, data, key, color) => (
    <Card className="p-5 rounded-md">
      <h2 className="font-heading text-lg tracking-tight mb-4">{title}</h2>
      {data && data.some((d) => d[key] != null) ? (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-14 text-center">Not enough history yet.</p>
      )}
    </Card>
  );

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Synthesis Metrics"
        subtitle="Engine effectiveness: synthesis speed, narrative count, and conversion-signal quality over time."
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {strip.map((s) => (
          <div key={s.label} className="rounded-md border border-border bg-white p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1.5 font-heading text-3xl tabular-nums">{s.value != null ? s.value : <Skeleton className="h-8 w-10" />}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {chart('Average scan score per week', scoreTrend, 'Score', '#1a3c34')}
        {chart('Average signal conviction per week', signalTrend, 'Confidence', '#78716c')}
      </div>
    </div>
  );
}