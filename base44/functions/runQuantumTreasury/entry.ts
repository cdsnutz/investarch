import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const HEDGE_SCHEMA = {
  type: "object",
  properties: {
    decisions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          decision: { type: "string", enum: ["scale", "patent", "acquire", "hold"] },
          target_title: { type: "string" },
          allocation: { type: "number" },
          rationale: { type: "string" }
        },
        required: ["decision", "target_title", "allocation", "rationale"]
      }
    },
    hedging_note: { type: "string" }
  },
  required: ["decisions", "hedging_note"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    // Sovereign Wealth Fund: balance cash-cows (live tolls) against moonshots (early vectors).
    const [snapshotPage, layerPage, alliancePage] = await Promise.all([
      base44.asServiceRole.entities.TreasurySnapshot.filter({}, { sort: '-snapshot_date', limit: 1 }),
      base44.asServiceRole.entities.InfrastructureLayer.filter({}, { limit: 100 }),
      base44.asServiceRole.entities.Alliance.filter({ alliance_type: 'acquisition_target' }, { limit: 50 })
    ]);
    const snapshot = (snapshotPage.items || [])[0];
    const layers = layerPage.items || [];
    const acquisitions = alliancePage.items || [];
    if (!snapshot && !layers.length) return Response.json({ decisions_created: 0, note: 'No portfolio or infrastructure to hedge yet.' });

    const freeCapital = Math.max(
      (snapshot?.total_valuation || 0) - (acquisitions.reduce((s, a) => s + (a.partner_strength || 0), 0) * 25000),
      0
    );
    const cashCows = layers.filter((l) => l.status === 'live');
    const moonshots = layers.filter((l) => l.status === 'blueprint' || l.status === 'beta');

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Quantum Treasury: the sovereign wealth fund of an economic operating system. Your doctrine is ASYMMETRIC HEDGING — profit from the infrastructure layer funds the total acquisition of emerging competitors. Output 4-6 allocation decisions across exactly these buckets:
- scale: capital into live cash-cow layers (stable toll revenue). 
- patent: capital into IP hardening of the strongest staked vectors/moonshots.
- acquire: named acquisition targets from the alliance web (struggling competitors), with an offer band in the rationale.
- hold: anything the portfolio should deliberately NOT fund this cycle, and why.

Allocation numbers are USD from the deployable capital. Ground every rationale in the data below; if the deployable capital is modeled (not yet collected cash), say so plainly in each rationale and size allocations as limits, not promises. Never fabricate revenue.

PORTFOLIO:
Deployable capital (modeled): ${Math.round(freeCapital).toLocaleString('en-US')} USD
Latest treasury snapshot: ${snapshot ? JSON.stringify({ date: snapshot.snapshot_date, total_valuation: snapshot.total_valuation, built: snapshot.built_count, protected: snapshot.protected_count }) : 'none yet'}

INFRASTRUCTURE (cash-cows vs moonshots):
Cash-cows (live): ${JSON.stringify(cashCows.map((l) => ({ name: l.layer_name, toll_rate: l.toll_rate, projected: l.projected_monthly_toll, actual: l.monthly_toll_revenue, grip: l.grip_pct })))}
Moonshots (blueprint/beta): ${JSON.stringify(moonshots.map((l) => ({ name: l.layer_name, category: l.category, projected: l.projected_monthly_toll, status: l.status })))}

ACQUISITION TARGETS (from the alliance web):
${JSON.stringify(acquisitions.map((a) => ({ partner: a.partner_name, leverage: a.leverage_note, terms: a.terms, strength: a.partner_strength, layer: (layers.find((l) => l.id === a.layer_id) || {}).layer_name })))}`,
      response_json_schema: HEDGE_SCHEMA
    });
    const decisions = (res?.decisions || []).slice(0, 6);
    if (!decisions.length) return Response.json({ error: 'The Quantum Treasury returned no allocation.' }, { status: 500 });

    const today = new Date().toISOString().slice(0, 10);
    const records = decisions.map((d) => ({
      decision: d.decision || 'hold',
      target_title: d.target_title || '',
      allocation: typeof d.allocation === 'number' ? d.allocation : 0,
      rationale: `${d.rationale || ''}${res?.hedging_note ? ` | Treasury doctrine: ${res.hedging_note}` : ''}`,
      decision_date: today
    }));
    const created = await db.ReinvestmentDecision.bulkCreate(records);
    return Response.json({ decisions_created: (created || []).length || records.length, deployable_capital: Math.round(freeCapital) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}