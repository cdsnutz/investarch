import { Dna } from 'lucide-react';

export default function HeuristicsPanel({ heuristics }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Dna className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Metamorphosis — Learned Heuristics
        </h2>
      </div>
      {heuristics.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
          No learned directives yet. Press "Run Metamorphosis" to let the system learn from its own portfolio.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {heuristics.map((h) => (
            <div key={h.id} className="rounded-xl border bg-white p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">W{h.weight}</span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{h.category}</span>
              </div>
              <p className="text-sm font-medium text-slate-900 leading-snug">{h.insight}</p>
              <p className="text-xs leading-relaxed text-slate-600">{h.directive}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}