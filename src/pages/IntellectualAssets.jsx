import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function IntellectualAssets() {
  const [clusters, setClusters] = useState(null);
  const [filings, setFilings] = useState(null);
  const [seedTitles, setSeedTitles] = useState({});

  useEffect(() => {
    base44.entities.IpFiling.aggregate({ groupBy: 'filing_type', sum: 'ser_value' })
      .then((r) => setClusters(r.rows)).catch(() => setClusters([]));
    base44.entities.IpFiling.filter({}, { sort: '-created_date', limit: 50 })
      .then((p) => setFilings(p.items)).catch(() => setFilings([]));
    base44.entities.IpSeed.filter({}, { fields: ['id', 'title'], limit: 500 })
      .then((p) => setSeedTitles(Object.fromEntries(p.items.map((s) => [s.id, s.title])))).catch(() => {});
  }, []);

  if (clusters == null) {
    return (
      <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-16 w-64" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-md" />)}
      </div>
    );
  }

  const totalSer = clusters.reduce((a, c) => a + (c.sum_ser_value || 0), 0);
  const chartData = clusters.map((c) => ({
    name: `${c.filing_type || 'unclassified'} (${c.count || 0})`,
    SER: c.sum_ser_value || 0
  }));

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Intellectual Assets"
        subtitle="Generated intellectual property with Systemic-Entropy-Resistance-Units accumulated across project clusters."
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 rounded-md md:col-span-1 flex flex-col justify-center">
          <div className="text-xs text-muted-foreground">Total accumulated SER</div>
          <div className="font-heading text-5xl tabular-nums mt-2">{Math.round(totalSer).toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-2">across {clusters.reduce((a, c) => a + (c.count || 0), 0)} filings</div>
        </Card>
        <Card className="p-5 rounded-md md:col-span-2">
          <h2 className="font-heading text-lg tracking-tight mb-4">SER by cluster</h2>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No filings recorded yet.</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="SER" fill="#1a3c34" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {clusters.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          {clusters.map((c) => (
            <Card key={c.filing_type || 'unclassified'} className="p-5 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-heading text-lg tracking-tight capitalize">{c.filing_type || 'unclassified'}</span>
                <Badge variant="outline" className="text-xs">{c.count || 0} filings</Badge>
              </div>
              <div className="font-heading text-3xl tabular-nums">{Math.round(c.sum_ser_value || 0).toLocaleString()} SER</div>
              <div className="h-1.5 rounded-full bg-secondary">
                <div className="h-1.5 rounded-full bg-bottle" style={{ width: `${totalSer ? Math.round(((c.sum_ser_value || 0) / totalSer) * 100) : 0}%` }} />
              </div>
              <div className="text-xs text-muted-foreground">{totalSer ? Math.round(((c.sum_ser_value || 0) / totalSer) * 100) : 0}% of total</div>
            </Card>
          ))}
        </div>
      )}

      {filings == null ? (
        <Skeleton className="h-40 rounded-md" />
      ) : filings.length > 0 ? (
        <Card className="p-5 rounded-md">
          <h2 className="font-heading text-lg tracking-tight mb-3">Filings</h2>
          <div className="divide-y divide-border">
            {filings.map((f) => (
              <div key={f.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="text-sm font-medium flex-1 min-w-40 truncate">{f.brand_name || seedTitles[f.seed_id] || 'Untitled filing'}</span>
                <Badge variant="outline" className="text-xs capitalize">{f.filing_type}</Badge>
                <Badge variant="outline" className="text-xs capitalize">{f.status || 'drafted'}</Badge>
                <span className="text-sm tabular-nums w-24 text-right">{f.ser_value != null ? `${Math.round(f.ser_value).toLocaleString()} SER` : '—'}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}