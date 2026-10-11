import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { norm, today, existingNames } from '../../shared/v9Core.ts';

const NARRATIVE_SCHEMA = {
  type: "object",
  properties: {
    narratives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          narrative_name: { type: "string" },
          target_market: { type: "string" },
          narrative_thesis: { type: "string" },
          cultural_shift: { type: "string" },
          trigger_events: { type: "array", items: { type: "string" } },
          demand_vacuum: { type: "string" },
          pull_levers: { "type": "array", items: { type: "string" } },
          adoption_forecast_pct: { type: "number" }
        },
        required: ["narrative_name", "target_market", "narrative_thesis", "cultural_shift", "trigger_events", "demand_vacuum", "pull_levers", "adoption_forecast_pct"]
      }
    }
  },
  required: ["narratives"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const claimed = await existingNames(base44, 'NarrativeVector', 'narrative_name');

    // The Perception Pod seeds narratives around vectors the Oracle already predicted.
    const vecPage = await base44.asServiceRole.entities.MarketVector.filter({}, { sort: '-conviction_score', limit: 10, fields: ['vector_name', 'sector', 'gold_rush_thesis'] });
    const vectors = vecPage.items || [];
    const vecCtx = vectors.length
      ? vectors.map((v) => `- ${v.vector_name} [${v.sector}]: ${v.gold_rush_thesis}`).join('\n')
      : '- No vectors staked yet; seed narratives from the strongest open markets you find.';

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Perception Pod of a sovereign economic operating system: a narrative-strategy engine. Your mandate: identify the REAL cultural shifts already underway in target markets, and define the narrative position a well-built product should occupy FIRST, before the market matures.

The empire's staked vectors:
${vecCtx}

Scan CURRENT evidence (use web search): search-volume movement, mainstream media framing, analyst reports, community discourse (Reddit/HN/X topics gaining share), policy debates, buyer-language changes in RFPs and job postings.

Output 3 DISTINCT narrative positions, each tied where possible to a staked vector. For each:
- narrative_name: sharp and specific, e.g. "The Compliance-Debt Reckoning in SMB Fintech", not a vague trend label.
- target_market: the buyer population and segment.
- narrative_thesis: 2-3 sentences on the shift, grounded in the evidence you found.
- cultural_shift: the belief that is moving, stated plainly, in one sentence.
- trigger_events: 3-4 named, verifiable events or data points you actually found.
- demand_vacuum: the unmet need the narrative exposes, described honestly.
- pull_levers: 3-4 concrete content/positioning moves (angles, comparisons, proof assets) that would make this position synonymous with the company that owns it.
- adoption_forecast_pct: 0-100, your honest estimate of share-of-mind capture within 12 months IF executed well.

Truth rule: every claim must be backed by evidence you actually found. No fabricated statistics, no manufactured outrage, no deception of end buyers. The narrative wins by being early and correct, not by lying.`,
      response_json_schema: NARRATIVE_SCHEMA,
      add_context_from_internet: true
    });
    const narratives = (res?.narratives || []).slice(0, 3);
    if (!narratives.length) return Response.json({ error: 'The Perception Pod returned no narratives.' }, { status: 500 });

    const fresh = narratives.filter((n) => !claimed.has(norm(n.narrative_name)));
    if (!fresh.length) return Response.json({ narratives_created: 0, note: 'All narrative positions are already seeded in the map.' });

    const t = today();
    const records = fresh.map((n) => ({
      narrative_name: n.narrative_name,
      target_market: n.target_market || '',
      narrative_thesis: n.narrative_thesis || '',
      cultural_shift: n.cultural_shift || '',
      trigger_events: Array.isArray(n.trigger_events) ? n.trigger_events : [],
      demand_vacuum: n.demand_vacuum || '',
      pull_levers: Array.isArray(n.pull_levers) ? n.pull_levers : [],
      adoption_forecast_pct: typeof n.adoption_forecast_pct === 'number' ? n.adoption_forecast_pct : 30,
      status: 'seeding',
      seeded_date: t
    }));
    const created = await db.NarrativeVector.bulkCreate(records);
    return Response.json({ narratives_created: (created || []).length || records.length, skipped_existing: narratives.length - fresh.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}