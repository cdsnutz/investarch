import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const VECTOR_SCHEMA = {
  type: "object",
  properties: {
    vectors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          vector_name: { type: "string" },
          sector: { type: "string" },
          gold_rush_thesis: { type: "string" },
          leading_indicators: { type: "array", items: { type: "string" } },
          horizon_months: { type: "number" },
          arrival_probability: { type: "number" },
          conviction_score: { type: "number" },
          staked_assets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                detail: { type: "string" }
              },
              required: ["type", "detail"]
            }
          }
        },
        required: ["vector_name", "sector", "gold_rush_thesis", "leading_indicators", "horizon_months", "arrival_probability", "conviction_score", "staked_assets"]
      }
    }
  },
  required: ["vectors"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    // Existing vectors: dedup by normalized name so the Oracle never repeats a claim.
    const existingPage = await base44.asServiceRole.entities.MarketVector.filter({}, { limit: 300, fields: ['vector_name'] });
    const norm = (s) => String(s || '').trim().toLowerCase();
    const claimed = new Set((existingPage.items || []).map((v) => norm(v.vector_name)));

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Prescient Oracle Pod of a sovereign economic operating system. Your mandate: predict where the next Gold Rush happens 6-12 months BEFORE it occurs, using leading indicators.

Scan CURRENT leading indicators (use web search): fresh patent filings, VC fund deployment patterns, arXiv/academic whitepapers, developer-tool adoption spikes, regulatory shifts, geopolitical supply-chain moves. Ignore anything already mainstream — a crowded market is a dead claim.

Output 5 DISTINCT market vectors, each 6-18 months out. For each:
- vector_name: sharp, specific (e.g. "Agentic Compliance Layers for Cross-Border Payroll"), not a generic trend label.
- sector + gold_rush_thesis: why a land-grab erupts here, in 2-3 sentences, grounded in the indicators.
- leading_indicators: 3-5 concrete signals WITH named sources/facts you actually found (patent classes, named funds, paper titles, policy names).
- horizon_months: 6-18. arrival_probability: 0-100. conviction_score: 1-10 (your honest confidence; weight by indicator strength, not hype).
- staked_assets: 3-5 claims to secure FIRST — each {type: "patent"|"domain"|"api"|"brand"|"protocol", detail: the specific claim to file/register/build before the market arrives}.

Truth rule: if web search yields weak signals for a vector, lower its conviction and say so inside the thesis. Never inflate.`,
      response_json_schema: VECTOR_SCHEMA,
      add_context_from_internet: true
    });
    const vectors = (res?.vectors || []).slice(0, 5);
    if (!vectors.length) return Response.json({ error: 'The Oracle returned no vectors.' }, { status: 500 });

    const fresh = vectors.filter((v) => !claimed.has(norm(v.vector_name)));
    if (!fresh.length) return Response.json({ vectors_created: 0, note: 'All predicted vectors are already staked in the ledger.' });

    const today = new Date().toISOString().slice(0, 10);
    const records = fresh.map((v) => ({
      vector_name: v.vector_name,
      sector: v.sector || '',
      gold_rush_thesis: v.gold_rush_thesis || '',
      leading_indicators: Array.isArray(v.leading_indicators) ? v.leading_indicators : [],
      horizon_months: typeof v.horizon_months === 'number' ? v.horizon_months : 12,
      arrival_probability: typeof v.arrival_probability === 'number' ? v.arrival_probability : 50,
      conviction_score: typeof v.conviction_score === 'number' ? v.conviction_score : 5,
      staked_assets: Array.isArray(v.staked_assets) ? v.staked_assets : [],
      status: 'predicted',
      predicted_date: today
    }));
    const created = await db.MarketVector.bulkCreate(records);
    return Response.json({ vectors_created: (created || []).length || records.length, skipped_existing: vectors.length - fresh.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}