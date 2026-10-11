import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import moment from 'moment';

const statusClasses = {
  predicted: '',
  staked: 'bg-bottle/10 text-bottle border-transparent',
  foundation_building: 'bg-secondary text-secondary-foreground border-transparent',
  operational: 'bg-bottle text-bottle-foreground border-transparent'
};

export default function MarketIntel() {
  const [vectors, setVectors] = useState(null);
  const [sector, setSector] = useState('all');
  const [sectors, setSectors] = useState([]);

  useEffect(() => {
    base44.entities.MarketVector.list({ distinct: 'sector' }).then((r) => setSectors(r.items.filter(Boolean))).catch(() => {});
  }, []);

  useEffect(() => {
    setVectors(null);
    const query = sector === 'all' ? {} : { sector };
    base44.entities.MarketVector.filter(query, { sort: '-conviction_score', limit: 50 })
      .then((p) => setVectors(p.items)).catch(() => setVectors([]));
  }, [sector]);

  const chartData = (vectors || []).map((v) => ({
    name: v.vector_name.length > 18 ? `${v.vector_name.slice(0, 17)}…` : v.vector_name,
    Conviction: v.conviction_score ?? 0,
    Arrival: v.arrival_probability ?? 0
  }));

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Market Intel"
        subtitle="Current sector data, leading indicators, and conviction scores across active investment vectors."
      />

      <select
        value={sector}
        onChange={(e) => setSector(e.target.value)}
        className="h-9 rounded-md border border-input bg-white px-3 text-sm"
      >
        <option value="all">All sectors</option>
        {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <Card className="p-5 rounded-md">
        <h2 className="font-heading text-lg tracking-tight mb-4">Conviction vs. arrival probability</h2>
        {vectors == null ? (
          <Skeleton className="h-64 w-full" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-16 text-center">No vectors in this sector yet.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Conviction" fill="#1a3c34" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Arrival" fill="#a8a29e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {vectors == null ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-md" />)}</div>
      ) : (
        <div className="space-y-3">
          {vectors.map((v) => (
            <Card key={v.id} className="p-5 rounded-md space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-heading text-lg tracking-tight">{v.vector_name}</span>
                <Badge variant="outline" className={statusClasses[v.status] || ''}>{(v.status || '').replace(/_/g, ' ')}</Badge>
                <span className="text-xs text-muted-foreground">{v.sector} · horizon {v.horizon_months ?? '—'}mo</span>
              </div>
              <p className="text-sm">{v.gold_rush_thesis}</p>
              {Array.isArray(v.leading_indicators) && v.leading_indicators.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {v.leading_indicators.map((li, i) => (
                    <Badge key={i} variant="outline" className="text-xs font-normal">{li}</Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <span>Conviction <span className="font-heading text-base text-foreground tabular-nums">{v.conviction_score ?? '—'}</span>/10</span>
                <span>Arrival <span className="font-heading text-base text-foreground tabular-nums">{v.arrival_probability ?? '—'}%</span></span>
                <span>{moment(v.predicted_date || v.created_date).format('MMM D, YYYY')}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}