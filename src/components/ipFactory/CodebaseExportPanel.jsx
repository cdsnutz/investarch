import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Package, Download } from 'lucide-react';
import { downloadCodebaseBundle } from '@/lib/codebaseExport';

export default function CodebaseExportPanel({ seeds, brand }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const build = async () => {
    setBusy(true);
    setError('');
    setProgress('');
    try {
      await downloadCodebaseBundle(seeds, brand, (done, total) => setProgress(`${done} of ${total}`));
      setProgress('');
    } catch (problem) {
      setError(problem?.message || 'That bundle could not be built.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-6 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-heading flex items-center gap-2"><Package className="size-4 text-bottle" /> Full codebases</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Every seed on this page becomes a complete site: Express API, Postgres migrations, auth, owner-scoped records, tested React client, brand assets and hand-off docs. One folder per seed, each ready for <span className="font-mono">./verify.sh</span>.
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">
            {brand?.brand_name ? `Brand applied: ${brand.brand_name}.` : 'No brand kit saved yet, so the default palette ships. Save one above to brand every site.'}
          </p>
        </div>
        <Button onClick={build} disabled={busy || !seeds?.length} className="w-full sm:w-auto shrink-0">
          {busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Download className="size-4 mr-2" />}
          {busy ? (progress ? `Building ${progress}` : 'Building bundle') : `Download ${seeds?.length || 0} codebases`}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive mt-3">{error}</p>}
    </section>
  );
}