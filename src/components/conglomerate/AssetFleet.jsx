import { Rocket, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const statusTint = (s) => (s === 'live' ? 'bg-emerald-100 text-emerald-800' : s === 'deploying' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600');

export default function AssetFleet({ deployments, growthKits, seedsById }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Rocket className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Asset Fleet</h2>
      </div>
      {deployments.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
          Nothing staged yet. Press "Deploy Kit" to cut zero-touch deployment kits for built assets.
        </div>
      ) : (
        deployments.map((d) => {
          const kit = growthKits.find((k) => k.seed_id === d.seed_id);
          return (
            <div key={d.id} className="rounded-xl border bg-white p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${statusTint(d.status)}`}>{d.status.replace('_', ' ')}</span>
                <div className="text-sm font-semibold text-slate-900">{seedsById[d.seed_id] || 'Asset'}</div>
                {d.platform && <Badge variant="outline" className="bg-slate-50">{d.platform}</Badge>}
                {d.live_url && (
                  <a href={d.live_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline">
                    <ExternalLink className="size-3" /> {d.live_url}
                  </a>
                )}
              </div>
              {d.launch_note && <p className="text-xs leading-relaxed text-slate-600">{d.launch_note}</p>}
              <div className="flex flex-wrap gap-1.5">
                {(d.kit_configs || []).map((c, i) => (
                  <span key={i} className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600">{c.path}</span>
                ))}
              </div>
              {(d.dns_checklist || []).length > 0 && (
                <div className="text-xs leading-relaxed text-slate-600">
                  <span className="font-semibold text-slate-800">DNS / SSL:</span> {d.dns_checklist.join(' → ')}
                </div>
              )}
              {kit && (
                <div className="rounded-lg border bg-slate-50/60 p-3 text-xs space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-800">Traffic kit staged</span>
                    <span className="text-muted-foreground">~{new Intl.NumberFormat('en-US').format(kit.traffic_forecast || 0)} visits/mo forecast</span>
                  </div>
                  <p className="text-slate-600">SEO: {kit.seo_title}</p>
                  <p className="text-slate-600">{kit.compliance_note}</p>
                </div>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}