import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { pickSeedTargets, normTitle } from "../../shared/seedTargets.ts";

const VALIDATIONS_SCHEMA = {
  type: "object",
  properties: {
    validations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          seed_title: { type: "string" },
          hook: { type: "string" },
          landing_headline: { type: "string" },
          landing_copy: { type: "string" },
          variants: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                angle: { type: "string" },
                copy: { type: "string" }
              },
              required: ["label", "angle", "copy"]
            }
          },
          demand_score: { type: "number" },
          projected_waitlist: { type: "number" },
          verdict: { type: "string" }
        },
        required: ["seed_title", "hook", "landing_headline", "landing_copy", "variants", "demand_score", "projected_waitlist", "verdict"]
      }
    }
  },
  required: ["validations"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const db = base44.entities;

    const body = await req.json().catch(() => ({}));
    const targets = await pickSeedTargets(base44, 'GhostValidation', (body?.seedId || '').trim(), 4);
    if (!targets.length) return Response.json({ validations_created: 0, note: 'Top seeds already carry ghost validations.' });

    const prompt = `You are the demand-validation engine inside InvestArch: you prove demand BEFORE a cent is spent on development or patenting.

Below are ${targets.length} IP-seeds. For EACH seed, produce a complete Ghost Validation package plus a demand read grounded in live market signals (adjacent launches, community interest, search behavior, competitor pricing):

1. seed_title — copy the seed's title exactly.
2. hook — one viral "coming soon" line engineered for the seed's buyer (shareable, specific, no hype adjectives).
3. landing_headline — the high-conversion landing page headline.
4. landing_copy — the landing page body, 80 to 140 words: pain, mechanism, proof wedge, waitlist CTA.
5. variants — EXACTLY 2 A/B test variants of the value proposition, each: label ("A" / "B"), angle (the tested hypothesis in one line), copy (the alternate headline plus one supporting sentence).
6. demand_score — 1 to 10: honest demand read for this idea in TODAY's market based on live signals. Most ideas land 3 to 7; do not inflate. State nothing you cannot ground.
7. projected_waitlist — realistic 30-day waitlist projection for an organic launch (number).
8. verdict — one or two sentences: pursue now / iterate the wedge / kill, and why.

IP-SEEDS:
${JSON.stringify(targets.map((s) => ({ id: s.id, title: s.title, gap: s.gap, solution: s.solution, mini_plan: s.mini_plan, asymmetric_score: s.asymmetric_score })))}

Zero filler. Every sentence carries utility.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: VALIDATIONS_SCHEMA
    });
    const vals = (res?.validations || []).slice(0, targets.length);
    if (!vals.length) return Response.json({ error: 'Amplifier returned no validations.' }, { status: 502 });

    const byTitle = new Map(targets.map((t) => [normTitle(t.title), t.id]));
    const records = vals
      .map((v) => ({
        seed_id: byTitle.get(normTitle(v.seed_title)) || '',
        hook: v.hook || '',
        landing_headline: v.landing_headline || '',
        landing_copy: v.landing_copy || '',
        variants: Array.isArray(v.variants) ? v.variants.slice(0, 2) : [],
        demand_score: typeof v.demand_score === 'number' ? v.demand_score : 5,
        projected_waitlist: typeof v.projected_waitlist === 'number' ? v.projected_waitlist : 0,
        verdict: v.verdict || '',
        generated_date: new Date().toISOString().slice(0, 10)
      }))
      .filter((r) => r.seed_id);
    if (!records.length) return Response.json({ error: 'Amplifier validations did not match any seed.' }, { status: 502 });

    const created = await db.GhostValidation.bulkCreate(records);
    return Response.json({ validations_created: (created || []).length || records.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}