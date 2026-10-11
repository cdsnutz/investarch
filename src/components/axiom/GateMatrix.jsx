const VERDICT_TONE = { pass: 'bg-emerald-500', flag: 'bg-amber-500', blocked: 'bg-red-500', not_measurable: 'bg-slate-400' };
const THRESHOLD_LABEL = { gte: '\u2265', lte: '\u2264', between: 'between' };

const thresholdText = (g) => {
  if (g.comparator === 'between') {
    const upper = typeof g.threshold_upper === 'number' ? g.threshold_upper : g.threshold + 20;
    return `${g.threshold}\u2013${upper}`;
  }
  return `${THRESHOLD_LABEL[g.comparator] || g.comparator} ${g.threshold}`;
};

export default function GateMatrix({ gates, verdicts }) {
  if (!gates.length) {
    return <p className="text-sm text-muted-foreground">No logic gates on the rule book yet. Run Gate Rules to derive them from the axiom, then Gate Enforcement to evaluate value flow.</p>;
  }
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {gates.map((g) => (
          <div key={g.id} className="rounded-xl border bg-card p-5 space-y-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-[10px] uppercase tracking-[0.18em] rounded-md bg-muted px-2 py-0.5 text-muted-foreground">{g.scope}</span>
              <h3 className="text-base font-semibold tracking-tight">{g.gate_name}</h3>
              <span className="text-[10px] uppercase tracking-wide rounded-md bg-muted px-2 py-0.5 text-muted-foreground">{g.action}</span>
              {g.status !== 'active' && <span className="text-[10px] uppercase tracking-wide rounded-md bg-muted px-2 py-0.5 text-muted-foreground">{g.status}</span>}
              {g.last_verdict && (
                <span className={`text-[10px] uppercase tracking-wide rounded-md px-2 py-0.5 text-white ${VERDICT_TONE[g.last_verdict] || 'bg-slate-400'}`}>{g.last_verdict}</span>
              )}
            </div>
            <p className="text-sm text-foreground leading-relaxed">{g.rule_text}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono text-foreground">{g.metric_key}</span>
              <span>threshold {thresholdText(g)}</span>
              {g.last_checked_date && <span>last checked {g.last_checked_date}</span>}
              {(g.enforcement_count || 0) > 0 && <span className="text-amber-600">{g.enforcement_count} enforcement{g.enforcement_count === 1 ? '' : 's'}</span>}
            </div>
          </div>
        ))}
      </div>

      {verdicts.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Enforcement Feed</h4>
          <div className="space-y-2">
            {verdicts.map((v) => (
              <div key={v.id} className="flex flex-wrap items-baseline gap-2 border-b border-border/60 pb-2 last:border-0 text-sm">
                <span className={`inline-block size-2 rounded-full mt-1.5 ${VERDICT_TONE[v.verdict] || 'bg-slate-400'}`} />
                <span className="font-medium">{v.gate_name}</span>
                <span className="text-xs tabular-nums text-muted-foreground">measured {v.metric_value}</span>
                <span className="text-xs text-muted-foreground flex-1 min-w-48">{v.enforcement_note}</span>
                <span className="text-[10px] text-muted-foreground">{v.verdict_date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}