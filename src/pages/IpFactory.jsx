import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Radar, Crosshair, BrainCircuit } from 'lucide-react';
import { SeedBody } from '@/components/ipFactory/SeedDetail';
import RunCost from '@/components/ipFactory/RunCost';
import AgentRegistryPanel from '@/components/ipFactory/AgentRegistryPanel';
import CodebaseExportPanel from '@/components/ipFactory/CodebaseExportPanel';
import BrandKitPanel from '@/components/brand/BrandKitPanel';
import { Badge } from '@/components/ui/badge';
import { HUNT_PRESETS } from '@/lib/ipVectors';

const STAGES = [
  'Signal Miner: sweeping 24 market vectors — launch feeds, app charts, repos, dockets…',
  'Filtering for asymmetric market lacunae…',
  'Synthesizer: drafting 120 IP-seeds across five parallel batches…',
  'Portfolio Strategist: issuing Hold / Flip / Build verdicts…'
];

const PAGE_SIZE = 60;

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
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [counts, setCounts] = useState({ today: 0, hold: 0, flip: 0, build: 0 });
  const [brand, setBrand] = useState(null);

  const load = useCallback(async (ledger = 'all') => {
    const today = new Date().toISOString().slice(0, 10);
    const [seedPage, filingPage, prospectusPage, todayCount, holdCount, flipCount, buildCount] = await Promise.all([
      base44.entities.IpSeed.filter(ledger === 'all' ? {} : { strategy: ledger }, { sort: '-created_date', limit: PAGE_SIZE }),
      base44.entities.IpFiling.filter({}, { sort: '-created_date', limit: 300 }),
      base44.entities.IpProspectus.filter({}, { sort: '-created_date', limit: 300 }),
      base44.entities.IpSeed.count({ yield_date: today }),
      base44.entities.IpSeed.count({ strategy: 'hold' }),
      base44.entities.IpSeed.count({ strategy: 'flip' }),
      base44.entities.IpSeed.count({ strategy: 'build' })
    ]);
    setSeeds(seedPage.items || []);
    setCursor(seedPage.next_cursor || null);
    setHasMore(Boolean(seedPage.has_more));
    setFilings(filingPage.items || []);
    setProspectuses(prospectusPage.items || []);
    setCounts({ today: todayCount, hold: holdCount, flip: flipCount, build: buildCount });
  }, []);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await base44.entities.IpSeed.filter(
        filter === 'all' ? {} : { strategy: filter },
        { sort: '-created_date', limit: PAGE_SIZE, cursor }
      );
      setSeeds((prev) => [...(prev || []), ...(page.items || [])]);
      setCursor(page.next_cursor || null);
      setHasMore(Boolean(page.has_more));
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => { load(filter).catch(() => setSeeds([])); }, [filter, load]);

  useEffect(() => {
    base44.entities.BrandKit.filter({}, { sort: '-updated_date', limit: 1 })
      .then((page) => setBrand((page.items || [])[0] || null))
      .catch(() => setBrand(null));
  }, []);

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
      await load(filter);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'The hunt failed.');
    } finally {
      setRunning(false);
    }
  };

  const filingsBySeed = {};
  filings.forEach((f) => { (filingsBySeed[f.seed_id] = filingsBySeed[f.seed_id] || []).push(f); });
  const prospectusBySeed = {};
  prospectuses.forEach((p) => { prospectusBySeed[p.seed_id] = p; });

  return (
    <div className="p-4 sm:p-6 md:p-12 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-start gap-4 mb-6 sm:mb-8">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-2.5">
            <Radar className="size-6 text-emerald-500" /> IP Factory
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">The Market Hunter sweeps twenty-four market vectors, weighted toward the frontier — AI agents, developer tooling, new compute, consumer breakouts — for live pain-signals opened in the last twelve months, skips anything already in the portfolio, and converts the sharpest lacunae into a yield of 120 IP-seeds, each with its own path to first thousand users. The Registrar then turns each seed into a legal asset: patents written as claims, trademark packets, deeds, and a liquidation prospectus naming its buyers.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-center w-full sm:w-auto">
          <div className="rounded-lg border bg-card px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="text-lg sm:text-xl font-semibold tabular-nums">{counts.today}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Today's yield</div>
          </div>
          <div className="rounded-lg border bg-card px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="text-lg sm:text-xl font-semibold tabular-nums text-slate-600">{counts.hold}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Hold</div>
          </div>
          <div className="rounded-lg border bg-card px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="text-lg sm:text-xl font-semibold tabular-nums text-amber-600">{counts.flip}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Flip</div>
          </div>
          <div className="rounded-lg border bg-card px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="text-lg sm:text-xl font-semibold tabular-nums text-emerald-600">{counts.build}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Build</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-6">
        <Button onClick={runHunt} disabled={running} className="w-full sm:w-auto">
          {running ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Crosshair className="size-4 mr-2" />}
          {running ? 'The hunt is running' : 'Run the hunt now'}
        </Button>
        <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all" className="flex-1 sm:flex-none">All</TabsTrigger>
            <TabsTrigger value="hold" className="flex-1 sm:flex-none">Hold</TabsTrigger>
            <TabsTrigger value="flip" className="flex-1 sm:flex-none">Flip</TabsTrigger>
            <TabsTrigger value="build" className="flex-1 sm:flex-none">Build</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mb-6">
        <RunCost running={running} lastRun={lastRun} />
      </div>

      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Hunt scope</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {HUNT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              disabled={running}
              aria-pressed={preset === p.id}
              className={`w-full rounded-lg border px-3 py-2 text-left transition disabled:opacity-50 ${preset === p.id ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'bg-card hover:border-foreground/30'}`}
            >
              <span className="block text-xs font-medium">{p.label}</span>
              <span className="block text-[10px] text-muted-foreground">{p.blurb}</span>
            </button>
          ))}
        </div>
      </div>

      <BrandKitPanel brand={brand} onChange={setBrand} />
      <CodebaseExportPanel seeds={seeds || []} brand={brand} />

      <AgentRegistryPanel onChanged={() => load(filter)} />

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
      ) : seeds.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          No seeds{filter !== 'all' ? ` on the ${filter} ledger` : ''} yet. Run the hunt to harvest the market.
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {seeds.map((s) => (
            <div key={s.id} className="rounded-xl border bg-card p-4 sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg sm:text-xl font-semibold leading-snug break-words">{s.title}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-slate-100">Asym {s.asymmetric_score}/10</Badge>
                  <Badge variant="secondary" className="bg-slate-100">{s.strategy}</Badge>
                  {s.yield_date && <span className="text-xs text-muted-foreground">Yield: {s.yield_date}</span>}
                </div>
              </div>
              <SeedBody seed={s} filings={filingsBySeed[s.id] || []} prospectus={prospectusBySeed[s.id]} onRefresh={load} brand={brand} />
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="w-full sm:w-auto">
            {loadingMore && <Loader2 className="size-4 mr-2 animate-spin" />}
            Load more seeds
          </Button>
        </div>
      )}
    </div>
  );
}