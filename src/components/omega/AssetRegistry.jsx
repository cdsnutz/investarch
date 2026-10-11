import { Cpu } from 'lucide-react';

const REALM_LABEL = { hardware: 'Hardware', biotech: 'Biotech', energy: 'Energy', infrastructure: 'Infrastructure', robotics: 'Robotics' };
const REALM_STYLE = {
  hardware: 'bg-sky-500/15 text-sky-600 border-sky-500/30',
  biotech: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  energy: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  infrastructure: 'bg-violet-500/15 text-violet-600 border-violet-500/30',
  robotics: 'bg-rose-500/15 text-rose-600 border-rose-500/30'
};
const STATUS_STYLE = { blueprint: 'bg-slate-500/15 text-slate-400 border-slate-500/30', sourcing: 'bg-amber-500/15 text-amber-400 border-amber-500/30', built: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };

export default function AssetRegistry({ assets }) {
  if (!assets.length) {
    return <p className="text-sm text-muted-foreground">No physical designs registered. Fire the Matter-Synthesis Pod.</p>;
  }
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-');
  return (
    <div className="space-y-3">
      {assets.map((a) => (
        <div key={a.id} className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Cpu className="size-4 text-slate-500" />
            <h3 className="font-semibold tracking-tight">{a.asset_name}</h3>
            <span className={`text-[10px] uppercase tracking-wide rounded-md border px-2 py-0.5 ${REALM_STYLE[a.realm] || REALM_STYLE.hardware}`}>{REALM_LABEL[a.realm] || a.realm}</span>
            <span className={`text-[10px] uppercase tracking-wide rounded-md border px-2 py-0.5 ${STATUS_STYLE[a.status] || STATUS_STYLE.blueprint}`}>{a.status}</span>
            <span className="ml-auto text-xs text-muted-foreground">CAPEX est. <span className="font-semibold text-foreground tabular-nums">${fmt(a.capex_estimate)}</span></span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{a.vertical_thesis}</p>
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <div className="rounded-lg bg-muted p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Supply-Chain Plan</div>
              <p className="text-xs leading-relaxed">{a.supply_chain_plan || '-'}</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Digital Integration</div>
              <p className="text-xs leading-relaxed">{a.integration_note || '-'}</p>
            </div>
          </div>
          {(a.ip_claims || []).length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Patentable Claims</div>
              <ul className="space-y-1">{a.ip_claims.map((c, i) => <li key={i} className="flex gap-2 text-xs"><span className="size-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />{c}</li>)}</ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}