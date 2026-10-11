import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Infinity as InfinityIcon, Loader2 } from 'lucide-react';
import ValueStream from '@/components/omega/ValueStream';
import ProbabilityMatrix from '@/components/omega/ProbabilityMatrix';
import AssetRegistry from '@/components/omega/AssetRegistry';
import EvolutionLogView from '@/components/omega/EvolutionLogView';

const PODS = [
  { key: 'sense', label: 'Omni-Sense', fn: 'runOmniSense' },
  { key: 'quantum', label: 'Quantum-Simulation', fn: 'runQuantumSim' },
  { key: 'matter', label: 'Matter-Synthesis', fn: 'runMatterSynthesis' },
  { key: 'symbiosis', label: 'Human-Symbiosis', fn: 'runHumanSymbiosis' },
  { key: 'genesis', label: 'Genesis Engine', fn: 'runGenesis' }
];

export default function OmegaDashboard() {
  const [signals, setSignals] = useState([]);
  const [runs, setRuns] = useState([]);
  const [assets, setAssets] = useState([]);
  const [talent, setTalent] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningPod, setRunningPod] = useState(null);
  const [runningLoop, setRunningLoop] = useState(false);
  const [message, setMessage] = useState('');

  const loadAll = async () => {
    try {
      const [sigPage, runPage, assetPage, talPage, logPage] = await Promise.all([
        base44.entities.LiveSignal.filter({}, { sort: '-confidence', limit: 50 }),
        base44.entities.SimulationRun.filter({}, { sort: '-simulated_date', limit: 20 }),
        base44.entities.PhysicalAsset.filter({}, { sort: '-registered_date', limit: 50 }),
        base44.entities.TalentAlignment.filter({}, { sort: '-designed_date', limit: 50 }),
        base44.entities.EvolutionLog.filter({}, { sort: '-log_date', limit: 20 })
      ]);
      setSignals(sigPage.items || []);
      setRuns(runPage.items || []);
      setAssets(assetPage.items || []);
      setTalent(talPage.items || []);
      setLogs(logPage.items || []);
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
      setMessage('Genesis Loop complete: omniscience fed, probabilities locked, matter synthesized, symbiosis designed, self-upgrade logged.');
      await loadAll();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.message || 'The loop broke mid-genesis.');
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
        <InfinityIcon className="size-5 text-slate-500" />
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Omega Dashboard</h1>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">V10.0 — The Omni-Singularity</span>
      </div>

      <div className="rounded-xl bg-slate-950 text-slate-200 border border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Genesis Loop</h3>
          <button onClick={runLoop} disabled={runningLoop || runningPod} className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50">
            {runningLoop ? 'Recurring…' : 'Run Genesis Loop'}
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

      {talent.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Workforce Symbiosis</h3>
          <div className="space-y-2">
            {talent.map((t) => (
              <div key={t.id} className="border-b border-border/60 pb-2 last:border-0">
                <div className="flex flex-wrap items-baseline gap-2 text-sm">
                  <span className="font-semibold">{t.node_name}</span>
                  <span className="text-xs text-muted-foreground flex-1 min-w-48">{t.objective}</span>
                  <span className="text-[10px] uppercase tracking-wide rounded-md bg-muted px-2 py-0.5 text-muted-foreground">{t.status}</span>
                </div>
                {t.alignment_metric && <div className="text-xs text-muted-foreground mt-1">Watches: <span className="font-medium text-foreground">{t.alignment_metric}</span></div>}
                {t.incentive_design && <div className="text-xs text-muted-foreground mt-0.5">{t.incentive_design}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="stream">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="stream">Global Value-Stream</TabsTrigger>
          <TabsTrigger value="matrix">Probability Matrix</TabsTrigger>
          <TabsTrigger value="registry">Physical Asset Registry</TabsTrigger>
          <TabsTrigger value="evolution">Evolution Log</TabsTrigger>
        </TabsList>
        <TabsContent value="stream" className="pt-4">
          <ValueStream signals={signals} />
        </TabsContent>
        <TabsContent value="matrix" className="pt-4">
          <ProbabilityMatrix runs={runs} />
        </TabsContent>
        <TabsContent value="registry" className="pt-4">
          <AssetRegistry assets={assets} />
        </TabsContent>
        <TabsContent value="evolution" className="pt-4">
          <EvolutionLogView logs={logs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}