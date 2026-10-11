import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Sigma, Loader2 } from 'lucide-react';
import ValueStandardIndex from '@/components/axiom/ValueStandardIndex';
import TemporalMap from '@/components/axiom/TemporalMap';
import ConsciousnessHeatmap from '@/components/axiom/ConsciousnessHeatmap';
import ForgeRegistry from '@/components/axiom/ForgeRegistry';
import OmegaCodeView from '@/components/axiom/OmegaCodeView';
import GateMatrix from '@/components/axiom/GateMatrix';

const PODS = [
  { key: 'axiom', label: 'Axiom', fn: 'runAxiom' },
  { key: 'chronos', label: 'Chronos', fn: 'runChronos' },
  { key: 'psionic', label: 'Psionic', fn: 'runPsionic' },
  { key: 'forge', label: 'Galactic Forge', fn: 'runGalacticForge' },
  { key: 'matter', label: 'Matter-Synthesis', fn: 'runMatterSynthesis' },
  { key: 'gateRules', label: 'Gate Rules', fn: 'runGateDefine' },
  { key: 'gates', label: 'Gate Enforcement', fn: 'runAxiomGates' },
  { key: 'omega', label: 'Omega-Code', fn: 'runOmegaCode' }
];

export default function AxiomCommand() {
  const [axioms, setAxioms] = useState([]);
  const [anchors, setAnchors] = useState([]);
  const [imprints, setImprints] = useState([]);
  const [claims, setClaims] = useState([]);
  const [constants, setConstants] = useState([]);
  const [gates, setGates] = useState([]);
  const [verdicts, setVerdicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningPod, setRunningPod] = useState(null);
  const [runningLoop, setRunningLoop] = useState(false);
  const [message, setMessage] = useState('');

  const loadAll = async () => {
    try {
      const [axPage, anPage, imPage, clPage, lcPage, gtPage, vdPage] = await Promise.all([
        base44.entities.ValueAxiom.filter({}, { sort: '-revaluation_date', limit: 5 }),
        base44.entities.ValueAnchor.filter({}, { sort: 'anchor_year', limit: 50 }),
        base44.entities.ArchetypeImprint.filter({}, { sort: '-imprint_depth_pct', limit: 50 }),
        base44.entities.CelestialClaim.filter({}, { sort: '-registered_date', limit: 50 }),
        base44.entities.LogicConstant.filter({}, { sort: '-defined_date', limit: 10 }),
        base44.entities.LogicGate.filter({}, { sort: 'scope', limit: 50 }),
        base44.entities.GateVerdict.filter({}, { sort: '-verdict_date', limit: 20 })
      ]);
      setAxioms(axPage.items || []);
      setAnchors(anPage.items || []);
      setImprints(imPage.items || []);
      setClaims(clPage.items || []);
      setConstants(lcPage.items || []);
      setGates(gtPage.items || []);
      setVerdicts(vdPage.items || []);
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
      setMessage('Axiom Loop complete: standard defined, gates derived, inevitabilities anchored, archetypes imprinted, claims forged, matter synthesized, value flow validated, constant refined.');
      await loadAll();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.message || 'The loop broke mid-axiom.');
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
        <Sigma className="size-5 text-slate-500" />
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Axiom Command</h1>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">V11.0 — The Sovereign Orchestration Layer</span>
      </div>

      <div className="rounded-xl bg-slate-950 text-slate-200 border border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Axiom Loop</h3>
          <button onClick={runLoop} disabled={runningLoop || runningPod} className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50">
            {runningLoop ? 'Recurring…' : 'Run Axiom Loop'}
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

      <Tabs defaultValue="standard">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="standard">Value-Standard Index</TabsTrigger>
          <TabsTrigger value="temporal">Temporal Map</TabsTrigger>
          <TabsTrigger value="consciousness">Consciousness Heatmap</TabsTrigger>
          <TabsTrigger value="forge">Forge Registry</TabsTrigger>
          <TabsTrigger value="omega">Omega-Code</TabsTrigger>
          <TabsTrigger value="gates">Logic Gates</TabsTrigger>
        </TabsList>
        <TabsContent value="standard" className="pt-4">
          <ValueStandardIndex axiom={axioms[0]} />
        </TabsContent>
        <TabsContent value="temporal" className="pt-4">
          <TemporalMap anchors={anchors} />
        </TabsContent>
        <TabsContent value="consciousness" className="pt-4">
          <ConsciousnessHeatmap imprints={imprints} />
        </TabsContent>
        <TabsContent value="forge" className="pt-4">
          <ForgeRegistry claims={claims} />
        </TabsContent>
        <TabsContent value="omega" className="pt-4">
          <OmegaCodeView constants={constants} />
        </TabsContent>
        <TabsContent value="gates" className="pt-4">
          <GateMatrix gates={gates} verdicts={verdicts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}