import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Download, Loader2, Package } from 'lucide-react';
import { downloadCodebaseBundle } from '@/lib/codebaseExport';

const PASSES = ['Structure', 'Syntax', 'Contracts'];

function Summary({ report }) {
  return (
    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
        <CheckCircle2 className="size-3.5" />
        Verified before packaging
      </div>
      <p className="text-[11px] text-emerald-900 mt-1">
        {report.codebases} codebase{report.codebases === 1 ? '' : 's'}, {report.files} files, three passes each, {report.errors} errors,{' '}
        {report.warnings} notes.
      </p>
    </div>
  );
}

function Failures({ report }) {
  if (!report) return null;
  const issues = (report.errors || []).slice(0, 6);
  return (
    <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-destructive">
        <AlertTriangle className="size-3.5" />
        {report.seed ? `${report.seed} was not packaged` : 'This build was not packaged'}
      </div>
      <ul className="mt-2 space-y-1">
        {issues.map((issue, index) => (
          <li key={index} className="text-[11px] text-foreground/80 break-words">
            <span className="font-mono">{issue.file || issue.doc}</span>: {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CodebaseExportPanel({ seeds, brand }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  const build = async () => {
    setBusy(true);
    setError('');
    setProgress('');
    setReport(null);
    try {
      const result = await downloadCodebaseBundle(seeds, brand, (done, total, title) =>
        setProgress(`${done} of ${total}${title ? ` · ${title}` : ''}`)
      );
      setReport(result);
    } catch (problem) {
      setError(problem?.message || 'That bundle could not be built.');
      if (problem?.report) setReport(problem.report);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-6 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-heading flex items-center gap-2">
            <Package className="size-4 text-bottle" /> Full codebases
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Every seed becomes a complete application: Express API, Postgres migrations, auth, owner-scoped records,
            worked screens for every collection, a test suite and hand-off docs. Nothing is packaged until it passes.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {PASSES.map((label, index) => (
              <Badge key={label} variant="secondary" className="bg-muted text-[10px] font-normal">
                Pass {index + 1}: {label}
              </Badge>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            {brand?.brand_name
              ? `Brand applied: ${brand.brand_name}.`
              : 'No brand kit saved yet, so the default palette ships. Save one above to brand every site.'}
          </p>
        </div>
        <Button onClick={build} disabled={busy || !seeds?.length} className="w-full sm:w-auto shrink-0">
          {busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Download className="size-4 mr-2" />}
          {busy
            ? progress
              ? `Checking ${progress}`
              : 'Starting checks'
            : `Verify & download ${seeds?.length || 0} codebases`}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive mt-3">{error}</p>}
      {report && report.errors === 0 && !error ? <Summary report={report} /> : null}
      {report && (error || report.errors > 0) ? <Failures report={report} /> : null}
    </section>
  );
}