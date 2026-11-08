import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Sparkles, X } from 'lucide-react';

// Drafts a model rewrite of one dossier section; nothing is saved until Apply.
export default function RewriteSection({ project, field, hf, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await hf.run({ action: 'rewrite_section', projectId: project.id, field });
      setDraft(res.text);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Rewrite failed');
      hf.refresh();
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    setBusy(true);
    try {
      await base44.entities.Project.update(project.id, { [field]: draft });
      onSaved?.(draft);
      setDraft(null);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="print:hidden space-y-3">
      {draft ? (
        <div className="rounded-lg border border-bottle/30 bg-bottle/5 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] uppercase tracking-[0.12em] text-bottle">Proposed rewrite · not saved</span>
            <div className="flex gap-2">
              <Button size="sm" className="h-7 bg-bottle text-bottle-foreground hover:bg-bottle/90" disabled={busy} onClick={apply}>
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Apply
              </Button>
              <Button size="sm" variant="ghost" className="h-7" disabled={busy} onClick={() => setDraft(null)}>
                <X className="size-3.5" /> Discard
              </Button>
            </div>
          </div>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{draft}</p>
        </div>
      ) : (
        <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-bottle hover:bg-bottle/10" disabled={busy} onClick={run}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          {busy ? 'Rewriting…' : 'Rewrite with Hugging Face'}
        </Button>
      )}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}