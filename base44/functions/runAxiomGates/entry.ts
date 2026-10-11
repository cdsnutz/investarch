import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { today, norm } from '../../shared/v9Core.ts';

// Deterministic metric computations — each returns a number, or null when not yet measurable.
async function computeMetric(base44, key) {
  switch (key) {
    // Blueprint-stage truth: toll configuration is checkable against every defined layer,
    // and with zero live layers no live layer can have stalled revenue (vacuously 0).
    case 'toll_config_coverage': {
      const page = await base44.asServiceRole.entities.InfrastructureLayer.filter({}, { limit: 200, fields: ['toll_rate'] });
      const layers = page.items || [];
      if (!layers.length) return null;
      const withRate = layers.filter((l) => String(l.toll_rate || '').trim() !== '');
      return (withRate.length / layers.length) * 100;
    }
    case 'value_flow_stall': {
      const page = await base44.asServiceRole.entities.InfrastructureLayer.filter({}, { limit: 200, fields: ['monthly_toll_revenue', 'status'] });
      const layers = page.items || [];
      if (!layers.length) return null;
      const live = layers.filter((l) => l.status === 'live');
      return live.filter((l) => !(Number(l.monthly_toll_revenue) > 0)).length;
    }
    case 'axiom_index_coverage': {
      const [axPage, hybPage, assetPage, layerPage] = await Promise.all([
        base44.asServiceRole.entities.ValueAxiom.filter({}, { sort: '-revaluation_date', limit: 1, fields: ['indexed_assets'] }),
        base44.asServiceRole.entities.HybridAsset.filter({}, { sort: '-monopoly_score', limit: 8, fields: ['asset_name'] }),
        base44.asServiceRole.entities.PhysicalAsset.filter({}, { sort: '-registered_date', limit: 8, fields: ['asset_name'] }),
        base44.asServiceRole.entities.InfrastructureLayer.filter({}, { sort: '-projected_monthly_toll', limit: 8, fields: ['layer_name'] })
      ]);
      const indexed = new Set(((axPage.items?.[0]?.indexed_assets) || []).map((a) => norm(a.asset_name)));
      const ledger = [
        ...((hybPage.items || []).map((h) => h.asset_name)),
        ...((assetPage.items || []).map((a) => a.asset_name)),
        ...((layerPage.items || []).map((l) => l.layer_name))
      ].filter(Boolean);
      const top = ledger.slice(0, 8);
      if (!top.length) return null;
      const covered = top.filter((n) => indexed.has(norm(n))).length;
      return (covered / top.length) * 100;
    }
    case 'sim_probability_sum': {
      const page = await base44.asServiceRole.entities.SimulationRun.filter({}, { sort: '-simulated_date', limit: 1, fields: ['scenarios'] });
      const scenarios = page.items?.[0]?.scenarios;
      if (!Array.isArray(scenarios) || !scenarios.length) return null;
      return scenarios.reduce((t, s) => t + (Number(s.probability) || 0), 0);
    }
    case 'anchor_progress_max': {
      const page = await base44.asServiceRole.entities.ValueAnchor.filter({}, { limit: 200, fields: ['current_progress_pct'] });
      const vals = (page.items || []).map((a) => Number(a.current_progress_pct) || 0);
      return vals.length ? Math.max(...vals) : null;
    }
    case 'imprint_disclosure_coverage': {
      const page = await base44.asServiceRole.entities.ArchetypeImprint.filter({}, { limit: 200, fields: ['disclosure'] });
      const items = page.items || [];
      if (!items.length) return null;
      const disclosed = items.filter((i) => String(i.disclosure || '').trim() !== '');
      return (disclosed.length / items.length) * 100;
    }
    case 'claim_legal_coverage': {
      const page = await base44.asServiceRole.entities.CelestialClaim.filter({}, { limit: 200, fields: ['legal_framework'] });
      const items = page.items || [];
      if (!items.length) return null;
      const grounded = items.filter((c) => String(c.legal_framework || '').trim() !== '');
      return (grounded.length / items.length) * 100;
    }
    case 'signal_confidence_min': {
      const page = await base44.asServiceRole.entities.LiveSignal.filter({}, { sort: '-observed_date', limit: 20, fields: ['confidence'] });
      const vals = (page.items || []).map((s) => Number(s.confidence) || 0);
      return vals.length ? Math.min(...vals) : null;
    }
    case 'ledger_duplication': {
      const page = await base44.asServiceRole.entities.LiveSignal.filter({}, { limit: 300, fields: ['signal_name'] });
      const counts = {};
      (page.items || []).forEach((s) => {
        const n = norm(s.signal_name);
        if (n) counts[n] = (counts[n] || 0) + 1;
      });
      return Object.values(counts).filter((c) => c > 1).length;
    }
    default:
      return null;
  }
}

const COMPARATOR_LABEL = { gte: '>=', lte: '<=', between: 'between' };

function evaluate(gate, value) {
  if (value === null || typeof value !== 'number') {
    return { verdict: 'not_measurable', note: 'Metric not measurable yet — no data to enforce against.' };
  }
  let passed;
  if (gate.comparator === 'gte') passed = value >= gate.threshold;
  else if (gate.comparator === 'lte') passed = value <= gate.threshold;
  else passed = value >= gate.threshold && value <= (typeof gate.threshold_upper === 'number' ? gate.threshold_upper : gate.threshold + 20);
  if (passed) return { verdict: 'pass', note: 'Rule holds; value flow validated.' };
  const measured = `${value.toFixed(2)} vs ${COMPARATOR_LABEL[gate.comparator]} ${gate.threshold}${gate.comparator === 'between' && typeof gate.threshold_upper === 'number' ? `-${gate.threshold_upper}` : ''}`;
  if (gate.action === 'block') return { verdict: 'blocked', note: `HARD RULE BLOCKED: measured ${measured}.` };
  return { verdict: 'flag', note: `Rule violated: measured ${measured}.` };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const gatePage = await db.LogicGate.filter({ status: 'active' }, { sort: 'scope', limit: 100 });
    const gates = gatePage.items || [];
    if (!gates.length) return Response.json({ note: 'No active logic gates defined yet. Run Gate Rules first.' });

    const t = today();
    const verdicts = [];
    const updates = [];
    for (const gate of gates) {
      const value = await computeMetric(base44, gate.metric_key);
      const result = evaluate(gate, value);
      verdicts.push({
        gate_id: gate.id,
        gate_name: gate.gate_name,
        scope: gate.scope,
        metric_value: value === null ? 0 : Number(value.toFixed(2)),
        comparator: gate.comparator,
        threshold: gate.threshold,
        threshold_upper: typeof gate.threshold_upper === 'number' ? gate.threshold_upper : undefined,
        verdict: result.verdict,
        enforcement_note: result.note,
        verdict_date: t
      });
      updates.push({
        id: gate.id,
        last_verdict: result.verdict,
        last_checked_date: t,
        enforcement_count: (Number(gate.enforcement_count) || 0) + (result.verdict === 'pass' ? 0 : 1)
      });
    }

    const created = await db.GateVerdict.bulkCreate(verdicts);
    await db.LogicGate.bulkUpdate(updates);

    const passed = verdicts.filter((v) => v.verdict === 'pass').length;
    const flagged = verdicts.filter((v) => v.verdict === 'flag').length;
    const blocked = verdicts.filter((v) => v.verdict === 'blocked').length;
    const unmeasurable = verdicts.filter((v) => v.verdict === 'not_measurable').length;
    return Response.json({
      gates_evaluated: gates.length,
      passed,
      flagged,
      blocked,
      not_measurable: unmeasurable,
      verdicts_recorded: (created || []).length || verdicts.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}