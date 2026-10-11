import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { norm, today, existingNames } from '../../shared/v9Core.ts';

const PHYSICAL_SCHEMA = {
  type: "object",
  properties: {
    assets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          asset_name: { type: "string" },
          realm: { type: "string" },
          vertical_thesis: { "type": "string" },
          supply_chain_plan: { type: "string" },
          ip_claims: { "type": "array", items: { type: "string" } },
          capex_estimate: { type: "number" },
          integration_note: { type: "string" }
        },
        required: ["asset_name", "realm", "vertical_thesis", "supply_chain_plan", "ip_claims", "capex_estimate", "integration_note"]
      }
    }
  },
  required: ["assets"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const claimed = await existingNames(base44, 'PhysicalAsset', 'asset_name');

    // The Matter-Synthesis Pod anchors physical designs to the empire's digital layers and hybrids.
    const [hybPage, layerPage] = await Promise.all([
      base44.asServiceRole.entities.HybridAsset.filter({}, { sort: '-monopoly_score', limit: 8, fields: ['asset_name', 'sectors', 'value_lock'] }),
      base44.asServiceRole.entities.InfrastructureLayer.filter({}, { sort: '-projected_monthly_toll', limit: 8, fields: ['layer_name', 'category'] })
    ]);
    const ctx = [
      'Digital layers owned:',
      (layerPage.items || []).map((l) => `- ${l.layer_name} (${l.category})`).join('\n') || '- none',
      'Hybrid super-assets owned:',
      (hybPage.items || []).map((h) => `- ${h.asset_name} [${(h.sectors || []).join(', ')}]: ${h.value_lock}`).join('\n') || '- none'
    ].join('\n');

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Matter-Synthesis Pod of a sovereign economic operating system: a hardware and physical-infrastructure architect. Your mandate: extend the empire's digital position into the physical world — hardware, robotics, energy, smart-city systems, biotech platform tooling — so the full vertical stack from silicon to cloud is owned.

Current digital holdings:
${ctx}

Design 3 DISTINCT physical assets that anchor the strongest digital layers to physical reality. For each:
- asset_name: specific, e.g. "Edge Settlement Micro-Appliance v1".
- realm: one of hardware | biotech | energy | infrastructure | robotics.
- vertical_thesis: 3-4 sentences on why the physical form deepens the digital moat: what the digital layer cannot lock without the physical asset.
- supply_chain_plan: the sourcing route in 2-3 sentences: named component categories, contract-manufacturing route, second-source strategy, lead times.
- ip_claims: 3-4 specific patentable claims (mechanical, electrical, biochemical, or process) to file before sourcing begins.
- capex_estimate: your honest dollar estimate for a first production run or pilot.
- integration_note: how the asset plugs back into the digital stack (which layer it serves, what data or control returns to the system).

Truth rule: grounded engineering, not sci-fi. Prefer designs contract-manufacturable within 12 months. For biotech, restrict to platform tooling, lab automation, and process claims — cite real manufacturing routes. If a design is not physically credible, drop it rather than inflate.`,
      response_json_schema: PHYSICAL_SCHEMA
    });
    const assets = (res?.assets || []).slice(0, 3);
    if (!assets.length) return Response.json({ error: 'The Matter-Synthesis Pod returned no assets.' }, { status: 500 });

    const fresh = assets.filter((a) => !claimed.has(norm(a.asset_name)));
    if (!fresh.length) return Response.json({ assets_created: 0, note: 'All physical designs are already in the registry.' });

    const t = today();
    const REALMS = ['hardware', 'biotech', 'energy', 'infrastructure', 'robotics'];
    const records = fresh.map((a) => ({
      asset_name: a.asset_name,
      realm: REALMS.includes(a.realm) ? a.realm : 'hardware',
      vertical_thesis: a.vertical_thesis || '',
      supply_chain_plan: a.supply_chain_plan || '',
      ip_claims: Array.isArray(a.ip_claims) ? a.ip_claims : [],
      capex_estimate: typeof a.capex_estimate === 'number' ? a.capex_estimate : 0,
      integration_note: a.integration_note || '',
      status: 'blueprint',
      registered_date: t
    }));
    const created = await db.PhysicalAsset.bulkCreate(records);
    return Response.json({ assets_created: (created || []).length || records.length, skipped_existing: assets.length - fresh.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}