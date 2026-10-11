import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import moment from 'moment';

export default function SimulationArchive() {
  const [runs, setRuns] = useState(null);
  const [grips, setGrips] = useState(null);

  useEffect(() => {
    base44.entities.SimulationRun.filter({}, { sort: '-simulated_date', limit: 50 })
      .then((p) => setRuns(p.items)).catch(() => setRuns([]));
    base44.entities.HegemonySnapshot.filter({}, { sort: '-created_date', limit: 20, fields: ['snapshot_date', 'market_grip_pct', 'portfolio_value', 'verdict', 'created_date'] })
      .then((p) => setGrips(p.items)).catch(() => setGrips([]));
  }, []);

  const gripData = (grips || []).map((g) => ({
    date: moment(g.snapshot_date || g.created_date).format('MMM D'),
    Grip: g.market_grip_pct ?? 0
  })).reverse();

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Simulation Archive"
        subtitle="Every historical precision simulator run, with timestamps, market-grip metrics, and final projection results."
      />

      <Card className="p-5 rounded-md">
        <h2 className="font-heading text-lg tracking-tight mb-4">Market grip over time</h2>
        {grips == null ? (
          <Skeleton className="h-56 w-full" />
        ) : gripData.length < 2 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">Not enough hegemony snapshots yet to plot a trend.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gripData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="Grip" stroke="#1a3c34" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {runs == null ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-md" />)}</div>
      ) : runs.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-md">
          <h3 className="font-heading text-xl tracking-tight">No simulation runs yet</h3>
          <p className="text-sm text-muted-foreground mt-2">Runs from the Precision Simulator are archived here.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {runs.map((r) => (
            <Card key={r.id} className="p-5 rounded-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading text-lg tracking-tight">{r.subject_name}</span>
                    <Badge variant="outline" className="text-xs">{r.subject_type}</Badge>
                    <span className="text-xs text-muted-foreground">{r.scenario_count ?? (r.scenarios || []).length} scenarios</span>
                  </div>
                  {r.optimal_path && <p className="text-sm mt-2">{r.optimal_path}</p>}
                  {Array.isArray(r.failure_modes) && r.failure_modes.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1.5">Failure modes: {r.failure_modes.join(' · ')}</p>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">{moment(r.simulated_date || r.created_date).format('MMM D, YYYY HH:mm')}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-heading text-3xl tabular-nums leading-none">{r.success_probability != null ? `${Math.round(r.success_probability)}%` : '—'}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">Success probability</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}