import { TrendingUp, Crosshair, Landmark } from 'lucide-react';

export default function HegemonyPanel({ snapshot, onRun, running }) {
  const grip = snapshot?.market_grip_pct ?? null;
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-');
  return (
    <div className="rounded-xl bg-slate-950 text-slate-200 border border-slate-800 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Crosshair className="size-4 text-emerald-400" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Hegemony Score</h3>
      </div>
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-semibold tabular-nums text-white">{grip ?? '-'}</span>
            <span className="text-xl text-slate-400">%</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-48">Market Grip — the share of the sector that cannot function without our infrastructure</p>
        </div>
        <div className="flex-1 grid sm:grid-cols-4 gap-3">
          {[
            { label: 'Live Layers', value: snapshot?.layers_live ?? '-', icon: Landmark },
            { label: 'Vectors Staked', value: snapshot?.vectors_staked ?? '-', icon: Crosshair },
            { label: 'Mapped Dependents', value: snapshot?.dependent_count ?? '-', icon: TrendingUp },
            { label: 'Toll Run-Rate /mo', value: `$${fmt(snapshot?.toll_run_rate)}`, icon: Landmark }
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-slate-900 border border-slate-800 p-3">
              <s.icon className="size-3.5 text-slate-500 mb-1.5" />
              <div className="text-lg font-semibold tabular-nums text-white">{s.value}</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      {snapshot?.verdict && <p className="text-sm text-slate-300 mt-4 border-t border-slate-800 pt-4">{snapshot.verdict}</p>}
      {snapshot?.snapshot_date && <p className="text-[10px] uppercase tracking-wide text-slate-600 mt-2">Last measured {snapshot.snapshot_date}</p>}
      <div className="mt-4">
        <button onClick={onRun} disabled={running} className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50">
          {running ? 'Measuring grip…' : 'Measure Hegemony'}
        </button>
      </div>
      {(snapshot?.grip_levers || []).length > 0 && (
        <div className="grid md:grid-cols-2 gap-3 mt-5">
          {snapshot.grip_levers.map((l, i) => (
            <div key={i} className="rounded-lg bg-slate-900 border border-slate-800 p-4">
              <div className="text-xs font-semibold text-emerald-400 mb-1">{l.lever}</div>
              <div className="text-xs text-slate-400">{l.current} → {l.target}</div>
              <p className="text-xs text-slate-300 mt-1.5">{l.action}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}