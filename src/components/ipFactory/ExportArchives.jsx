import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, Layers, Search, Loader2, FileDown, Contact, UploadCloud } from 'lucide-react';
import { buildSeedArchive, isEcosystem } from '@/lib/seedArchive';
import { collectBuyers, researchBuyers } from '@/lib/buyerIntel';
import { buildBuyerArchive } from '@/lib/buyerArchive';
import { buildHubspotCsv, hubspotCompanies } from '@/lib/hubspotCsv';
import { rankBuyers } from '@/lib/buyerScore';

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

// Rendered PDFs weigh roughly a thousand times their Markdown. The ledger holds thousands of
// seeds, so PDF sets cover the most recent slice and say how many were left to the Markdown export.
const PDF_SEED_CAP = 80;

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
      const subset = scope === 'seeds'
        ? all.filter((seed) => !isEcosystem(seed))
        : scope === 'ecosystems'
          ? all.filter(isEcosystem)
          : all.slice(0, PDF_SEED_CAP);
      if (!subset.length) {
        setNote(scope === 'pdfs' ? 'No seeds on the ledger yet.' : `No ${scope} on the ledger yet.`);
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
        format: scope === 'pdfs' ? 'pdf' : 'markdown',
        root: scope === 'seeds' ? 'Seeds' : scope === 'ecosystems' ? 'Ecosystems' : 'PDF Sets',
        onProgress: (done, total, title) => setNote(`Packaging ${done} of ${total} · ${title}`)
      });

      save(archive.blob, archive.filename);
      setNote('');
      setResult({
        label: scope === 'seeds' ? 'Seeds' : scope === 'ecosystems' ? 'Ecosystems' : 'Dossier PDF sets',
        text: scope === 'pdfs'
          ? `${subset.length} of ${all.length} seeds · ${archive.files} files · ${megabytes(archive.blob.size)} · PDF sets are capped, so the rest of the ledger is in the Markdown export`
          : `${subset.length} ${scope} · ${archive.files} files · ${megabytes(archive.blob.size)}`,
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
      const archive = await buildBuyerArchive({ buyers, intel, failures });
      save(archive.blob, archive.filename);
      setNote('');
      setResult({
        label: 'Buyers',
        text: `${archive.total} buyers · ${archive.researched} researched · ${archive.highConviction} high conviction · verified ${archive.summary.verified} / likely ${archive.summary.likely} / thin ${archive.summary.thin} · ${archive.summary.sourced} with source URLs · ${archive.files} files · ${megabytes(archive.blob.size)}`,
        top: archive.top,
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

  // Ranked from the research already on file, so the CSV and the direct import share one buyer set.
  const loadHighConviction = async () => {
    const [all, research] = await Promise.all([
      pageAll(base44.entities.IpSeed),
      pageAll(base44.entities.BuyerResearch)
    ]);
    const buyers = collectBuyers(all);
    const intel = {};
    research.forEach((record) => {
      [record.company, record.company_name].forEach((key) => {
        const clean = String(key || '').trim().toLowerCase();
        if (clean) intel[clean] = record;
      });
    });
    return hubspotCompanies(rankBuyers(buyers, intel));
  };

  const runHubspotCsv = async () => {
    setBusy('hubspot');
    setNote('Ranking researched buyers…');
    setResult(null);
    setError('');
    try {
      const companies = await loadHighConviction();
      const { csv, count } = buildHubspotCsv(companies);
      if (!count) {
        setNote('No high-conviction buyers yet. Run the buyer book export first, then this CSV.');
        return;
      }

      save(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `investarch-hubspot-buyers-${new Date().toISOString().slice(0, 10)}.csv`);
      setNote('');
      setResult({
        label: 'HubSpot',
        text: `${count} high-conviction compan${count === 1 ? 'y' : 'ies'} · import as companies, mapping the research columns as custom properties`,
        top: [],
        skipped: []
      });
    } catch (problem) {
      setNote('');
      setError(problem?.message || 'The HubSpot CSV could not be built.');
    } finally {
      setBusy('');
    }
  };

  const runHubspotImport = async () => {
    setBusy('push');
    setNote('Ranking researched buyers…');
    setResult(null);
    setError('');
    try {
      const companies = await loadHighConviction();
      if (!companies.length) {
        setNote('No high-conviction buyers yet. Run the buyer book export first.');
        return;
      }

      setNote(`Writing ${companies.length} compan${companies.length === 1 ? 'y' : 'ies'} to HubSpot…`);
      const response = await base44.functions.invoke('hubspotImportBuyers', { companies });
      const data = response?.data || {};
      const landed = data.landed || [];
      setNote('');
      setResult({
        label: 'HubSpot',
        text: `${landed.length} of ${companies.length} confirmed in HubSpot · ${data.created || 0} created · ${data.updated || 0} updated${landed.length ? ` · ${landed.slice(0, 6).map((row) => row.name).join(', ')}${landed.length > 6 ? ` and ${landed.length - 6} more` : ''}` : ''}`,
        top: [],
        skipped: data.failed || []
      });
    } catch (problem) {
      setNote('');
      setError(problem?.response?.data?.error || problem?.message || 'The HubSpot import failed.');
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
        onClick={() => runSeedArchive('pdfs')}
        disabled={Boolean(busy)}
        className="w-full sm:w-auto"
      >
        {busy === 'pdfs' ? <Loader2 className="size-4 mr-2 animate-spin" /> : <FileDown className="size-4 mr-2" />}
        Export dossier PDF sets
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
      <Button
        variant="outline"
        onClick={runHubspotCsv}
        disabled={Boolean(busy)}
        className="w-full sm:w-auto"
      >
        {busy === 'hubspot' ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Contact className="size-4 mr-2" />}
        Export HubSpot CSV
      </Button>
      <Button
        variant="outline"
        onClick={runHubspotImport}
        disabled={Boolean(busy)}
        className="w-full sm:w-auto"
      >
        {busy === 'push' ? <Loader2 className="size-4 mr-2 animate-spin" /> : <UploadCloud className="size-4 mr-2" />}
        Import to HubSpot
      </Button>

      {(note || result || error) && (
        <div className="w-full text-xs space-y-2">
          {note && <p className="text-muted-foreground">{note}</p>}
          {error && <p className="text-destructive">{error}</p>}
          {result && (
            <div className="rounded-lg border bg-card p-3 space-y-1.5">
              <p className="font-medium">{result.label} archive downloaded · {result.text}</p>
              {result.top?.length > 0 && (
                <div className="text-muted-foreground space-y-1">
                  <p>Highest conviction — open these first:</p>
                  <ol className="list-decimal pl-4 space-y-0.5">
                    {result.top.map((row) => (
                      <li key={row.company}>{row.company} — {row.score}/100 · {row.label}</li>
                    ))}
                  </ol>
                </div>
              )}
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