import { Radar } from 'lucide-react';

const scoreTint = (d) => (d >= 8 ? 'bg-emerald-100 text-emerald-800' : d >= 6 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600');

export default function ValidationFeed({ validations, seedsById }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Radar className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Validation Feed</h2>
      </div>
      {validations.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
          No ghost validations yet. Press "Run Ghost Validation" to prove demand on the top seeds.
        </div>
      ) : (
        validations.map((v) => (
          <div key={v.id} className="rounded-xl border bg-white p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${scoreTint(v.demand_score)}`}>
                Demand {v.demand_score}/10
              </span>
              <div className="text-sm font-semibold text-slate-900">{seedsById[v.seed_id] || 'IP-seed'}</div>
              {v.projected_waitlist > 0 && (
                <span className="text-xs text-muted-foreground">~{new Intl.NumberFormat('en-US').format(v.projected_waitlist)} waitlist / 30d</span>
              )}
            </div>
            {v.hook && <p className="text-sm italic text-slate-700">"{v.hook}"</p>}
            <div>
              <div className="text-sm font-semibold text-slate-900">{v.landing_headline}</div>
              <p className="text-xs leading-relaxed text-slate-600 mt-1">{v.landing_copy}</p>
            </div>
            {(v.variants || []).length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {v.variants.map((variant, i) => (
                  <div key={i} className="rounded-lg border bg-slate-50/60 p-3">
                    <div className="text-xs font-bold text-slate-800">Variant {variant.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{variant.angle}</div>
                    <p className="text-xs leading-relaxed text-slate-600 mt-1">{variant.copy}</p>
                  </div>
                ))}
              </div>
            )}
            {v.verdict && <p className="text-xs leading-relaxed text-slate-700"><span className="font-semibold">Verdict:</span> {v.verdict}</p>}
          </div>
        ))
      )}
    </section>
  );
}