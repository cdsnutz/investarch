import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Hammer } from 'lucide-react';
import { loadSeedConviction, convictionResearch } from '@/lib/seedConviction';
import { loadForgeSpecs, forgeSpec, downloadForgeBundle } from '@/lib/goldMvp';
import GoldMvpResult from '@/components/ipFactory/GoldMvpResult';

const MAX_BATCH = 6;

export default function HighConvictionMvpPanel({ seeds, brand, onForged }) {
  const [conviction, setConviction] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    if (!seeds?.length) {
      setConviction({});
      setLoading(false);
      return () => { live = false; };
    }
    setLoading(true);
    loadSeedConviction(seeds)
      .then((map) => { if (live) setConviction(map); })
      .catch(() => { if (live) setConviction({}); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [seeds]);

  const high = useMemo(
    () => (seeds || []).filter((seed) => conviction[seed.id]?.tier === 'high'),
    [seeds, conviction]
  );
  const verified = high.reduce((total, seed) => total + (conviction[seed.id]?.verified || 0), 0);

  const generate = async () => {
    if (!high.length) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const saved = await loadForgeSpecs(high.map((seed) => seed.id));
      const batch = high.filter((seed) => !saved[seed.id]).slice(0, MAX_BATCH);
      const specs = { ...saved };
      const failures = [];

      for (let index = 0; index < batch.length; index += 1) {
        const seed = batch[index];
        setStage(`Building ${seed.title} (${index + 1}/${batch.length})`);
        try {
          const spec = await forgeSpec(seed.id, convictionResearch(conviction[seed.id]));
          if (spec) specs[seed.id] = spec;
          else failures.push({ seed: seed.title, reason: 'teardown came back empty' });
        } catch (problem) {
          failures.push({
            seed: seed.title,
            reason: problem?.response?.data?.error || problem?.message || 'forge failed'
          });
        }
      }

      setStage('Auditing and packaging…');
      const entries = high.map((seed) => ({ seed, spec: specs[seed.id] || null }));
      const bundle = await downloadForgeBundle(entries, brand);
      onForged?.();

      setResult({
        shipped: bundle.shipped.length,
        forged: batch.filter((seed) => specs[seed.id]).length,
        reused: high.filter((seed) => saved[seed.id]).length,
        waiting: Math.max(0, high.length - bundle.shipped.length - failures.length),
        failures: [...failures, ...bundle.failures],
        filename: bundle.filename,
        verification: summarizeVerification(bundle.shipped.map((entry) => entry.spec))
      });
    } catch (problem) {
      setError(problem?.message || 'The build could not finish.');
    } finally {
      setStage('');
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-6 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-heading flex items-center gap-2">
            <Hammer className="size-4 text-bottle" /> High-conviction MVPs
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Only seeds whose buyer research already holds up are built. The verified buyer profiles on file and the
            live competitor teardown decide the data model, the screens and the tests, and the app ships as a runnable
            full stack.
          </p>
          <p className="text-[11px] mt-2">
            {loading ? (
              <span className="text-muted-foreground">Reading the research on file…</span>
            ) : high.length ? (
              <span className="text-emerald-700">
                {high.length} high-conviction seed{high.length === 1 ? '' : 's'} · {verified} verified buyer
                profile{verified === 1 ? '' : 's'} behind {high.length === 1 ? 'it' : 'them'} ·{' '}
                {high.slice(0, 3).map((seed) => seed.title).join(', ')}
                {high.length > 3 ? ` and ${high.length - 3} more` : ''}
              </span>
            ) : (
              <span className="text-muted-foreground">
                No high-conviction seeds yet. Export the buyer book first so the research exists to build on.
              </span>
            )}
          </p>
        </div>
        <Button onClick={generate} disabled={busy || loading || !high.length} className="w-full sm:w-auto shrink-0">
          {busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Hammer className="size-4 mr-2" />}
          {busy ? stage || 'Starting the build' : `Generate MVP${high.length === 1 ? '' : `s${high.length ? ` (${high.length})` : ''}`}`}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive mt-3">{error}</p>}
      <GoldMvpResult result={result} />
    </section>
  );
}