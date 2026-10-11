import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Loader2 } from 'lucide-react';
import NarrativeMap from '@/components/vault/NarrativeMap';
import SynergyMatrix from '@/components/vault/SynergyMatrix';
import InfluenceLedger from '@/components/vault/InfluenceLedger';
import HegemonyProjection from '@/components/vault/HegemonyProjection';

const PODS = [
  { key: 'perception', label: 'Perception Pod', fn: 'runPerception' },
  { key: 'convergence', label: 'Convergence Engine', fn: 'runConvergence' },
  { key: 'diplomat', label: 'Sovereign Diplomat', fn: 'runDiplomat' },
  { key: 'face', label: 'Synthetic Face Pod', fn: 'runFace' },
  { key: 'cortex', label: 'Omni-Cortex', fn: 'runOmniCortex' }
];

export default function HegemonyVault() {
  const [narratives, setNarratives] = useState([]);
  const [hybrids, setHybrids] = useState([]);
  const [levers, setLevers] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [epoch, setEpoch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningPod, setRunningPod] = useState(null);
  const [runningLoop, setRunningLoop] = useState(false);
  const [message, setMessage] = useState('');

  const loadAll = async () => {
    try {
      const [narPage, hybPage, levPage, perPage, epochPage] = await Promise.all([
        base44.entities.NarrativeVector.filter({}, { sort: '-adoption_forecast_pct', limit: 50 }),
        base44.entities.HybridAsset.filter({}, { sort: '-monopoly_score', limit: 50 }),
        base44.entities.RegulatoryLever.filter({}, { sort: '-moat_strength', limit: 50 }),
        base44.entities.SyntheticPersona.filter({}, { sort: '-audience_estimate', limit: 50 }),
        base44.entities.EpochSnapshot.filter({}, { sort: '-projection_date', limit: 1 })
      ]);
      setNarratives(narPage.items || []);
      setHybrids(hybPage.items || []);
      setLevers(levPage.items || []);
      setPersonas(perPage.items || []);
      setEpoch((epochPage.items || [])[0] || null);
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
      setMessage('Singularity Cycle complete: perception engineered, super-assets synthesized, personas deployed, regulatory terrain mapped, epoch projected.');
      await loadAll();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.message || 'The cycle broke mid-epoch.');
    }
    setRunningLoop(false);
    setRunningPod(null);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Brain className="size-5 text-slate-500" />
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Hegemony Vault</h1>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">V9.0 — The Synthetic Hegemony</span>
      </div>

      <div className="rounded-xl bg-slate-950 text-slate-200 border border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Supreme Evolutionary Loop</h3>
          <button onClick={runLoop} disabled={runningLoop || runningPod} className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50">
            {runningLoop ? 'Recurring…' : 'Run Singularity Cycle'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {PODS.map((pod) => (
            <button
              key={pod.key}
              onClick={() => runPod(pod)}
              disabled={runningLoop || runningPod}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900 disabled:opacity-50"
            >
              {runningPod === pod.key ? <Loader2 className="size-3 animate-spin" /> : null}
              {pod.label}
            </button>
          ))}
        </div>
        {(runningLoop || runningPod || message) && (
          <p className="text-sm text-slate-300">
            {runningPod && runningLoop ? <span className="font-medium text-white">{PODS.find((p) => p.key === runningPod)?.label} executing…</span> : message}
          </p>
        )}
      </div>

      <Tabs defaultValue="narratives">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="narratives">Narrative Map</TabsTrigger>
          <TabsTrigger value="synergy">Synergy Matrix</TabsTrigger>
          <TabsTrigger value="influence">Influence Ledger</TabsTrigger>
          <TabsTrigger value="projection">Hegemony Projection</TabsTrigger>
        </TabsList>
        <TabsContent value="narratives" className="pt-4">
          <NarrativeMap narratives={narratives} />
        </TabsContent>
        <TabsContent value="synergy" className="pt-4">
          <SynergyMatrix hybrids={hybrids} />
        </TabsContent>
        <TabsContent value="influence" className="pt-4">
          <InfluenceLedger levers={levers} personas={personas} />
        </TabsContent>
        <TabsContent value="projection" className="pt-4">
          <HegemonyProjection epoch={epoch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}