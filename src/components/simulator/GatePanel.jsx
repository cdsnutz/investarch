import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { FlaskConical, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const MODULES = [
  ['Signal Radar', 'Live market signals with pre-emptive gaps'],
  ['Market Vectors', 'Where the next demand surge lands, 6-18 months out'],
  ['Probability Engine', '16-branch stress test of your top asset'],
  ['Treasury', 'Portfolio appraisal and the leverage matrix'],
  ['Capital Allocator', 'Reinvestment decisions across the portfolio'],
  ['Consolidation', 'Market-grip score with concrete levers'],
  ['War Room', 'Disruption blueprints against incumbents'],
  ['Execution Orders', 'Build / Protect / Liquidate / Leverage']
];

export default function GatePanel() {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const subscribe = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke('create-checkout', { productId: 'simulator_pro', quantity: 1 });
      window.location.href = res.data.redirectUrl;
    } catch (e) {
      toast({ title: 'Checkout failed', description: e?.message || 'Please try again.', variant: 'destructive' });
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 rounded-lg bg-slate-950 flex items-center justify-center">
          <FlaskConical className="size-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Precision Business Simulator</h1>
          <p className="text-sm text-slate-500">Eight engines. One consolidated view of your portfolio.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {MODULES.map(([name, desc]) => (
          <div key={name} className="flex items-start gap-3 rounded-lg border border-border bg-white p-4">
            <Lock className="size-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-medium text-slate-900">{name}</div>
              <div className="text-xs text-slate-500">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-slate-900">$49</span>
              <span className="text-sm text-slate-500">/ month</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Full access to all eight engines. Cancel anytime.</p>
          </div>
          <Button onClick={subscribe} disabled={busy} className="bg-slate-950 text-white hover:bg-slate-800">
            {busy && <Loader2 className="size-4 animate-spin" />}
            {busy ? 'Opening checkout…' : 'Subscribe with Simulator Pro'}
          </Button>
        </div>
      </div>
    </div>
  );
}