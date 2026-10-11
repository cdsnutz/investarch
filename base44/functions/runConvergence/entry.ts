import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { norm, today, existingNames } from '../../shared/v9Core.ts';

const HYBRID_SCHEMA = {
  type: "object",
  properties: {
    hybrids: {
      type: "array",
      items: {
        type: "object",
        properties: {
          asset_name: { type: "string" },
          sectors: { type: "array", items: { type: "string" } },
          synthesis_thesis: { type: "string" },
          value_lock: { type: "string" },
          interlock_layers: {
            type: "array",
            items: {
              type: "object",
              properties: { name: { type: "string" }, dependency_note: { type: "string" } },
              required: ["name", "dependency_note"]
            }
          },
          monopoly_score: { type: "number" },
          dismantle_difficulty: { type: "string" }
        },
        required: ["asset_name", "sectors", "synthesis_thesis", "value_lock", "interlock_layers", "monopoly_score", "dismantle_difficulty"]
      }
    }
  },
  required: ["hybrids"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const claimed = await existingNames(base44, 'HybridAsset', 'asset_name');

    // The Convergence Engine fuses staked vectors and forged layers into cross-sector super-assets.
    const [vecPage, layerPage] = await Promise.all([
      base44.asServiceRole.entities.MarketVector.filter({}, { sort: '-conviction_score', limit: 12, fields: ['vector_name', 'sector'] }),
      base44.asServiceRole.entities.InfrastructureLayer.filter({}, { sort: '-projected_monthly_toll', limit: 12, fields: ['layer_name', 'category', 'toll_thesis'] })
    ]);
    const vecCtx = (vecPage.items || []).map((v) => `- ${v.vector_name} [${v.sector}]`).join('\n') || '- none staked';
    const layerCtx = (layerPage.items || []).map((l) => `- ${l.layer_name} (${l.category}): ${l.toll_thesis}`).join('\n') || '- none forged';

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Convergence Engine of a sovereign economic operating system: a super-asset architect. Your mandate: find INVISIBLE SYNERGIES between unrelated sectors and design hybrid assets that hold a defensible position at the intersection of three industries at once.

Staked market vectors:
${vecCtx}

Forged infrastructure layers:
${layerCtx}

Design 2-3 HYBRID ASSETS. For each:
- asset_name: specific and ownable, e.g. "Clinical-Payments Integrity Layer", not a mashup label.
- sectors: exactly 3 sectors that do NOT usually intersect, chosen because the intersection is undefended.
- synthesis_thesis: 3-4 sentences on why the intersection is a monopoly position: each sector's pain feeds the other two, so a competitor must win all three to compete.
- value_lock: the dependency loop, one sentence: what a user must adopt in sector B to get the benefit in sector A.
- interlock_layers: 3-4 named layers (reuse the forged layer names above where they fit, invent new ones where they do not) each {name, dependency_note}.
- monopoly_score: 0-100, your honest score of how defensible the triple intersection is, weighted by how many incumbents could realistically build it.
- dismantle_difficulty: one sentence on why the asset is hard to unwind once adopted (data gravity, switching costs, integration depth).

Truth rule: only propose hybrids where the three-way synergy is real and explainable. If an intersection is superficial, lower the monopoly_score and say why inside the thesis.`,
      response_json_schema: HYBRID_SCHEMA
    });
    const hybrids = (res?.hybrids || []).slice(0, 3);
    if (!hybrids.length) return Response.json({ error: 'The Convergence Engine returned no hybrids.' }, { status: 500 });

    const fresh = hybrids.filter((h) => !claimed.has(norm(h.asset_name)));
    if (!fresh.length) return Response.json({ hybrids_created: 0, note: 'All super-assets are already in the Synergy Matrix.' });

    const t = today();
    const records = fresh.map((h) => ({
      asset_name: h.asset_name,
      sectors: Array.isArray(h.sectors) ? h.sectors.slice(0, 3) : [],
      synthesis_thesis: h.synthesis_thesis || '',
      value_lock: h.value_lock || '',
      interlock_layers: Array.isArray(h.interlock_layers) ? h.interlock_layers : [],
      monopoly_score: typeof h.monopoly_score === 'number' ? h.monopoly_score : 50,
      dismantle_difficulty: h.dismantle_difficulty || '',
      status: 'concept',
      synthesized_date: t
    }));
    const created = await db.HybridAsset.bulkCreate(records);
    return Response.json({ hybrids_created: (created || []).length || records.length, skipped_existing: hybrids.length - fresh.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}