import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';

// Scores a Market Hunter seed with a Hugging Face model and writes the verdict back to the seed.
export default function ScoreSeedButton({ seed, hf, onScored }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const score = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await hf.run({ action: 'score_signal', seedId: seed.id });
      const patch = { signal_score: res.signal_score, signal_note: res.note };
      await base44.entities.MarketSeed.update(seed.id, patch);
      onScored?.(patch);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Scoring failed');
      hf.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button size="sm" variant="outline" className="h-7" disabled={busy} onClick={score}>
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
        {busy ? 'Scoring' : 'Score'}
      </Button>
      {error && <span className="text-[10px] leading-tight text-destructive max-w-[150px]">{error}</span>}
    </div>
  );
}