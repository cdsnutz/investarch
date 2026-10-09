export default function PlanList({ points }) {
  if (!points?.length) {
    return <p className="text-sm text-muted-foreground">No plan points stored yet.</p>;
  }
  return (
    <ol className="space-y-4">
      {points.map((pt) => (
        <li key={pt.index} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-baseline gap-2.5 min-w-0">
              <span className="text-xs font-mono text-muted-foreground shrink-0">{String(pt.index).padStart(2, '0')}</span>
              <h4 className="font-medium tracking-tight truncate">{pt.title}</h4>
            </div>
            <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${pt.score >= 8 ? 'bg-emerald-100 text-emerald-700' : pt.score >= 6 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
              {pt.score}/10
            </span>
          </div>
          <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{pt.content}</div>
          {pt.revision_note && <p className="mt-2 text-xs text-muted-foreground">Revised: {pt.revision_note}</p>}
        </li>
      ))}
    </ol>
  );
}