import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, Layers, Search, Loader2 } from 'lucide-react';
import { buildSeedArchive, isEcosystem } from '@/lib/seedArchive';
import { collectBuyers, researchBuyers } from '@/lib/buyerIntel';
import { buildBuyerArchive } from '@/lib/buyerArchive';

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

function save(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const megabytes = (bytes) => `${Math.max(bytes / 1048576, 0.1).toFixed(1)} MB`;

export default function ExportArchives({ brand }) {
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const runSeedArchive = async (scope) => {
    setBusy(scope);
    setNote('Reading the ledger…');
    setResult(null);
    setError('');
    try {
      const all = await pageAll(base44.entities.IpSeed);
      const subset = scope === 'seeds' ? all.filter((seed) => !isEcosystem(seed)) : all.filter(isEcosystem);
      if (!subset.length) {
        setNote(`No ${scope} on the ledger yet.`);
        return;
      }

      const [filings, prospectuses] = await Promise.all([
        pageAll(base44.entities.IpFiling),
        pageAll(base44.entities.IpProspectus)
      ]);
      const filingsBySeed = {};
      filings.forEach((filing) => {
        (filingsBySeed[filing.seed_id] = filingsBySeed[filing.seed_id] || []).push(filing);
      });
      const prospectusBySeed = {};
      prospectuses.forEach((record) => { prospectusBySeed[record.seed_id] = record; });

      const archive = await buildSeedArchive({
        seeds: subset,
        filingsBySeed,
        prospectusBySeed,
        brand,
        root: scope === 'seeds' ? 'Seeds' : 'Ecosystems',
        onProgress: (done, total, title) => setNote(`Packaging ${done} of ${total} · ${title}`)
      });

      save(archive.blob, archive.filename);
      setNote('');
      setResult({
        label: scope === 'seeds' ? 'Seeds' : 'Ecosystems',
        text: `${subset.length} ${scope} · ${archive.files} files · ${megabytes(archive.blob.size)}`,
        skipped: archive.skipped
      });
    } catch (problem) {
      setNote('');
      setError(problem?.message || 'The archive could not be built.');
    } finally {
      setBusy('');
    }
  };

  const runBuyerArchive = async () => {
    setBusy('buyers');
    setNote('Collecting every named buyer…');
    setResult(null);
    setError('');
    try {
      const all = await pageAll(base44.entities.IpSeed);
      const buyers = collectBuyers(all);
      if (!buyers.length) {
        setNote('No named buyers yet. Sweep buyer leads first.');
        return;
      }

      const { intel, failures } = await researchBuyers(buyers, (done, total, label) => {
        setNote(`Researching ${done} of ${total} buyers · ${label}`);
      });

      setNote('Assembling the buyer book…');
      const archive = await buildBuyerArchive({ buyers, intel });
      save(archive.blob, archive.filename);
      setNote('');
      setResult({
        label: 'Buyers',
        text: `${archive.total} buyers · ${archive.researched} researched · ${archive.files} files · ${megabytes(archive.blob.size)}`,
        skipped: failures.map((failure) => ({
          title: failure.buyers.join(', '),
          reason: failure.reason
        }))
      });
    } catch (problem) {
      setNote('');
      setError(problem?.message || 'The buyer book could not be built.');
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => runSeedArchive('seeds')}
        disabled={Boolean(busy)}
        className="w-full sm:w-auto"
      >
        {busy === 'seeds' ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Download className="size-4 mr-2" />}
        Export all seeds
      </Button>
      <Button
        variant="outline"
        onClick={() => runSeedArchive('ecosystems')}
        disabled={Boolean(busy)}
        className="w-full sm:w-auto"
      >
        {busy === 'ecosystems' ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Layers className="size-4 mr-2" />}
        Export all ecosystems
      </Button>
      <Button
        variant="outline"
        onClick={runBuyerArchive}
        disabled={Boolean(busy)}
        className="w-full sm:w-auto"
      >
        {busy === 'buyers' ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Search className="size-4 mr-2" />}
        Export all buyers
      </Button>

      {(note || result || error) && (
        <div className="w-full text-xs space-y-2">
          {note && <p className="text-muted-foreground">{note}</p>}
          {error && <p className="text-destructive">{error}</p>}
          {result && (
            <div className="rounded-lg border bg-card p-3 space-y-1.5">
              <p className="font-medium">{result.label} archive downloaded · {result.text}</p>
              {result.skipped.length > 0 && (
                <div className="text-muted-foreground space-y-1">
                  <p>{result.skipped.length} entr{result.skipped.length === 1 ? 'y was' : 'ies were'} incomplete and noted inside the archive:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {result.skipped.slice(0, 5).map((row, index) => (
                      <li key={index}>{row.title} — {row.reason}</li>
                    ))}
                    {result.skipped.length > 5 && <li>and {result.skipped.length - 5} more</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}