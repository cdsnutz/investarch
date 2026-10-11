import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const LAYER_SCHEMA = {
  type: "object",
  properties: {
    layers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          vector_name: { type: "string" },
          layer_name: { type: "string" },
          category: { type: "string", enum: ["api", "protocol", "platform", "data_layer", "payment_gateway", "middleware"] },
          toll_thesis: { type: "string" },
          api_surface: { type: "string" },
          pricing_model: { type: "string" },
          toll_rate: { type: "string" },
          stack: { type: "array", items: { type: "string" } },
          dependents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                dependency_note: { type: "string" }
              },
              required: ["name", "dependency_note"]
            }
          },
          projected_monthly_toll: { type: "number" }
        },
        required: ["vector_name", "layer_name", "category", "toll_thesis", "api_surface", "pricing_model", "toll_rate", "stack", "dependents", "projected_monthly_toll"]
      }
    }
  },
  required: ["layers"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    // Vectors with no foundation yet, highest conviction first.
    const [vectorPage, layerPage] = await Promise.all([
      base44.asServiceRole.entities.MarketVector.filter(
        { status: { $in: ['predicted', 'staked'] } },
        { sort: '-conviction_score', limit: 60 }
      ),
      base44.asServiceRole.entities.InfrastructureLayer.filter({}, { limit: 300, fields: ['vector_id'] })
    ]);
    const covered = new Set((layerPage.items || []).map((l) => l.vector_id));
    const targets = (vectorPage.items || []).filter((v) => !covered.has(v.id)).slice(0, 3);
    if (!targets.length) return Response.json({ layers_forged: 0, note: 'Every staked vector already has a foundational layer.' });

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Infrastructure Forge of a sovereign economic operating system. The era of end-user apps is over: you build the ROAD, not the car. For each staked market vector below, engineer the FOUNDATIONAL LAYER every future competitor must pay to cross.

Design a toll booth: a specialized API, protocol, data-layer, payment gateway, or middleware. Rules:
- layer_name: infrastructure-grade (e.g. "SettleMesh: Agent-to-Agent Settlement Protocol").
- toll_thesis: why developers/companies in this vector MUST depend on this layer (2-3 sentences: switching cost, gravity well).
- api_surface: the concrete surface — 4-6 named endpoints/primitives with one-line contracts.
- pricing_model: how the toll is collected (per-call, per-seat, rev-share, data-egress) with the free tier that hooks the ecosystem.
- toll_rate: the headline rate (e.g. "0.4% of settled volume; $0.002/call above 10k/day").
- stack: 4-6 technologies for a high-availability deployment.
- dependents: 4-6 named real companies/developer segments that would route through this layer first, each with a one-line dependency_note.
- projected_monthly_toll: honest 18-month projection in USD given the vector's arrival_probability (show it is a projection, not revenue).

VECTORS:
${JSON.stringify(targets.map((v) => ({ id: v.id, vector_name: v.vector_name, sector: v.sector, thesis: v.gold_rush_thesis, indicators: v.leading_indicators, horizon_months: v.horizon_months, arrival_probability: v.arrival_probability })))}`,
      response_json_schema: LAYER_SCHEMA
    });
    const layers = (res?.layers || []).slice(0, targets.length);
    if (!layers.length) return Response.json({ error: 'The Forge returned no layers.' }, { status: 500 });

    const byVector = new Map(targets.map((t) => [String(t.vector_name || '').trim().toLowerCase(), t]));
    const today = new Date().toISOString().slice(0, 10);
    const records = [];
    const stakedIds = [];
    layers.forEach((l) => {
      const v = byVector.get(String(l.vector_name || '').trim().toLowerCase());
      if (!v) return;
      records.push({
        vector_id: v.id,
        layer_name: l.layer_name,
        category: l.category || 'api',
        toll_thesis: l.toll_thesis || '',
        api_surface: l.api_surface || '',
        pricing_model: l.pricing_model || '',
        toll_rate: l.toll_rate || '',
        stack: Array.isArray(l.stack) ? l.stack : [],
        dependents: Array.isArray(l.dependents) ? l.dependents : [],
        projected_monthly_toll: typeof l.projected_monthly_toll === 'number' ? l.projected_monthly_toll : 0,
        monthly_toll_revenue: 0,
        grip_pct: 0,
        status: 'blueprint',
        forged_date: today
      });
      stakedIds.push(v.id);
    });
    if (!records.length) return Response.json({ error: 'Forge output did not map to staked vectors.' }, { status: 500 });

    const created = await db.InfrastructureLayer.bulkCreate(records);
    await db.MarketVector.updateMany({ id: { $in: stakedIds } }, { $set: { status: 'foundation_building' } });
    return Response.json({ layers_forged: (created || []).length || records.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}