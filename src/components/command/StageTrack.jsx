import { Check, Loader2, X, RotateCcw } from 'lucide-react';
import { STAGES } from '@/hooks/useDossierBuild';
import { cn } from '@/lib/utils';

export default function StageTrack({ stages, running, onRetry }) {
  return (
    <ol className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border">
      {STAGES.map((s, i) => {
        const { state, error } = stages[s];
        return (
          <li key={s} className={cn('bg-white px-3 py-2.5 text-xs', state === 'failed' && 'bg-destructive/5')}>
            <div className="flex items-center gap-1.5 uppercase tracking-[0.12em] text-[10px] text-muted-foreground">
              {state === 'running' && <Loader2 className="size-3 animate-spin text-bottle" />}
              {state === 'done' && <Check className="size-3 text-bottle" />}
              {state === 'failed' && <X className="size-3 text-destructive" />}
              {i + 1}. {s}
            </div>
            {state === 'failed' && (
              <div className="mt-1.5">
                <p className="text-destructive line-clamp-2">{error}</p>
                <button disabled={running} onClick={() => onRetry(s)} className="mt-1 inline-flex items-center gap-1 underline disabled:opacity-50">
                  <RotateCcw className="size-3" /> Retry
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}