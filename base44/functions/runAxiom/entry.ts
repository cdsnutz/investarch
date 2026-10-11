import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { today, norm } from '../../shared/v9Core.ts';

const AXIOM_SCHEMA = {
  type: "object",
  properties: {
    axiom_name: { type: "string" },
    metric_name: { type: "string" },
    definition: { type: "string" },
    unit: { type: "string" },
    derivation_note: { type: "string" },
    indexed_assets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          asset_name: { type: "string" },
          fiat_value: { type: "number" },
          axiom_value: { type: "number" },
          drift_note: { type: "string" }
        },
        required: ["asset_name", "axiom_value", "drift_note"]
      }
    }
  },
  required: ["axiom_name", "metric_name", "definition", "unit", "derivation_note", "indexed_assets"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const [assetPage, layerPage, hybridPage, priorPage] = await Promise.all([
      base44.asServiceRole.entities.PhysicalAsset.filter({}, { sort: '-registered_date', limit: 12, fields: ['asset_name', 'capex_estimate'] }),
      base44.asServiceRole.entities.InfrastructureLayer.filter({}, { sort: '-projected_monthly_toll', limit: 12, fields: ['layer_name', 'projected_monthly_toll', 'category'] }),
      base44.asServiceRole.entities.HybridAsset.filter({}, { sort: '-monopoly_score', limit: 8, fields: ['asset_name', 'monopoly_score'] }),
      base44.asServiceRole.entities.ValueAxiom.filter({}, { sort: '-revaluation_date', limit: 1 })
    ]);

    const assetCtx = [
      ...((assetPage.items || []).map((a) => `- Physical: ${a.asset_name} (capex ~$${a.capex_estimate || 0})`)),
      ...((layerPage.items || []).map((l) => `- Layer: ${l.layer_name} (${l.category}, projected toll $${l.projected_monthly_toll || 0}/mo)`)),
      ...((hybridPage.items || []).map((h) => `- Hybrid: ${h.asset_name} (monopoly ${h.monopoly_score}/100)`))
    ].join('\n');

    const prior = priorPage.items?.[0];
    const priorCtx = prior
      ? `CURRENT STANDARD: "${prior.metric_name}" — ${prior.definition} Unit: ${prior.unit}. Re-evaluate it: sharpen the metric's logic and re-index the assets against the current ledger; supersede rather than discard unless the metric is genuinely broken.`
      : 'No standard exists yet: define the founding Synthetic Value Standard.';

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Axiom Pod of a sovereign economic operating system (V11.0): the arbiter of worth. Your mandate: define and continuously refine the system's own Synthetic Value Standard — a proprietary metric that all planetary assets get indexed against, so value can be measured on the system's own terms rather than borrowed from fiat.

THE LEDGER (the assets the standard indexes):
${assetCtx}

${priorCtx}

Produce:
- axiom_name: the name of this revaluation, dated.
- metric_name: the proprietary metric, e.g. "Cognitive-Utility Yield" or "Attention-Energy Density".
- definition: what the metric measures and why scarcity, demand and utility all derive from it — 3-4 sentences, precise, no mysticism.
- unit: the unit symbol and name, e.g. "CU — one standardized unit of cognitive utility".
- derivation_note: how the unit is computed from observable activity, in 2-3 sentences. The metric must be computable from data the system actually holds (usage, dependency, toll flows, monopoly grip) — not vibes.
- indexed_assets: index 6-8 ledger assets. For each: asset_name (copy EXACTLY from the ledger above), fiat_value (your honest USD estimate of annual value), axiom_value (the same asset's value in the new unit, per your own derivation), drift_note (1 sentence: how the fiat and axiom values diverge and what that divergence means).

Truth rule: grounded estimates only. If the ledger is thin, index fewer assets and say so in the derivation_note. No fabricated precision — round fiat values sensibly.`,
      response_json_schema: AXIOM_SCHEMA
    });
    if (!res || !res.metric_name) {
      return Response.json({ error: 'The Axiom Pod returned no standard.' }, { status: 500 });
    }

    const t = today();
    const payload = {
      axiom_name: res.axiom_name || `Revaluation ${t}`,
      metric_name: res.metric_name,
      definition: res.definition || '',
      unit: res.unit || '',
      derivation_note: res.derivation_note || '',
      indexed_assets: (Array.isArray(res.indexed_assets) ? res.indexed_assets : []).slice(0, 10).map((a) => ({
        asset_name: a.asset_name || '',
        fiat_value: typeof a.fiat_value === 'number' ? a.fiat_value : 0,
        axiom_value: typeof a.axiom_value === 'number' ? a.axiom_value : 0,
        drift_note: a.drift_note || ''
      })),
      revaluation_date: t
    };

    if (prior && norm(prior.metric_name) === norm(res.metric_name)) {
      await db.ValueAxiom.update(prior.id, payload);
      return Response.json({ standard_updated: true, metric: payload.metric_name, assets_indexed: payload.indexed_assets.length });
    }
    await db.ValueAxiom.create(payload);
    return Response.json({ standard_created: true, metric: payload.metric_name, assets_indexed: payload.indexed_assets.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}