import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import moment from 'moment';

const STATUSES = ['drafted', 'filed', 'granted'];

export default function AssetManagement() {
  const [filings, setFilings] = useState(null);
  const [seedTitles, setSeedTitles] = useState({});
  const [stats, setStats] = useState(null);

  useEffect(() => {
    base44.entities.IpFiling.filter({}, { sort: '-created_date', limit: 50 })
      .then((p) => setFilings(p.items)).catch(() => setFilings([]));
    base44.entities.IpSeed.filter({}, { fields: ['id', 'title'], limit: 500 })
      .then((p) => setSeedTitles(Object.fromEntries(p.items.map((s) => [s.id, s.title])))).catch(() => {});
    base44.entities.IpFiling.aggregate({ groupBy: 'status', sum: 'ser_value' })
      .then((r) => setStats(r.rows)).catch(() => setStats([]));
  }, []);

  const totalSer = (stats || []).reduce((a, r) => a + (r.sum_ser_value || 0), 0);
  const filed = (stats || []).filter((r) => r.status === 'filed').reduce((a, r) => a + (r.count || 0), 0);
  const total = (stats || []).reduce((a, r) => a + (r.count || 0), 0);

  const patch = async (id, data) => {
    setFilings((f) => f.map((x) => (x.id === id ? { ...x, ...data } : x)));
    await base44.entities.IpFiling.update(id, data);
  };

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Asset Management"
        subtitle="Every generated IP filing, its protection status, and its Systemic-Entropy-Resistance-Units (SER) value."
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md border border-border bg-white p-4">
          <div className="text-xs text-muted-foreground">Total filings</div>
          <div className="mt-1.5 font-heading text-3xl tabular-nums">{stats == null ? <Skeleton className="h-8 w-10" /> : total}</div>
        </div>
        <div className="rounded-md border border-border bg-white p-4">
          <div className="text-xs text-muted-foreground">Filed</div>
          <div className="mt-1.5 font-heading text-3xl tabular-nums">{stats == null ? <Skeleton className="h-8 w-10" /> : filed}</div>
        </div>
        <div className="rounded-md border border-border bg-white p-4">
          <div className="text-xs text-muted-foreground">Total SER value</div>
          <div className="mt-1.5 font-heading text-3xl tabular-nums">{stats == null ? <Skeleton className="h-8 w-10" /> : Math.round(totalSer).toLocaleString()}</div>
        </div>
      </div>

      {filings == null ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-md" />)}</div>
      ) : filings.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-md">
          <h3 className="font-heading text-xl tracking-tight">No filings yet</h3>
          <p className="text-sm text-muted-foreground mt-2">Filings drafted from IP seeds appear here for tracking.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filings.map((f) => (
            <Card key={f.id} className="p-5 rounded-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-heading text-lg tracking-tight truncate">{f.brand_name || seedTitles[f.seed_id] || 'Untitled filing'}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {f.filing_type} · {moment(f.created_date).format('MMM D, YYYY')}
                  </div>
                  {f.abstract && <p className="text-sm mt-2 line-clamp-2 max-w-2xl">{f.abstract}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground text-right">SER value</div>
                    <input
                      type="number"
                      defaultValue={f.ser_value ?? ''}
                      placeholder="—"
                      onBlur={(e) => { const v = Number(e.target.value); if (!Number.isNaN(v) && e.target.value !== '' && v !== (f.ser_value ?? null)) patch(f.id, { ser_value: v }); }}
                      className="mt-0.5 h-8 w-24 rounded border border-input bg-transparent px-2 text-right font-heading text-lg tabular-nums"
                    />
                  </div>
                  <select
                    value={f.status || 'drafted'}
                    onChange={(e) => patch(f.id, { status: e.target.value })}
                    className="h-8 rounded border border-input bg-transparent px-2 text-xs capitalize"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <Badge variant="outline" className="text-xs capitalize hidden md:inline-flex">{f.status || 'drafted'}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}