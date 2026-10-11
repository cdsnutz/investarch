import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, Loader2 } from 'lucide-react';
import HegemonyPanel from '@/components/sovereign/HegemonyPanel';
import InfrastructureMap from '@/components/sovereign/InfrastructureMap';
import PrescientLedger from '@/components/sovereign/PrescientLedger';
import AllianceMatrix from '@/components/sovereign/AllianceMatrix';

const PODS = [
  { key: 'oracle', label: 'Prescient Oracle', fn: 'runOracle' },
  { key: 'forge', label: 'Infrastructure Forge', fn: 'runForge' },
  { key: 'swarm', label: 'Synthetic Swarm', fn: 'runSwarm' },
  { key: 'quantum', label: 'Quantum Treasury', fn: 'runQuantumTreasury' },
  { key: 'hegemony', label: 'Hegemony Scan', fn: 'runHegemony' }
];

export default function SovereignOS() {
  const [vectors, setVectors] = useState([]);
  const [layers, setLayers] = useState([]);
  const [alliances, setAlliances] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [treasury, setTreasury] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningPod, setRunningPod] = useState(null);
  const [runningLoop, setRunningLoop] = useState(false);
  const [message, setMessage] = useState('');

  const loadAll = async () => {
    try {
      const [vecPage, layerPage, alPage, snapPage, decPage] = await Promise.all([
        base44.entities.MarketVector.filter({}, { sort: '-conviction_score', limit: 50 }),
        base44.entities.InfrastructureLayer.filter({}, { sort: '-projected_monthly_toll', limit: 50 }),
        base44.entities.Alliance.filter({}, { sort: '-dependency_score', limit: 50 }),
        base44.entities.HegemonySnapshot.filter({}, { sort: '-snapshot_date', limit: 1 }),
        base44.entities.ReinvestmentDecision.filter({}, { sort: '-decision_date', limit: 6 })
      ]);
      setVectors(vecPage.items || []);
      setLayers(layerPage.items || []);
      setAlliances(alPage.items || []);
      setSnapshot((snapPage.items || [])[0] || null);
      setTreasury(decPage.items || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const runPod = async (pod) => {
    setRunningPod(pod.key);
    setMessage('');
    try {
      const res = await base44.functions.invoke(pod.fn, {});
      const d = res.data || {};
      setMessage(Object.values(d).filter((v) => typeof v === 'string').slice(-1)[0] || JSON.stringify(d));
      await loadAll();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.message || 'The pod failed to complete.');
    }
    setRunningPod(null);
  };

  const runLoop = async () => {
    setRunningLoop(true);
    setMessage('');
    try {
      for (const pod of PODS) {
        setRunningPod(pod.key);
        await base44.functions.invoke(pod.fn, {});
      }
      setMessage('Singularity Loop complete: vectors predicted, layers forged, alliances staked, capital hedged, grip measured.');
      await loadAll();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.message || 'The loop broke mid-cycle.');
    }
    setRunningLoop(false);
    setRunningPod(null);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Globe className="size-5 text-slate-500" />
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Sovereign OS</h1>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">V8.0 — The Omnipresent Infrastructure</span>
      </div>

      <HegemonyPanel snapshot={snapshot} onRun={() => runPod(PODS[4])} running={runningPod === 'hegemony'} />

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Singularity Loop</h3>
          <button onClick={runLoop} disabled={runningLoop || runningPod} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
            {runningLoop ? 'Looping…' : 'Run Full Cycle'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {PODS.map((pod) => (
            <button
              key={pod.key}
              onClick={() => runPod(pod)}
              disabled={runningLoop || runningPod}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
            >
              {runningPod === pod.key ? <Loader2 className="size-3 animate-spin" /> : null}
              {pod.label}
            </button>
          ))}
        </div>
        {(runningLoop || runningPod || message) && (
          <p className="text-sm text-muted-foreground">
            {runningPod && runningLoop ? <span className="font-medium text-foreground">{PODS.find((p) => p.key === runningPod)?.label} executing…</span> : message}
          </p>
        )}
      </div>

      {treasury.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Quantum Treasury Doctrine</h3>
          <div className="space-y-2">
            {treasury.map((t) => (
              <div key={t.id} className="flex flex-wrap items-baseline gap-3 text-sm border-b border-border/60 pb-2 last:border-0">
                <span className="font-semibold uppercase text-xs rounded-md bg-muted px-2 py-0.5">{t.decision}</span>
                <span className="font-medium">{t.target_title || 'Portfolio'}</span>
                <span className="tabular-nums text-muted-foreground">${(t.allocation || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                <span className="text-xs text-muted-foreground flex-1 min-w-48">{t.rationale}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="map">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="map">Infrastructure Map</TabsTrigger>
          <TabsTrigger value="ledger">Prescient Ledger</TabsTrigger>
          <TabsTrigger value="alliances">Alliance Matrix</TabsTrigger>
        </TabsList>
        <TabsContent value="map" className="pt-4">
          <InfrastructureMap layers={layers} />
        </TabsContent>
        <TabsContent value="ledger" className="pt-4">
          <PrescientLedger vectors={vectors} />
        </TabsContent>
        <TabsContent value="alliances" className="pt-4">
          <AllianceMatrix alliances={alliances} layers={layers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}