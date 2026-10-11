import React from "react";
import { Sigma, Landmark, BrainCircuit, Swords, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import RunButton from "@/components/simulator/RunButton";

const DECISION_LABEL = { scale: 'Scale', patent: 'Protect', acquire: 'Acquire', hold: 'Hold' };

export default function StrategyTab({ data, onLoad, fmtUsd }) {
  const { sims = [], treasury, decisions = [], plans = [], orders = [] } = data || {};
  const latestSim = sims[0] || null;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Sigma className="size-4 text-emerald-600" /> Probability Engine</h2>
          <RunButton label="Run Stress Test" fn="runQuantumSim" onLoad={onLoad} />
        </div>
        {latestSim ? (
          <div className="rounded-lg border border-border bg-white p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-900">{latestSim.subject_name}</span>
              <Badge variant="outline">{latestSim.scenario_count} branches</Badge>
              <Badge className="bg-slate-950 text-white">Success {latestSim.success_probability}%</Badge>
              <span className="text-[10px] text-slate-400">{latestSim.simulated_date}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed"><span className="font-medium text-slate-700">Optimal path:</span> {latestSim.optimal_path}</p>
            {(latestSim.failure_modes || []).length > 0 && (
              <div className="text-[11px] text-slate-500">
                <span className="font-medium text-slate-700">Failure modes:</span> {latestSim.failure_modes.join(' · ')}
              </div>
            )}
            {sims.length > 1 && (
              <div className="pt-2 border-t border-border/70 text-[11px] text-slate-500">
                Earlier runs: {sims.slice(1).map((s) => `${s.subject_name} (${s.success_probability}%)`).join(' · ')}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No simulations yet. Run the stress test on your top asset.</p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Landmark className="size-4 text-emerald-600" /> Treasury</h2>
          <RunButton label="Run Appraisal" fn="runTreasury" onLoad={onLoad} />
        </div>
        {treasury ? (
          <div className="rounded-lg border border-border bg-white p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold text-slate-900">{fmtUsd(treasury.total_valuation)}</span>
              <span className="text-[10px] text-slate-400">{treasury.snapshot_date}</span>
            </div>
            <div className="flex gap-4 text-xs text-slate-600">
              <span>{treasury.asset_count} assets</span>
              <span>{treasury.built_count} built</span>
              <span>{treasury.protected_count} protected</span>
              <span>{treasury.validated_count} validated</span>
            </div>
            {(treasury.leverage_matrix || []).length > 0 && (
              <div className="space-y-2">
                {treasury.leverage_matrix.map((l, i) => (
                  <div key={i} className="rounded-md bg-slate-50 p-3 text-xs space-y-1">
                    <div className="font-medium text-slate-900">{l.name} · LTV {l.ltv} · {fmtUsd(l.loan_amount)}</div>
                    <div className="text-slate-600">Collateral: {l.collateral}</div>
                    <div className="text-slate-500">{l.rationale}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No treasury snapshot yet. Run the appraisal.</p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><BrainCircuit className="size-4 text-emerald-600" /> Capital Allocator</h2>
          <RunButton label="Run Allocator" fn="runNeuralCFO" onLoad={onLoad} />
        </div>
        {decisions.length === 0 ? (
          <p className="text-sm text-slate-500">No reinvestment decisions yet. Run the allocator.</p>
        ) : (
          <div className="space-y-2">
            {decisions.map((d) => (
              <div key={d.id} className="rounded-lg border border-border bg-white p-3 flex items-start gap-3">
                <Badge variant={d.decision === 'hold' ? 'secondary' : 'default'}>{DECISION_LABEL[d.decision] || d.decision}</Badge>
                <div className="text-xs space-y-0.5">
                  <div className="font-medium text-slate-900">{d.target_title || 'Portfolio'}{d.allocation ? ` · ${fmtUsd(d.allocation)}` : ''}</div>
                  <div className="text-slate-600 leading-relaxed">{d.rationale}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Swords className="size-4 text-emerald-600" /> War Room</h2>
          <RunButton label="Run War Room" fn="runWarRoom" onLoad={onLoad} />
        </div>
        {plans.length === 0 ? (
          <p className="text-sm text-slate-500">No disruption blueprints yet. Run the war room.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {plans.map((p) => (
              <div key={p.id} className="rounded-lg border border-border bg-white p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-900">{p.target_competitor}</span>
                  {p.domain && <Badge variant="secondary">{p.domain}</Badge>}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed"><span className="font-medium text-slate-700">Kill feature:</span> {p.kill_feature}</p>
                {p.obsolescence_path && <p className="text-[11px] text-slate-500 leading-relaxed">{p.obsolescence_path}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><ClipboardList className="size-4 text-emerald-600" /> Execution Orders</h2>
          <RunButton label="Issue Orders" fn="runExecutionOrder" onLoad={onLoad} />
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">No execution orders yet. Issue the first one.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-lg border border-border bg-white p-4 space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="text-sm font-semibold text-slate-900">{o.order_date}</span>
                  {o.total_portfolio_value ? <span>{fmtUsd(o.total_portfolio_value)} portfolio</span> : null}
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  {['build', 'protect', 'liquidate', 'leverage'].map((key) => (
                    <div key={key} className="rounded-md bg-slate-50 p-3">
                      <div className="font-medium text-slate-900 capitalize mb-1">{key} ({(o[key] || []).length})</div>
                      <div className="space-y-1 text-slate-600">
                        {(o[key] || []).map((item, i) => (
                          <div key={i}><span className="font-medium text-slate-700">{item.title}</span>{item.rationale ? ` — ${item.rationale}` : ''}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}