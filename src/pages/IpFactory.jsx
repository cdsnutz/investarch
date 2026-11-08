import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Radar, Crosshair, BrainCircuit } from 'lucide-react';
import { SeedBody } from '@/components/ipFactory/SeedDetail';
import RunCost from '@/components/ipFactory/RunCost';
import { Badge } from '@/components/ui/badge';
import { HUNT_PRESETS } from '@/lib/ipVectors';

const STAGES = [
  'Signal Miner: sweeping 24 market vectors — launch feeds, app charts, repos, dockets…',
  'Filtering for asymmetric market lacunae…',
  'Synthesizer: drafting 120 IP-seeds across five parallel batches…',
  'Portfolio Strategist: issuing Hold / Flip / Build verdicts…'
];

export default function IpFactory() {
  const [seeds, setSeeds] = useState(null);
  const [filings, setFilings] = useState([]);
  const [prospectuses, setProspectuses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [preset, setPreset] = useState('all');
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState('');
  const [error, setError] = useState('');
  const [lastRun, setLastRun] = useState(null);

  const load = useCallback(async () => {
    const [seedPage, filingPage, prospectusPage] = await Promise.all([
      base44.entities.IpSeed.filter({}, { sort: '-created_date', limit: 400 }),
      base44.entities.IpFiling.filter({}, { sort: '-created_date', limit: 300 }),
      base44.entities.IpProspectus.filter({}, { sort: '-created_date', limit: 300 })
    ]);
    setSeeds(seedPage.items || []);
    setFilings(filingPage.items || []);
    setProspectuses(prospectusPage.items || []);
  }, []);

  useEffect(() => { load().catch(() => setSeeds([])); }, [load]);

  useEffect(() => {
    if (!running) { setStage(''); return; }
    let i = 0;
    setStage(STAGES[0]);
    const t = setInterval(() => { i = (i + 1) % STAGES.length; setStage(STAGES[i]); }, 7000);
    return () => clearInterval(t);
  }, [running]);

  const runHunt = async () => {
    setRunning(true);
    setError('');
    setLastRun(null);
    try {
      const res = await base44.functions.invoke('runIpHunt', { preset });
      setLastRun(res?.data || null);
      await base44.functions.invoke('ipWealthStrategy', {});
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'The hunt failed.');
    } finally {
      setRunning(false);
    }
  };

  const visible = (seeds || []).filter((s) => filter === 'all' || s.strategy === filter);
  const filingsBySeed = {};
  filings.forEach((f) => { (filingsBySeed[f.seed_id] = filingsBySeed[f.seed_id] || []).push(f); });
  const prospectusBySeed = {};
  prospectuses.forEach((p) => { prospectusBySeed[p.seed_id] = p; });
  const today = new Date().toISOString().slice(0, 10);
  const todaysCount = (seeds || []).filter((s) => s.yield_date === today).length;
  const strategyCount = (k) => (seeds || []).filter((s) => s.strategy === k).length;

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start gap-4 mb-8">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-2.5">
            <Radar className="size-6 text-emerald-500" /> IP Factory
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">The Market Hunter sweeps twenty-four market vectors, weighted toward the frontier — AI agents, developer tooling, new compute, consumer breakouts — for live pain-signals opened in the last twelve months, skips anything already in the portfolio, and converts the sharpest lacunae into a yield of 120 IP-seeds, each with its own path to first thousand users. The Registrar then turns each seed into a legal asset: patents written as claims, trademark packets, deeds, and a liquidation prospectus naming its buyers.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="rounded-lg border bg-card px-4 py-3">
            <div className="text-xl font-semibold tabular-nums">{todaysCount}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Today's yield</div>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3">
            <div className="text-xl font-semibold tabular-nums text-slate-600">{strategyCount('hold')}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Hold</div>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3">
            <div className="text-xl font-semibold tabular-nums text-amber-600">{strategyCount('flip')}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Flip</div>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3">
            <div className="text-xl font-semibold tabular-nums text-emerald-600">{strategyCount('build')}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Build</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button onClick={runHunt} disabled={running}>
          {running ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Crosshair className="size-4 mr-2" />}
          {running ? 'The hunt is running' : 'Run the hunt now'}
        </Button>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="hold">Hold</TabsTrigger>
            <TabsTrigger value="flip">Flip</TabsTrigger>
            <TabsTrigger value="build">Build</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mb-6">
        <RunCost running={running} lastRun={lastRun} />
      </div>

      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Hunt scope</div>
        <div className="flex flex-wrap gap-2">
          {HUNT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              disabled={running}
              aria-pressed={preset === p.id}
              className={`rounded-lg border px-3 py-2 text-left transition disabled:opacity-50 ${preset === p.id ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'bg-card hover:border-foreground/30'}`}
            >
              <span className="block text-xs font-medium">{p.label}</span>
              <span className="block text-[10px] text-muted-foreground">{p.blurb}</span>
            </button>
          ))}
        </div>
      </div>

      {running && (
        <div className="rounded-xl border bg-card p-8 flex flex-col items-center text-center mb-6">
          <BrainCircuit className="size-6 text-emerald-500 mb-3" />
          <div className="font-medium">Sovereign IP Hunt</div>
          <div className="text-sm text-muted-foreground mt-1.5 h-5">{stage}</div>
          <p className="text-xs text-muted-foreground/70 mt-3">Signal mining with live web context, then 120 seeds synthesized in five parallel batches — a couple of minutes.</p>
        </div>
      )}

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      {seeds === null ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-xl" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          No seeds{filter !== 'all' ? ` on the ${filter} ledger` : ''} yet. Run the hunt to harvest the market.
        </div>
      ) : (
        <div className="space-y-6">
          {visible.map((s) => (
            <div key={s.id} className="rounded-xl border bg-card p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold leading-snug">{s.title}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-slate-100">Asym {s.asymmetric_score}/10</Badge>
                  <Badge variant="secondary" className="bg-slate-100">{s.strategy}</Badge>
                  {s.yield_date && <span className="text-xs text-muted-foreground">Yield: {s.yield_date}</span>}
                </div>
              </div>
              <SeedBody seed={s} filings={filingsBySeed[s.id] || []} prospectus={prospectusBySeed[s.id]} onRefresh={load} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}