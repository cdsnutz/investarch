import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import moment from 'moment';

const GATE_SCOPE_LABEL = { value_flow: 'Value flow', temporal: 'Temporal', consciousness: 'Consciousness', forge: 'Forge', simulation: 'Simulation', axiom: 'Axiom' };

export default function ComplianceAudit() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      base44.entities.Project.count({}),
      base44.entities.IpFiling.count({}),
      base44.entities.LiveSignal.count({}),
      base44.entities.NarrativeVector.count({}),
      base44.entities.IpFiling.aggregate({ sum: 'ser_value' }),
      base44.entities.HegemonySnapshot.list({ sort: '-created_date', limit: 1 }),
      base44.entities.LogicGate.filter({}, { sort: '-created_date', limit: 50 }),
      base44.entities.LiveSignal.list({ sort: '-created_date', limit: 1 }),
      base44.entities.LiveSignal.filter({}, { fields: ['signal_sources'], limit: 200 })
    ]).then(([pc, ic, sc, nc, ser, heg, gates, lastSig, sigs]) => {
      setData({
        projects: pc.status === 'fulfilled' ? pc.value : null,
        filings: ic.status === 'fulfilled' ? ic.value : null,
        signals: sc.status === 'fulfilled' ? sc.value : null,
        narratives: nc.status === 'fulfilled' ? nc.value : null,
        ser: ser.status === 'fulfilled' ? ((ser.value.rows[0] && ser.value.rows[0].sum_ser_value) || 0) : null,
        hegemony: heg.status === 'fulfilled' ? heg.value.items[0] : null,
        gates: gates.status === 'fulfilled' ? gates.value.items : [],
        lastSignal: lastSig.status === 'fulfilled' ? lastSig.value.items[0] : null,
        sources: sigs.status === 'fulfilled'
          ? [...new Set(sigs.value.items.flatMap((s) => s.signal_sources || []))].sort()
          : []
      });
    });
  }, []);

  if (!data) {
    return (
      <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-16 w-72" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-md" />)}
      </div>
    );
  }

  const grip = data.hegemony ? data.hegemony.market_grip_pct : null;
  const built = data.hegemony ? (data.hegemony.built_assets ?? null) : null;
  const protectedAssets = data.hegemony ? (data.hegemony.protected_assets ?? null) : null;
  const activeGates = data.gates.filter((g) => g.status !== 'paused').length;
  const lastGateCheck = data.gates.map((g) => g.last_checked_date).filter(Boolean).sort().pop();

  const engines = [
    { name: 'Dossier Engine', metric: `${data.projects ?? '—'} dossiers synthesized`, last: data.hegemony ? moment(data.hegemony.created_date).format('MMM D, HH:mm') : '—', ok: data.projects != null },
    { name: 'Signal Scanner', metric: `${data.signals ?? '—'} live signals tracked`, last: data.lastSignal ? moment(data.lastSignal.observed_date || data.lastSignal.created_date).format('MMM D, HH:mm') : '—', ok: data.lastSignal != null },
    { name: 'Governance Gates', metric: `${activeGates}/${data.gates.length} gates active`, last: lastGateCheck ? moment(lastGateCheck).format('MMM D, HH:mm') : '—', ok: data.gates.length > 0 },
    { name: 'Hegemony Tracker', metric: grip != null ? `${grip}% market grip` : 'no snapshots yet', last: data.hegemony ? moment(data.hegemony.created_date).format('MMM D, HH:mm') : '—', ok: grip != null }
  ];

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Compliance Audit"
        subtitle="Real-time system status, verified data sources, and the current entropy-resistance health of the platform."
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 rounded-md md:col-span-2">
          <h2 className="font-heading text-lg tracking-tight mb-4">System Status</h2>
          <div className="divide-y divide-border">
            {engines.map((e) => (
              <div key={e.name} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <div className="text-sm font-medium">{e.name}</div>
                  <div className="text-xs text-muted-foreground">{e.metric}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground">{e.last}</span>
                  <Badge variant="outline" className={e.ok ? 'bg-bottle/10 text-bottle border-transparent' : ''}>{e.ok ? 'operational' : 'no data'}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 rounded-md space-y-4">
          <h2 className="font-heading text-lg tracking-tight">Entropy-Resistance Health</h2>
          <div>
            <div className="text-xs text-muted-foreground">Market grip</div>
            <div className="font-heading text-4xl tabular-nums">{grip != null ? `${grip}%` : '—'}</div>
            <div className="h-1.5 mt-2 rounded-full bg-secondary">
              <div className="h-1.5 rounded-full bg-bottle" style={{ width: `${Math.min(100, grip ?? 0)}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Total SER</div>
              <div className="font-heading text-xl tabular-nums">{data.ser != null ? Math.round(data.ser).toLocaleString() : '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Protected / built</div>
              <div className="font-heading text-xl tabular-nums">{built != null ? `${protectedAssets ?? 0}/${built}` : '—'}</div>
            </div>
          </div>
          {data.hegemony?.verdict && <p className="text-sm text-muted-foreground">{data.hegemony.verdict}</p>}
        </Card>
      </div>

      <Card className="p-5 rounded-md">
        <h2 className="font-heading text-lg tracking-tight mb-3">Verified Data Sources</h2>
        {data.sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">No source citations recorded yet. Sources cited by the signal scanner will appear here.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {data.sources.map((s) => <Badge key={s} variant="outline" className="text-xs font-normal">{s}</Badge>)}
          </div>
        )}
      </Card>

      <Card className="p-5 rounded-md">
        <h2 className="font-heading text-lg tracking-tight mb-3">Logic Gate Ledger</h2>
        {data.gates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No governance gates defined.</p>
        ) : (
          <div className="divide-y divide-border">
            {data.gates.map((g) => (
              <div key={g.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="text-sm font-medium flex-1 min-w-32">{g.gate_name}</span>
                <span className="text-xs text-muted-foreground w-24">{GATE_SCOPE_LABEL[g.scope] || g.scope}</span>
                <Badge variant="outline" className="text-xs">{g.status || 'active'}</Badge>
                <span className="text-xs text-muted-foreground w-24">last: {g.last_verdict || '—'}</span>
                <span className="text-xs text-muted-foreground w-20 text-right tabular-nums">{g.enforcement_count ?? 0} enforcements</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}