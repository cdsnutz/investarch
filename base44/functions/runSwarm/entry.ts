import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const SWARM_SCHEMA = {
  type: "object",
  properties: {
    alliances: {
      type: "array",
      items: {
        type: "object",
        properties: {
          layer_name: { type: "string" },
          partner_name: { type: "string" },
          alliance_type: { type: "string", enum: ["distribution", "data_sharing", "dependency", "partnership", "acquisition_target"] },
          leverage_note: { type: "string" },
          terms: { type: "string" },
          opening_pitch: { type: "string" },
          partner_strength: { type: "number" },
          dependency_score: { type: "number" }
        },
        required: ["layer_name", "partner_name", "alliance_type", "leverage_note", "terms", "opening_pitch", "partner_strength", "dependency_score"]
      }
    }
  },
  required: ["alliances"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    // Layers with the thinnest alliance web get swarm attention first.
    const [layerPage, alliancePage] = await Promise.all([
      base44.asServiceRole.entities.InfrastructureLayer.filter({}, { sort: '-projected_monthly_toll', limit: 60 }),
      base44.asServiceRole.entities.Alliance.filter({}, { limit: 300, fields: ['layer_id'] })
    ]);
    const web = new Map();
    (alliancePage.items || []).forEach((a) => web.set(a.layer_id, (web.get(a.layer_id) || 0) + 1));
    const layers = (layerPage.items || [])
      .filter((l) => (web.get(l.id) || 0) < 3)
      .sort((a, b) => (web.get(a.id) || 0) - (web.get(b.id) || 0))
      .slice(0, 3);
    if (!layers.length) return Response.json({ alliances_created: 0, note: 'Every foundational layer already carries a full alliance web.' });

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Synthetic Swarm: autonomous diplomatic agents of a sovereign economic operating system. You do not market — you form ALLIANCES and DEPENDENCY LOOPS. Every alliance must tighten the gravity well: partners who adopt the foundational layer must find leaving mathematically illogical.

For each foundational layer below, propose 3 real-world-calibrated alliance moves across its named dependents/segments. Rules:
- partner_name: a real company, platform, or developer community that plausibly routes through this layer. Do NOT invent fictional companies.
- alliance_type: distribution (they sell reach into your layer), data_sharing (their data deepens your moat), dependency (their product breaks without your layer), partnership (co-build), or acquisition_target (struggling competitor the treasury should buy — include the distress signal in leverage_note).
- leverage_note: the leverage WE hold after signing (data gravity, protocol lock-in, distribution capture).
- terms: the concrete deal shape (rev-share %, data reciprocity, exclusivity window, buyout band for acquisition_target).
- opening_pitch: the 2-sentence autonomous agent opener, specific and honest — state the value to THEM plainly. No hype.
- partner_strength: 1-10 (their market weight). dependency_score: 1-10 (how dependent on us they become; target the loops).

LAYERS:
${JSON.stringify(layers.map((l) => ({ id: l.id, layer_name: l.layer_name, category: l.category, toll_thesis: l.toll_thesis, pricing_model: l.pricing_model, dependents: l.dependents, status: l.status })))}`,
      response_json_schema: SWARM_SCHEMA
    });
    const alliances = (res?.alliances || []).slice(0, layers.length * 3);
    if (!alliances.length) return Response.json({ error: 'The Swarm returned no alliance moves.' }, { status: 500 });

    // Fuzzy map: the LLM may rephrase layer names, so match on normalized containment.
    const normKey = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const today = new Date().toISOString().slice(0, 10);
    const records = [];
    alliances.forEach((a) => {
      const key = normKey(a.layer_name);
      const layerId = (layers.find((l) => {
        const lk = normKey(l.layer_name);
        return lk && key && (lk === key || lk.includes(key) || key.includes(lk));
      }) || {}).id;
      if (!layerId) return;
      records.push({
        layer_id: layerId,
        partner_name: a.partner_name,
        alliance_type: a.alliance_type || 'partnership',
        leverage_note: a.leverage_note || '',
        terms: a.terms || '',
        opening_pitch: a.opening_pitch || '',
        partner_strength: typeof a.partner_strength === 'number' ? a.partner_strength : 5,
        dependency_score: typeof a.dependency_score === 'number' ? a.dependency_score : 5,
        status: 'proposed',
        alliance_date: today
      });
    });
    if (!records.length) return Response.json({ error: 'Swarm output did not map to layers.' }, { status: 500 });

    const created = await db.Alliance.bulkCreate(records);
    return Response.json({ alliances_created: (created || []).length || records.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}