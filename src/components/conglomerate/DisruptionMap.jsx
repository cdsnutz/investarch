import { Swords } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DisruptionMap({ plans, seedsById }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Swords className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Disruption Map</h2>
      </div>
      {plans.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
          No targets mapped yet. Press "Run War-Room" to blueprint the first attacks.
        </div>
      ) : (
        plans.map((p) => (
          <div key={p.id} className="rounded-xl border bg-white p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-slate-50">{seedsById[p.seed_id] || 'IP-seed'}</Badge>
              <div className="text-sm font-semibold text-slate-900">{p.target_competitor}</div>
              {p.domain && <span className="text-xs text-muted-foreground">{p.domain}</span>}
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50/60 p-3">
              <div className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1">Kill-Feature</div>
              <div className="text-sm font-semibold text-slate-900">{p.kill_feature}</div>
              {p.kill_feature_spec && <p className="text-xs leading-relaxed text-slate-600 mt-1">{p.kill_feature_spec}</p>}
            </div>
            <div className="text-xs leading-relaxed text-slate-600 space-y-1">
              {p.churn_analysis && <p><span className="font-semibold text-slate-800">Churn:</span> {p.churn_analysis}</p>}
              {p.customer_complaints && <p><span className="font-semibold text-slate-800">Complaints:</span> {p.customer_complaints}</p>}
              {p.technical_debt && <p><span className="font-semibold text-slate-800">Technical debt:</span> {p.technical_debt}</p>}
              {p.obsolescence_path && <p><span className="font-semibold text-slate-800">90-day path:</span> {p.obsolescence_path}</p>}
            </div>
          </div>
        ))
      )}
    </section>
  );
}