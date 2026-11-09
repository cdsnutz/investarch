import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Rocket } from 'lucide-react';
import { loadForgeSpecs, forgeSpec, downloadForgeBundle } from '@/lib/goldMvp';
import GoldMvpResult from '@/components/ipFactory/GoldMvpResult';

const BATCH = 10;

export default function GoldMvpPanel({ seeds, brand, onForged }) {
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('');
  const [reforge, setReforge] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const forge = async () => {
    if (!seeds?.length) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const saved = await loadForgeSpecs(seeds.map((seed) => seed.id));
      const candidates = reforge ? seeds : seeds.filter((seed) => !saved[seed.id]);
      const batch = candidates.slice(0, BATCH);
      const specs = { ...saved };
      const failures = [];

      for (let index = 0; index < batch.length; index += 1) {
        setStage(`Reading the market: ${batch[index].title} (${index + 1}/${batch.length})`);
        try {
          const spec = await forgeSpec(batch[index].id);
          if (spec) specs[batch[index].id] = spec;
          else failures.push({ seed: batch[index].title, reason: 'teardown came back empty' });
        } catch (problem) {
          failures.push({
            seed: batch[index].title,
            reason: problem?.response?.data?.error || problem?.message || 'forge failed'
          });
        }
      }

      setStage('Auditing and packaging codebases…');
      const entries = seeds.map((seed) => ({ seed, spec: specs[seed.id] || null }));
      const bundle = await downloadForgeBundle(entries, brand);
      onForged?.();

      setResult({
        shipped: bundle.shipped.length,
        forged: batch.filter((seed) => specs[seed.id]).length,
        reused: entries.filter((entry) => entry.spec && !batch.some((seed) => seed.id === entry.seed.id)).length,
        waiting: entries.filter((entry) => !entry.spec).length,
        failures: [...failures, ...bundle.failures],
        filename: bundle.filename,
        verification: summarizeVerification(bundle.shipped.map((entry) => entry.spec))
      });
    } catch (problem) {
      setError(problem?.message || 'The forge could not finish.');
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
            <Rocket className="size-4 text-bottle" /> Gold-standard MVPs
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Every seed is read against the products already selling into its space, then built: the teardown decides the
            data model, the screens and the acceptance tests, and the app ships as a runnable full stack with the
            competitor brief inside it. Ten seeds per press; saved teardowns are reused.
          </p>
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground mt-2">
            <input
              type="checkbox"
              checked={reforge}
              onChange={(event) => setReforge(event.target.checked)}
              disabled={busy}
              className="size-3.5 accent-emerald-600"
            />
            Re-read the market even where a teardown is already saved
          </label>
        </div>
        <Button onClick={forge} disabled={busy || !seeds?.length} className="w-full sm:w-auto shrink-0">
          {busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Rocket className="size-4 mr-2" />}
          {busy ? stage || 'Starting the forge' : `Forge & export ${seeds?.length || 0} MVPs`}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive mt-3">{error}</p>}
      <GoldMvpResult result={result} />
    </section>
  );
}