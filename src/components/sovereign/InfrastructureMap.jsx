import { Landmark } from 'lucide-react';

const CATEGORY_LABEL = {
  api: 'API', protocol: 'Protocol', platform: 'Platform', data_layer: 'Data Layer', payment_gateway: 'Payment Gateway', middleware: 'Middleware'
};
const STATUS_STYLE = {
  live: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  beta: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  blueprint: 'bg-slate-500/15 text-slate-400 border-slate-500/30'
};

export default function InfrastructureMap({ layers }) {
  if (!layers.length) {
    return <p className="text-sm text-muted-foreground">No foundational layers forged yet. The road is unbuilt.</p>;
  }
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-');
  return (
    <div className="space-y-3">
      {layers.map((l) => (
        <div key={l.id} className="rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Landmark className="size-4 text-slate-500" />
            <h3 className="font-semibold tracking-tight">{l.layer_name}</h3>
            <span className="text-[10px] uppercase tracking-wide rounded-md border px-2 py-0.5 text-muted-foreground">{CATEGORY_LABEL[l.category] || l.category}</span>
            <span className={`text-[10px] uppercase tracking-wide rounded-md border px-2 py-0.5 ${STATUS_STYLE[l.status] || STATUS_STYLE.blueprint}`}>{l.status}</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{l.toll_thesis}</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-3 text-xs">
            <div className="rounded-lg bg-muted p-3">
              <div className="font-semibold uppercase tracking-wide text-muted-foreground mb-1">Toll Rate</div>
              <div>{l.toll_rate || '-'}</div>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <div className="font-semibold uppercase tracking-wide text-muted-foreground mb-1">Pricing Model</div>
              <div>{l.pricing_model || '-'}</div>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <div className="font-semibold uppercase tracking-wide text-muted-foreground mb-1">Projected Toll /mo</div>
              <div>${fmt(l.projected_monthly_toll)} (modeled)</div>
            </div>
          </div>
          {l.api_surface && (
            <div className="mt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">API Surface</div>
              <p className="text-xs font-mono whitespace-pre-wrap bg-muted rounded-lg p-3">{l.api_surface}</p>
            </div>
          )}
          {(l.dependents || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {l.dependents.map((d, i) => (
                <span key={i} className="text-[11px] rounded-md bg-background border px-2 py-0.5" title={d.dependency_note}>{d.name}</span>
              ))}
            </div>
          )}
          {(l.stack || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 text-[10px] text-muted-foreground font-mono">
              {l.stack.map((s, i) => <span key={i}>{s}</span>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}