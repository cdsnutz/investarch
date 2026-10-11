export default function OmegaCodeView({ constants }) {
  if (!constants.length) {
    return <p className="text-sm text-muted-foreground">No logic constants defined yet. Run the Omega-Code to derive the founding constant from the evolution log.</p>;
  }
  return (
    <div className="space-y-3">
      {constants.map((c) => (
        <div key={c.id} className="rounded-xl border bg-slate-950 text-slate-200 border-slate-800 p-5 space-y-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[10px] uppercase tracking-[0.18em] rounded-md bg-slate-800 text-emerald-300 px-2 py-0.5">{c.version}</span>
            <h3 className="text-base font-semibold tracking-tight text-white">{c.constant_name}</h3>
            {c.supersedes && c.supersedes !== 'none' && <span className="text-xs text-slate-400">supersedes {c.supersedes}</span>}
          </div>
          <p className="text-sm font-mono text-emerald-300 leading-relaxed bg-slate-900/60 rounded-lg p-3 border border-slate-800">{c.axiom_text}</p>
          {c.solves_for && <p className="text-sm text-slate-300"><span className="text-xs uppercase tracking-wide text-slate-500">Solves for: </span>{c.solves_for}</p>}
          {c.efficiency_note && <p className="text-xs text-slate-400 leading-relaxed">Efficiency: {c.efficiency_note}</p>}
          {c.self_correction_note && <p className="text-xs text-slate-400 leading-relaxed">Self-correction: {c.self_correction_note}</p>}
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Defined {c.defined_date}</p>
        </div>
      ))}
    </div>
  );
}