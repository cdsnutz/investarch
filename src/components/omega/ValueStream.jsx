import { Zap } from 'lucide-react';

const STATUS_STYLE = {
  observed: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  actionable: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  struck: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
};
const heat = (c) => (c >= 8 ? 'bg-rose-500' : c >= 6 ? 'bg-amber-500' : 'bg-sky-500');

export default function ValueStream({ signals }) {
  if (!signals.length) {
    return <p className="text-sm text-muted-foreground">No live signals on the stream. Run the Omni-Sense Pod.</p>;
  }
  return (
    <div className="space-y-3">
      {signals.map((s) => (
        <div key={s.id} className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`size-2.5 rounded-full shrink-0 ${heat(s.confidence)}`} title={`Confidence ${s.confidence}/10`} />
            <h3 className="font-semibold tracking-tight">{s.signal_name}</h3>
            <span className={`text-[10px] uppercase tracking-wide rounded-md border px-2 py-0.5 ${STATUS_STYLE[s.status] || STATUS_STYLE.observed}`}>{s.status}</span>
            {s.domain && <span className="text-[10px] uppercase tracking-wide rounded-md bg-muted px-2 py-0.5 text-muted-foreground">{s.domain}</span>}
            <span className="ml-auto flex items-baseline gap-1 text-xs text-muted-foreground">
              <Zap className="size-3" /> window <span className="font-semibold text-foreground tabular-nums">{s.action_window_days}</span>d · conf <span className="font-semibold text-foreground tabular-nums">{s.confidence}</span>/10
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{s.observation}</p>
          {s.pre_emptive_gap && (
            <p className="text-xs mt-2 border-l-2 border-rose-500/50 pl-3 text-foreground/80"><span className="font-semibold">Pre-emptive gap:</span> {s.pre_emptive_gap}</p>
          )}
          {s.recommended_strike && (
            <p className="text-xs mt-2 rounded-lg bg-muted p-3"><span className="font-semibold">Strike:</span> {s.recommended_strike}</p>
          )}
          {(s.signal_sources || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 text-[10px] text-muted-foreground">
              {s.signal_sources.map((src, i) => <span key={i} className="rounded-md bg-muted px-2 py-0.5">{src}</span>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}