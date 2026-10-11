import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const PLANS_SCHEMA = {
  type: "object",
  properties: {
    plans: {
      type: "array",
      items: {
        type: "object",
        properties: {
          seed_title: { type: "string" },
          target_competitor: { type: "string" },
          domain: { type: "string" },
          churn_analysis: { type: "string" },
          customer_complaints: { type: "string" },
          technical_debt: { type: "string" },
          kill_feature: { type: "string" },
          kill_feature_spec: { type: "string" },
          obsolescence_path: { type: "string" }
        },
        required: ["seed_title", "target_competitor", "domain", "churn_analysis", "customer_complaints", "technical_debt", "kill_feature", "kill_feature_spec", "obsolescence_path"]
      }
    }
  },
  required: ["plans"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    // Scheduled runs arrive without a user session; manual runs carry one.
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const body = await req.json().catch(() => ({}));
    const seedId = (body?.seedId || '').trim();

    const [seedPage, planPage] = await Promise.all([
      base44.asServiceRole.entities.IpSeed.filter({}, { sort: '-asymmetric_score', limit: 60 }),
      base44.asServiceRole.entities.DisruptionPlan.filter({}, { limit: 300, fields: ['seed_id'] })
    ]);
    const covered = new Set((planPage.items || []).map((p) => p.seed_id));
    let targets = (seedPage.items || []).filter((s) => !covered.has(s.id));
    if (seedId) {
      const explicit = (seedPage.items || []).find((s) => s.id === seedId);
      if (explicit) targets = [explicit];
    }
    targets = targets.slice(0, 4);
    if (!targets.length) return Response.json({ plans_created: 0, note: 'Top seeds already carry disruption plans.' });

    const prompt = `You are the War-Room Pod of a sovereign IP conglomerate: a competitive-intelligence unit whose mandate is to make incumbents obsolete, not to out-feature them politely.

Below are ${targets.length} IP-seeds. For EACH seed, identify the single most exposed TARGET COMPETITOR currently holding the market that seed attacks (a real, named company or product — use live web knowledge). Then produce the Disruption Blueprint:

1. seed_title — copy the seed's title exactly.
2. target_competitor — real named product/company plus their positioning, one line.
3. domain — the market both sides fight over.
4. churn_analysis — where this competitor loses customers: their leaky buckets, grounded in known complaints, pricing decay, or product abandonment. 2-4 sentences.
5. customer_complaints — the specific recurring complaints users voice about them. Concrete; label inferred evidence as inferred.
6. technical_debt — where their architecture or product surface is brittle and slow to change.
7. kill_feature — THE feature to build that makes their product obsolete overnight: named, product-grade.
8. kill_feature_spec — how it works technically, tight enough for an engineer to build (3-5 sentences), referencing the seed's approach.
9. obsolescence_path — the 90-day sequence: ship the kill-feature, capture their churn, lock the market.

IP-SEEDS:
${JSON.stringify(targets.map((s) => ({ id: s.id, title: s.title, gap: s.gap, solution: s.solution, asymmetric_score: s.asymmetric_score })))}

Truth over theater: name real competitors and real, verifiable failure modes. Never present invented data as fact. Every sentence carries utility.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_8_flash',
      response_json_schema: PLANS_SCHEMA
    });
    const plans = (res?.plans || []).slice(0, targets.length);
    if (!plans.length) return Response.json({ error: 'War-Room returned no plans.' }, { status: 502 });

    const norm = (t) => String(t || '').trim().toLowerCase();
    const byTitle = new Map(targets.map((t) => [norm(t.title), t.id]));
    const records = plans
      .map((p) => ({
        seed_id: byTitle.get(norm(p.seed_title)) || '',
        target_competitor: p.target_competitor,
        domain: p.domain || '',
        churn_analysis: p.churn_analysis || '',
        customer_complaints: p.customer_complaints || '',
        technical_debt: p.technical_debt || '',
        kill_feature: p.kill_feature,
        kill_feature_spec: p.kill_feature_spec || '',
        obsolescence_path: p.obsolescence_path || '',
        generated_date: new Date().toISOString().slice(0, 10)
      }))
      .filter((r) => r.seed_id);
    if (!records.length) return Response.json({ error: 'War-Room plans did not match any seed.' }, { status: 502 });

    const created = await db.DisruptionPlan.bulkCreate(records);
    return Response.json({ plans_created: (created || []).length || records.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}