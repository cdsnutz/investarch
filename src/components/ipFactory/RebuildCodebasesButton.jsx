import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { regenerateAllCodebases, HARDEN_FLOOR } from '@/lib/codebaseRegen';

function Row({ row }) {
  const clean = row.hardened && row.slopLeft === 0 && row.auditErrors === 0 && !row.error;
  return (
    <li className="flex items-start justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <div className="min-w-0">
        <p className="text-xs font-medium break-words">{row.title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {row.passes === 0 ? 'already hardened' : `${row.passes} hardening pass${row.passes === 1 ? '' : 'es'}`} · {row.slopFixed} slop issue
          {row.slopFixed === 1 ? '' : 's'} patched
          {row.slopLeft ? ` · ${row.slopLeft} left` : ''}
          {row.auditErrors ? ` · ${row.auditErrors} audit error${row.auditErrors === 1 ? '' : 's'}` : ''}
          {row.error ? ` · ${row.error}` : ''}
        </p>
      </div>
      <Badge variant="secondary" className={clean ? 'bg-emerald-100 text-emerald-800 shrink-0' : 'bg-amber-100 text-amber-800 shrink-0'}>
        {row.score}/100
      </Badge>
    </li>
  );
}

export default function RebuildCodebasesButton({ seeds, brand, onDone }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  const run = async () => {
    setBusy(true);
    setError('');
    setSummary(null);
    setProgress(null);
    try {
      const result = await regenerateAllCodebases(seeds || [], { brand, onProgress: setProgress });
      setSummary(result);
      onDone?.();
    } catch (problem) {
      setError(problem?.response?.data?.error || problem?.message || 'The rebuild failed.');
    } finally {
      setBusy(false);
    }
  };

  const start = () => {
    setOpen(true);
    run();
  };

  const openIssues = summary
    ? summary.results.filter((row) => !row.hardened || row.slopLeft > 0 || row.auditErrors > 0 || row.error)
    : [];

  return (
    <>
      <Button variant="outline" onClick={start} disabled={busy || !seeds?.length} className="w-full sm:w-auto">
        {busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : <ShieldCheck className="size-4 mr-2" />}
        {busy ? 'Rebuilding codebases' : 'Rebuild all codebases'}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!busy) setOpen(next);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Regenerate every codebase</DialogTitle>
            <DialogDescription>
              Each blueprint is hardened until it clears {HARDEN_FLOOR}/100, then the generated file set is read for house-rule
              slop, the copy that caused it is patched, and the codebase is rebuilt and re-audited.
            </DialogDescription>
          </DialogHeader>

          {busy && (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {progress
                ? `${progress.phase === 'audit' ? 'Auditing' : 'Hardening'} ${progress.index} of ${progress.total}${progress.title ? ` · ${progress.title}` : ''}`
                : 'Reading the ledger…'}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">{error}</div>
          )}

          {summary && (
            <div className="space-y-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="size-3.5" /> {summary.total} codebase{summary.total === 1 ? '' : 's'} rebuilt
                </div>
                <p className="text-[11px] text-emerald-900 mt-1">
                  {summary.hardened} at or above {HARDEN_FLOOR}/100 · {summary.slopFixed} slop issue
                  {summary.slopFixed === 1 ? '' : 's'} patched · {summary.slopLeft} remaining · {summary.auditErrors} audit error
                  {summary.auditErrors === 1 ? '' : 's'}
                  {summary.skipped ? ` · ${summary.skipped} skipped for having no blueprint` : ''}.
                </p>
              </div>

              {openIssues.length > 0 && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                    <AlertTriangle className="size-3.5" /> Below the floor or still flagged
                  </div>
                  <ul className="mt-1">
                    {openIssues.slice(0, 8).map((row) => (
                      <Row key={row.id} row={row} />
                    ))}
                  </ul>
                </div>
              )}

              <ul className="max-h-64 overflow-y-auto">
                {summary.results.slice(0, 40).map((row) => (
                  <Row key={row.id} row={row} />
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}