import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Swords, Radar, Dna, Landmark, ClipboardList, Loader2, Crown, AlertTriangle, Rocket, Megaphone, Network, ShieldAlert, Coins } from 'lucide-react';
import ExecutionOrderCard from '@/components/conglomerate/ExecutionOrderCard';
import TreasuryPanel from '@/components/conglomerate/TreasuryPanel';
import AssetFleet from '@/components/conglomerate/AssetFleet';
import PatentFortress from '@/components/conglomerate/PatentFortress';
import TreasuryLedger from '@/components/conglomerate/TreasuryLedger';
import ExpansionQueue from '@/components/conglomerate/ExpansionQueue';
import SynergyLoop from '@/components/conglomerate/SynergyLoop';
import DisruptionMap from '@/components/conglomerate/DisruptionMap';
import ValidationFeed from '@/components/conglomerate/ValidationFeed';
import HeuristicsPanel from '@/components/conglomerate/HeuristicsPanel';

const CORE_PODS = [
  { key: 'war_room', label: 'Run War-Room', fn: 'runWarRoom', icon: Swords },
  { key: 'validation', label: 'Run Ghost Validation', fn: 'runGhostValidation', icon: Radar },
  { key: 'metamorphosis', label: 'Run Metamorphosis', fn: 'runMetamorphosis', icon: Dna },
  { key: 'treasury', label: 'Reprice Treasury', fn: 'runTreasury', icon: Landmark },
  { key: 'order', label: 'Issue Execution Order', fn: 'runExecutionOrder', icon: ClipboardList }
];

const EXEC_PODS = [
  { key: 'deploy', label: 'Deploy Kit', fn: 'runDeploymentKit', icon: Rocket },
  { key: 'traffic', label: 'Traffic Siphon', fn: 'runTrafficSiphon', icon: Megaphone },
  { key: 'synergy', label: 'Synergy Sync', fn: 'runSynergySync', icon: Network },
  { key: 'governance', label: 'Governance Scan', fn: 'runGovernanceScan', icon: ShieldAlert },
  { key: 'cfo', label: 'Neural-CFO', fn: 'runNeuralCFO', icon: Coins }
];

export default function Conglomerate() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [seeds, setSeeds] = useState([]);
  const [seedsById, setSeedsById] = useState({});
  const [order, setOrder] = useState(null);
  const [treasury, setTreasury] = useState(null);
  const [plans, setPlans] = useState([]);
  const [validations, setValidations] = useState([]);
  const [heuristics, setHeuristics] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [growthKits, setGrowthKits] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filings, setFilings] = useState([]);
  const [synergyTriggers, setSynergyTriggers] = useState([]);

  const load = async () => {
    const [seedPage, orderPage, treasPage, planPage, valPage, heurPage, depPage, kitPage, ledgerPage, decisionPage, alertPage, filingPage, synPage] = await Promise.all([
      base44.entities.IpSeed.filter({}, { limit: 200, fields: ['title', 'asymmetric_score', 'status', 'strategy'] }),
      base44.entities.ExecutionOrder.filter({}, { sort: '-created_date', limit: 1 }),
      base44.entities.TreasurySnapshot.filter({}, { sort: '-created_date', limit: 1 }),
      base44.entities.DisruptionPlan.filter({}, { sort: '-created_date', limit: 12 }),
      base44.entities.GhostValidation.filter({}, { sort: '-created_date', limit: 12 }),
      base44.entities.Heuristic.filter({}, { sort: '-created_date', limit: 8 }),
      base44.entities.Deployment.filter({}, { sort: '-created_date', limit: 12 }),
      base44.entities.GrowthKit.filter({}, { sort: '-created_date', limit: 12 }),
      base44.entities.LedgerEntry.filter({}, { sort: '-created_date', limit: 12 }),
      base44.entities.ReinvestmentDecision.filter({}, { sort: '-created_date', limit: 3 }),
      base44.entities.InfringementAlert.filter({}, { sort: '-created_date', limit: 12 }),
      base44.entities.IpFiling.filter({}, { limit: 100, fields: ['seed_id', 'filing_type', 'brand_name'] }),
      base44.entities.SynergyTrigger.filter({}, { sort: '-created_date', limit: 12 })
    ]);
    setSeeds(seedPage.items || []);
    setSeedsById(Object.fromEntries((seedPage.items || []).map((s) => [s.id, s.title])));
    setOrder(orderPage.items?.[0] || null);
    setTreasury(treasPage.items?.[0] || null);
    setPlans(planPage.items || []);
    setValidations(valPage.items || []);
    setHeuristics(heurPage.items || []);
    setDeployments(depPage.items || []);
    setGrowthKits(kitPage.items || []);
    setLedger(ledgerPage.items || []);
    setDecisions(decisionPage.items || []);
    setAlerts(alertPage.items || []);
    setFilings(filingPage.items || []);
    setSynergyTriggers(synPage.items || []);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (active) setError(e.message || 'Load failed.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const runPod = async (pod) => {
    setBusy(pod.key);
    setError('');
    try {
      await base44.functions.invoke(pod.fn, {});
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Pod run failed.');
    } finally {
      setBusy('');
    }
  };

  const logLedger = async (entry) => {
    await base44.entities.LedgerEntry.create({ ...entry, entry_date: new Date().toISOString().slice(0, 10), source: 'manual' });
    await load();
  };

  if (loading) {
    return (
      <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="h-40 rounded-xl bg-muted animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const expansions = validations
    .map((v) => {
      const s = seeds.find((x) => x.id === v.seed_id);
      return { ...v, asym: s?.asymmetric_score || 0 };
    })
    .sort((a, b) => (b.demand_score || 0) * (b.asym || 1) - (a.demand_score || 0) * (a.asym || 1))
    .slice(0, 5);

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
            <Crown className="size-4 text-emerald-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Sovereign Command</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          The Autonomous Empire's live VDR apex: the Asset Fleet, the Treasury Ledger, the Patent Fortress, and the Expansion Queue — driven by the daily execution cycle.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2.5">
          {CORE_PODS.map((pod) => (
            <Button key={pod.key} variant="outline" size="sm" disabled={busy !== ''} onClick={() => runPod(pod)}>
              {busy === pod.key ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <pod.icon className="size-4 mr-1.5" />}
              {busy === pod.key ? 'Running…' : pod.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2.5">
          {EXEC_PODS.map((pod) => (
            <Button key={pod.key} variant="outline" size="sm" disabled={busy !== ''} onClick={() => runPod(pod)}>
              {busy === pod.key ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <pod.icon className="size-4 mr-1.5" />}
              {busy === pod.key ? 'Running…' : pod.label}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/60 p-4 text-sm text-red-700">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />{error}
        </div>
      )}

      <ExecutionOrderCard order={order} seedsById={seedsById} />
      <AssetFleet deployments={deployments} growthKits={growthKits} seedsById={seedsById} />
      <TreasuryPanel snapshot={treasury} />
      <TreasuryLedger ledger={ledger} decisions={decisions} onLog={logLedger} />
      <PatentFortress filings={filings} alerts={alerts} seedsById={seedsById} />

      <div className="grid gap-6 xl:grid-cols-2">
        <ExpansionQueue expansions={expansions} seedsById={seedsById} />
        <SynergyLoop triggers={synergyTriggers} seedsById={seedsById} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DisruptionMap plans={plans} seedsById={seedsById} />
        <ValidationFeed validations={validations} seedsById={seedsById} />
      </div>

      <HeuristicsPanel heuristics={heuristics} />
    </div>
  );
}