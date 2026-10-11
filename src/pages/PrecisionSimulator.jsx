import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { FlaskConical, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import GatePanel from "@/components/simulator/GatePanel";
import MarketIntelTab from "@/components/simulator/MarketIntelTab";
import StrategyTab from "@/components/simulator/StrategyTab";

const fmtUsd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

export default function PrecisionSimulator() {
  const { user } = useAuth();
  const [access, setAccess] = useState('loading'); // loading | granted | gated
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    const [signals, vectors, grip, sims, treasury, decisions, plans, orders] = await Promise.all([
      base44.entities.LiveSignal.filter({}, { sort: '-observed_date', limit: 20 }),
      base44.entities.MarketVector.filter({}, { sort: '-conviction_score', limit: 20 }),
      base44.entities.HegemonySnapshot.filter({}, { sort: '-created_date', limit: 1 }),
      base44.entities.SimulationRun.filter({}, { sort: '-simulated_date', limit: 10 }),
      base44.entities.TreasurySnapshot.filter({}, { sort: '-created_date', limit: 1 }),
      base44.entities.ReinvestmentDecision.filter({}, { sort: '-created_date', limit: 10 }),
      base44.entities.DisruptionPlan.filter({}, { sort: '-created_date', limit: 10 }),
      base44.entities.ExecutionOrder.filter({}, { sort: '-created_date', limit: 5 })
    ]);
    setData({
      signals: signals.items || [],
      vectors: vectors.items || [],
      grip: (grip.items || [])[0] || null,
      sims: sims.items || [],
      treasury: (treasury.items || [])[0] || null,
      decisions: decisions.items || [],
      plans: plans.items || [],
      orders: orders.items || []
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (user?.role === 'admin') {
          if (!cancelled) setAccess('granted');
          await load();
          return;
        }
        const page = await base44.entities.SimulatorAccess.filter({ status: 'active' }, { limit: 1 });
        if (cancelled) return;
        if ((page.items || []).length) {
          setAccess('granted');
          await load();
        } else {
          setAccess('gated');
        }
      } catch (_) {
        if (!cancelled) setAccess('gated');
      }
    })();
    return () => { cancelled = true; };
  }, [user, load]);

  if (access === 'loading') {
    return (
      <div className="p-10 flex items-center justify-center">
        <Loader2 className="size-6 text-slate-400 animate-spin" />
      </div>
    );
  }
  if (access === 'gated') return <GatePanel />;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-slate-950 flex items-center justify-center">
          <FlaskConical className="size-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Precision Business Simulator</h1>
          <p className="text-sm text-slate-500">Live market intelligence and portfolio strategy engines</p>
        </div>
      </div>

      <Tabs defaultValue="market">
        <TabsList>
          <TabsTrigger value="market">Market Intelligence</TabsTrigger>
          <TabsTrigger value="strategy">Strategy &amp; Capital</TabsTrigger>
        </TabsList>
        <TabsContent value="market" className="mt-4">
          <MarketIntelTab data={data} onLoad={load} fmtUsd={fmtUsd} />
        </TabsContent>
        <TabsContent value="strategy" className="mt-4">
          <StrategyTab data={data} onLoad={load} fmtUsd={fmtUsd} />
        </TabsContent>
      </Tabs>
    </div>
  );
}