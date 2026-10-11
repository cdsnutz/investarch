import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const HEGEMONY_SCHEMA = {
  type: "object",
  properties: {
    market_grip_pct: { type: "number" },
    verdict: { type: "string" },
    grip_levers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          lever: { type: "string" },
          current: { type: "string" },
          target: { type: "string" },
          action: { type: "string" }
        },
        required: ["lever", "current", "target", "action"]
      }
    }
  },
  required: ["market_grip_pct", "verdict", "grip_levers"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const [layerPage, alliancePage, vectorPage] = await Promise.all([
      base44.asServiceRole.entities.InfrastructureLayer.filter({}, { limit: 100 }),
      base44.asServiceRole.entities.Alliance.filter({}, { limit: 300 }),
      base44.asServiceRole.entities.MarketVector.filter({}, { limit: 100, fields: ['status'] })
    ]);
    const layers = layerPage.items || [];
    const alliances = alliancePage.items || [];
    const vectors = vectorPage.items || [];
    if (!layers.length) return Response.json({ snapshot_created: false, note: 'No foundational layers forged yet — grip cannot be measured.' });

    // Deterministic floor: live-layer grip plus locked dependencies, capped at 95.
    const dependentCount = layers.reduce((s, l) => s + ((l.dependents || []).length), 0);
    const locked = alliances.filter((a) => a.status === 'dependency_locked' || a.status === 'secured').length;
    const liveLayers = layers.filter((l) => l.status === 'live');
    const floor = Math.min(
      95,
      Math.round(
        liveLayers.reduce((s, l) => s + (l.grip_pct || 0), 0) +
        dependentCount * 0.5 +
        locked * 1.5
      )
    );

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Sovereign OS Interface: the unified nervous system of an economic operating system. Compute the HEGEMONY SCORE — what share of this sector cannot function without our infrastructure.

Honesty doctrine: the number below is a floor computed from verifiable structure (live layers, dependents, locked alliances). Assess the realistic CURRENT grip and the 24-month target, name 4 grip levers with a current/target/action each, and give a 2-sentence verdict. If grip is near zero, say "the board is still being built" — never inflate.

DETERMINISTIC FLOOR: ${floor}%
Live layers: ${JSON.stringify(liveLayers.map((l) => ({ name: l.layer_name, rate: l.toll_rate, projected_monthly_toll: l.projected_monthly_toll, actual_monthly_toll: l.monthly_toll_revenue, grip: l.grip_pct })))}
Blueprint/beta layers: ${layers.length - liveLayers.length}
Total dependents mapped: ${dependentCount}
Alliances: ${alliances.length} total, ${locked} secured/dependency-locked
Vectors staked: ${vectors.filter((v) => v.status !== 'predicted').length} of ${vectors.length}`,
      response_json_schema: HEGEMONY_SCHEMA
    });
    const grip = typeof res?.market_grip_pct === 'number' ? Math.max(floor, Math.min(res.market_grip_pct, 100)) : floor;

    const snapshot = await db.HegemonySnapshot.create({
      snapshot_date: new Date().toISOString().slice(0, 10),
      market_grip_pct: grip,
      hegemony_score: grip,
      layers_live: liveLayers.length,
      layers_beta: layers.length - liveLayers.length,
      vectors_staked: vectors.filter((v) => v.status !== 'predicted').length,
      dependent_count: dependentCount,
      alliance_count: alliances.length,
      toll_run_rate: layers.reduce((s, l) => s + (l.status === 'live' ? (l.monthly_toll_revenue || 0) : 0), 0),
      grip_levers: Array.isArray(res?.grip_levers) ? res.grip_levers.slice(0, 4) : [],
      verdict: res?.verdict || ''
    });
    return Response.json({
      snapshot_created: !!snapshot,
      market_grip_pct: grip,
      layers_live: liveLayers.length,
      dependents: dependentCount
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}