export default function ScanPanel({ scan }) {
  if (!scan) return null;
  const dims = scan.dimensions || [];
  const checks = scan.checks || [];
  const weakest = [...checks].filter(c => c.score === 0).slice(0, 6);
  const pct = Math.min(100, Math.max(0, Math.round((scan.total / 100) * 100)));
  const tone = pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
        <div className={`text-5xl font-semibold tracking-tight ${tone}`}>{scan.total}<span className="text-2xl text-muted-foreground">/100</span></div>
        <div>
          <div className="text-sm font-medium">100-point value scan</div>
          <div className="text-xs text-muted-foreground mt-0.5">One point per substantiated check. Zero points mark real gaps, never padded.</div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {dims.map((d) => {
          const ratio = d.max ? d.score / d.max : 0;
          return (
            <div key={d.category} className="border border-border rounded-lg p-3">
              <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                <span className="font-medium truncate">{d.category}</span>
                <span className="text-muted-foreground shrink-0">{d.score}/{d.max}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${ratio >= 0.8 ? 'bg-emerald-500' : ratio >= 0.5 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {weakest.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Biggest gaps</h4>
          <ul className="space-y-2">
            {weakest.map((c) => (
              <li key={c.point} className="flex gap-3 text-sm leading-relaxed">
                <span className="text-xs font-mono text-red-500 mt-0.5 shrink-0">{String(c.point).padStart(2, '0')}</span>
                <span><span className="font-medium">{c.category}:</span> {c.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}