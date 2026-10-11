import React from "react";
import { Activity, Target, Grip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import RunButton from "@/components/simulator/RunButton";

const STATUS_LABEL = { observed: 'Observed', actionable: 'Actionable', struck: 'Struck', predicted: 'Predicted', staked: 'Staked', foundation_building: 'Foundation building', operational: 'Operational' };

export default function MarketIntelTab({ data, onLoad, fmtUsd }) {
  const { signals = [], vectors = [], grip } = data || {};

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Activity className="size-4 text-emerald-600" /> Signal Radar</h2>
          <RunButton label="Run Signal Radar" fn="runOmniSense" onLoad={onLoad} />
        </div>
        {signals.length === 0 ? (
          <p className="text-sm text-slate-500">No live signals yet. Run the radar to scan open markets.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {signals.map((s) => (
              <div key={s.id} className="rounded-lg border border-border bg-white p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-900">{s.signal_name}</span>
                  <Badge variant="secondary">{s.domain || 'Market'}</Badge>
                  <Badge variant="outline">Confidence {s.confidence}/10</Badge>
                  {s.status === 'actionable' && <Badge className="bg-emerald-600 text-white">Actionable</Badge>}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{s.observation}</p>
                <p className="text-xs text-slate-500"><span className="font-medium text-slate-700">Gap:</span> {s.pre_emptive_gap}</p>
                <p className="text-xs text-slate-500"><span className="font-medium text-slate-700">Strike:</span> {s.recommended_strike}</p>
                <div className="text-[10px] text-slate-400">Window ~{s.action_window_days} days · {s.signal_sources?.length || 0} corroborating sources</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Target className="size-4 text-emerald-600" /> Market Vectors</h2>
          <RunButton label="Run Market Forecast" fn="runOracle" onLoad={onLoad} />
        </div>
        {vectors.length === 0 ? (
          <p className="text-sm text-slate-500">No vectors staked yet. Run the forecast engine.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {vectors.map((v) => (
              <div key={v.id} className="rounded-lg border border-border bg-white p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-900">{v.vector_name}</span>
                  <Badge variant="secondary">{STATUS_LABEL[v.status] || v.status}</Badge>
                </div>
                <div className="flex gap-3 text-[11px] text-slate-500">
                  <span>{v.sector}</span>
                  <span>Horizon {v.horizon_months} mo</span>
                  <span>Arrival {v.arrival_probability}%</span>
                  <span>Conviction {v.conviction_score}/10</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{v.gold_rush_thesis}</p>
                {(v.leading_indicators || []).length > 0 && (
                  <ul className="text-[11px] text-slate-500 list-disc pl-4 space-y-0.5">
                    {v.leading_indicators.slice(0, 3).map((li, i) => <li key={i}>{li}</li>)}
                  </ul>
                )}
                <div className="text-[10px] text-slate-400">{(v.staked_assets || []).length} assets staked for this vector</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Grip className="size-4 text-emerald-600" /> Market Grip</h2>
          <RunButton label="Run Consolidation" fn="runHegemony" onLoad={onLoad} />
        </div>
        {grip ? (
          <div className="rounded-lg border border-border bg-white p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold text-slate-900">{grip.market_grip_pct}%</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${grip.market_grip_pct}%` }} />
              </div>
              <span className="text-[11px] text-slate-400">{grip.snapshot_date}</span>
            </div>
            <div className="flex gap-4 text-xs text-slate-600">
              <span>{grip.built_assets} built</span>
              <span>{grip.protected_assets} protected</span>
              <span>{grip.vectors_staked} vectors staked</span>
              <span>{fmtUsd(grip.portfolio_value)} appraised</span>
            </div>
            {grip.verdict && <p className="text-xs text-slate-600 leading-relaxed">{grip.verdict}</p>}
            {(grip.grip_levers || []).length > 0 && (
              <div className="space-y-2">
                {grip.grip_levers.map((l, i) => (
                  <div key={i} className="rounded-md bg-slate-50 p-3 text-xs space-y-1">
                    <div className="font-medium text-slate-900">{l.lever}</div>
                    <div className="text-slate-600">Current: {l.current} → Target: {l.target}</div>
                    <div className="text-slate-500">Action: {l.action}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No grip snapshot yet. Run consolidation.</p>
        )}
      </section>
    </div>
  );
}