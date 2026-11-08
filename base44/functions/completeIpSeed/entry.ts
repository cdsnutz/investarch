import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const FILL_SCHEMA = {
  type: "object",
  properties: {
    gap: { type: "string" },
    solution: { type: "string" },
    mini_plan: { type: "string" },
    pain_signal: { type: "string" },
    source_channel: { type: "string" },
    asymmetric_score: { type: "number" },
    blueprint: {
      type: "object",
      properties: {
        tech_stack: { type: "array", items: { type: "string" } },
        db_schema: { type: "string" },
        core_logic: { type: "string" }
      },
      required: ["tech_stack", "db_schema", "core_logic"]
    }
  }
};

const hasText = (value) => String(value || '').trim().length > 0;

const missingFields = (seed) => {
  const bp = seed?.blueprint || {};
  const missing = [];
  ['gap', 'solution', 'mini_plan', 'pain_signal', 'source_channel'].forEach((key) => {
    if (!hasText(seed?.[key])) missing.push(key);
  });
  if (typeof seed?.asymmetric_score !== 'number') missing.push('asymmetric_score');
  if (!Array.isArray(bp.tech_stack) || !bp.tech_stack.length) missing.push('tech_stack');
  if (!hasText(bp.db_schema)) missing.push('db_schema');
  if (!hasText(bp.core_logic)) missing.push('core_logic');
  return missing;
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const seedId = String(body?.seedId || '').trim();
    if (!seedId) return Response.json({ error: 'seedId is required.' }, { status: 400 });

    const seed = await base44.entities.IpSeed.get(seedId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!seed) return Response.json({ error: 'Seed not found.' }, { status: 404 });

    const missing = missingFields(seed);
    if (!missing.length) return Response.json({ seed, filled: [], complete: true });

    const prompt = `You are completing one IP-seed record. Only these fields are missing: ${missing.join(', ')}.

Everything already present must stay consistent with what you write. Do not restate or contradict it.

SEED AS IT STANDS:
${JSON.stringify({ title: seed.title, gap: seed.gap, pain_signal: seed.pain_signal, source_channel: seed.source_channel, solution: seed.solution, asymmetric_score: seed.asymmetric_score, mini_plan: seed.mini_plan, blueprint: seed.blueprint })}

Rules:
- gap: the market lacuna in 1-2 sentences, naming the specific failure being exploited.
- solution: the technical approach in 2-3 sentences, implementable with a normal web stack. "AI" is not an architecture.
- pain_signal: the observed demand this seed answers, with the community, product or docket it comes from. If evidence is inferential, label it inferred. Never invent a quote attributed to a real person.
- source_channel: where that signal lives.
- asymmetric_score: 1 to 10, scored truthfully.
- mini_plan: 90 to 140 words. Buyer, wedge, revenue mechanism, why-now, adoption loop, moat. No filler.
- blueprint: tech_stack (4 to 6 concrete choices), db_schema (core tables with key columns, one paragraph), core_logic (the hardest algorithmic piece, one paragraph).
No em dashes. No filler.`;

    const fill = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: FILL_SCHEMA
    });

    const patch = {};
    ['gap', 'solution', 'mini_plan', 'pain_signal', 'source_channel'].forEach((key) => {
      if (!hasText(seed?.[key]) && hasText(fill?.[key])) patch[key] = fill[key];
    });
    if (typeof seed?.asymmetric_score !== 'number' && typeof fill?.asymmetric_score === 'number') {
      patch.asymmetric_score = fill.asymmetric_score;
    }

    const currentBp = seed.blueprint || {};
    const filledBp = fill?.blueprint || {};
    const blueprint = {
      tech_stack: Array.isArray(currentBp.tech_stack) && currentBp.tech_stack.length
        ? currentBp.tech_stack
        : (Array.isArray(filledBp.tech_stack) ? filledBp.tech_stack : []),
      db_schema: hasText(currentBp.db_schema) ? currentBp.db_schema : (filledBp.db_schema || ''),
      core_logic: hasText(currentBp.core_logic) ? currentBp.core_logic : (filledBp.core_logic || '')
    };
    if (blueprint.tech_stack.length || hasText(blueprint.db_schema) || hasText(blueprint.core_logic)) {
      patch.blueprint = blueprint;
    }

    const updated = await base44.entities.IpSeed.update(seedId, patch);
    const stillMissing = missingFields(updated);

    return Response.json({
      seed: updated,
      filled: Object.keys(patch),
      complete: stillMissing.length === 0,
      still_missing: stillMissing
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}