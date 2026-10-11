import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const HEURISTICS_SCHEMA = {
  type: "object",
  properties: {
    heuristics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          insight: { type: "string" },
          directive: { type: "string" },
          weight: { type: "number" }
        },
        required: ["category", "insight", "directive", "weight"]
      }
    }
  },
  required: ["heuristics"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    // Scheduled runs arrive without a user session; manual runs carry one.
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const [seedPage, valPage] = await Promise.all([
      base44.asServiceRole.entities.IpSeed.filter({}, { sort: '-created_date', limit: 300, fields: ['title', 'gap', 'source_channel', 'asymmetric_score', 'strategy', 'strategy_note', 'status', 'yield_date'] }),
      base44.asServiceRole.entities.GhostValidation.filter({}, { limit: 300, fields: ['seed_id', 'demand_score', 'verdict'] })
    ]);
    const seeds = seedPage.items || [];
    const vals = valPage.items || [];
    if (!seeds.length) return Response.json({ heuristics_created: 0, note: 'No portfolio history to learn from yet.' });

    const demandById = new Map();
    vals.forEach((v) => {
      const d = typeof v.demand_score === 'number' ? v.demand_score : 0;
      demandById.set(v.seed_id, Math.max(demandById.get(v.seed_id) || 0, d));
    });
    const portfolio = seeds.slice(0, 120).map((s) => ({
      title: s.title,
      gap: String(s.gap || '').slice(0, 240),
      source_channel: s.source_channel || '',
      asymmetric_score: s.asymmetric_score,
      strategy: s.strategy || '',
      status: s.status || '',
      demand_score: demandById.get(s.id) || null,
      yield_date: s.yield_date || ''
    }));

    const prompt = `You are the Metamorphosis Pod of a sovereign IP conglomerate: the Evolution Engine. You analyze the performance of every previously generated IP asset and extract upgraded heuristics that make the next generation of seeds increasingly lethal.

Below is the portfolio's performance record — seeds with their asymmetric scores, wealth strategies, build status, and (where available) ghost-validation demand scores.

PORTFOLIO RECORD:
${JSON.stringify(portfolio)}

Produce EXACTLY 6 heuristics. Each must:
1. category — the pattern domain (e.g. "buyer selection", "revenue mechanism", "channel selection", "asymmetric scoring", "category positioning").
2. insight — what the DATA shows: which kinds of seeds score high asymmetric value or high demand, which kinds stall, and why. Cite the pattern observed (counts, ranges, channels). No speculation presented as measurement.
3. directive — one imperative sentence the Daydream Synthesizer must obey next cycle (e.g. "weight B2B workflow seeds with usage-based revenue above consumer seeds below demand 5").
4. weight — 1 to 10: how strongly this directive should steer seed generation, based on how clearly the data supports it.

Rules: derive from the record, not from generic startup wisdom. Truthful where the data is thin — say so in the insight. No filler.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: HEURISTICS_SCHEMA
    });
    const heuristics = (res?.heuristics || []).slice(0, 6);
    if (!heuristics.length) return Response.json({ error: 'Metamorphosis returned no heuristics.' }, { status: 502 });

    const today = new Date().toISOString().slice(0, 10);
    const records = heuristics.map((h) => ({
      category: h.category || 'general',
      insight: h.insight || '',
      directive: h.directive || '',
      weight: typeof h.weight === 'number' ? h.weight : 5,
      generated_date: today
    }));
    const created = await db.Heuristic.bulkCreate(records);
    return Response.json({ heuristics_created: (created || []).length || records.length, seeds_analyzed: seeds.length, validations_analyzed: vals.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}