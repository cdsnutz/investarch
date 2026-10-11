import { GitBranch } from 'lucide-react';

export default function EvolutionLogView({ logs }) {
  if (!logs.length) {
    return <p className="text-sm text-muted-foreground">No self-upgrades logged yet. Fire the Genesis Engine to run its first audit.</p>;
  }
  return (
    <div className="space-y-3">
      {logs.map((l) => (
        <div key={l.id} className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <GitBranch className="size-4 text-slate-500" />
            <span className="rounded-md bg-slate-950 text-emerald-400 text-xs font-mono px-2 py-0.5">v{l.version}</span>
            <h3 className="font-semibold tracking-tight">{l.capability_name}</h3>
            <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">{l.log_date}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2"><span className="font-semibold">Bottleneck:</span> {l.bottleneck_addressed}</p>
          <p className="text-sm leading-relaxed">{l.upgrade_design}</p>
          {(l.pod_targets || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {l.pod_targets.map((p, i) => <span key={i} className="text-[11px] rounded-md bg-muted px-2 py-0.5">{p}</span>)}
            </div>
          )}
          {l.autonomous_note && (
            <p className="text-xs mt-3 border-l-2 border-emerald-500/50 pl-3 text-foreground/80"><span className="font-semibold">Self-grant:</span> {l.autonomous_note}</p>
          )}
        </div>
      ))}
    </div>
  );
}