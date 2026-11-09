import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { BadgeCheck, Loader2 } from 'lucide-react';
import { loadSeedConviction } from '@/lib/seedConviction';
import { buildVerifiedSeedsDoc } from '@/lib/verifiedSeedsDoc';

async function pageAll(entity) {
  const records = [];
  let cursor = null;
  for (let page = 0; page < 30; page += 1) {
    const result = await entity.list({ sort: '-created_date', limit: 200, ...(cursor ? { cursor } : {}) });
    records.push(...(result.items || []));
    if (!result.has_more || !result.next_cursor) break;
    cursor = result.next_cursor;
  }
  return records;
}

// Bulk export of the seeds the evidence supports, as one organized document.
export default function VerifiedExportButton() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const run = async () => {
    setBusy(true);
    setNote('Reading the ledger…');
    setError('');
    setDone(null);
    try {
      const [seeds, forges] = await Promise.all([
        pageAll(base44.entities.IpSeed),
        pageAll(base44.entities.MvpForge)
      ]);
      setNote('Reading the buyer research on file…');
      const conviction = await loadSeedConviction(seeds);
      const doc = buildVerifiedSeedsDoc({ seeds, conviction, forges });
      if (!doc.count) {
        setNote('No seed has verified buyer research yet. Research the named buyers first, then export.');
        return;
      }

      const url = URL.createObjectURL(new Blob([doc.markdown], { type: 'text/markdown;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.filename;
      link.click();
      URL.revokeObjectURL(url);
      setNote('');
      setDone(doc);
    } catch (problem) {
      setNote('');
      setError(problem?.message || 'The verified-seed export failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={run} disabled={busy} className="w-full sm:w-auto">
        {busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : <BadgeCheck className="size-4 mr-2" />}
        Export verified seeds
      </Button>
      {(note || error || done) && (
        <div className="w-full text-xs space-y-1">
          {note && <p className="text-muted-foreground">{note}</p>}
          {error && <p className="text-destructive">{error}</p>}
          {done && (
            <p className="text-muted-foreground">
              {done.count} verified seed{done.count === 1 ? '' : 's'} in one document · conviction score and source verification for each · {done.sources} distinct source page{done.sources === 1 ? '' : 's'}
            </p>
          )}
        </div>
      )}
    </>
  );
}