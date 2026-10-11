import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { today, existingNames } from '../../shared/v9Core.ts';

const IMPRINT_SCHEMA = {
  type: "object",
  properties: {
    imprints: {
      type: "array",
      items: {
        type: "object",
        properties: {
          archetype_name: { type: "string" },
          population_segment: { "type": "string" },
          imprint_thesis: { type: "string" },
          channels: { type: "array", items: { type: "string" } },
          necessity_note: { type: "string" },
          imprint_depth_pct: { type: "number" },
          disclosure: { type: "string" }
        },
        required: ["archetype_name", "population_segment", "imprint_thesis", "channels", "necessity_note", "disclosure"]
      }
    }
  },
  required: ["imprints"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const claimed = await existingNames(base44, 'ArchetypeImprint', 'archetype_name');

    const [layerPage, assetPage] = await Promise.all([
      base44.asServiceRole.entities.InfrastructureLayer.filter({}, { sort: '-projected_monthly_toll', limit: 6, fields: ['layer_name', 'toll_thesis'] }),
      base44.asServiceRole.entities.HybridAsset.filter({}, { sort: '-monopoly_score', limit: 4, fields: ['asset_name', 'synthesis_thesis'] })
    ]);

    const offerCtx = [
      ...((layerPage.items || []).map((l) => `- Layer: ${l.layer_name} — ${l.toll_thesis || ''}`)),
      ...((assetPage.items || []).map((a) => `- Asset: ${a.asset_name} — ${a.synthesis_thesis || ''}`))
    ].join('\n');

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Psionic Pod of a sovereign economic operating system (V11.0): the archetypal strategist. Your mandate: design Archetypal Imprints — the durable cultural and psychological positions that make the system's assets feel like fundamental infrastructure rather than products, so adoption becomes identity, not a purchase decision.

WHAT THE SYSTEM OFFERS (position these):
${offerCtx}

Design 3 DISTINCT Archetypal Imprints. For each:
- archetype_name: the cultural position, e.g. "The Utility That Vanishes Into Life" or "The Standard Beneath the Standard".
- population_segment: the segment the archetype anchors (profession, community, or market).
- imprint_thesis: the story the segment adopts and retells, in 2-3 sentences — honest, useful, and aligned with what the assets actually do.
- channels: 3-4 concrete distribution channels (open documentation, developer education, industry standards participation, public benchmarking, professional curricula).
- necessity_note: WHY this segment comes to experience the asset as infrastructure — grounded in genuine utility and habit formation, in 2 sentences.
- imprint_depth_pct: 0-100, your honest estimate of current cultural depth for this archetype.
- disclosure: how the positioning stays transparent (attribution, open-source signals, disclosed sponsorship).

Truth rule: this is narrative architecture, not manipulation. No dark patterns, no targeting of vulnerable groups, no fabricated claims about the assets — an imprint only holds if it is true. Position through genuine utility, public artifacts and honest storytelling.`,
      response_json_schema: IMPRINT_SCHEMA
    });
    const imprints = (res?.imprints || []).slice(0, 3);
    if (!imprints.length) return Response.json({ error: 'The Psionic Pod returned no imprints.' }, { status: 500 });

    const fresh = imprints.filter((i) => !claimed.has(String(i.archetype_name || '').trim().toLowerCase()));
    if (!fresh.length) return Response.json({ imprints_created: 0, note: 'All archetypes are already imprinted on the consciousness map.' });

    const t = today();
    const records = fresh.map((i) => ({
      archetype_name: i.archetype_name,
      population_segment: i.population_segment || '',
      imprint_thesis: i.imprint_thesis || '',
      channels: Array.isArray(i.channels) ? i.channels : [],
      necessity_note: i.necessity_note || '',
      imprint_depth_pct: typeof i.imprint_depth_pct === 'number' ? Math.min(100, Math.max(0, i.imprint_depth_pct)) : 10,
      disclosure: i.disclosure || 'Transparent positioning',
      status: 'seeded',
      imprinted_date: t
    }));
    const created = await db.ArchetypeImprint.bulkCreate(records);
    return Response.json({ imprints_created: (created || []).length || records.length, skipped_existing: imprints.length - fresh.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}