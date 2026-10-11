import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const STRATEGY_SCHEMA = {
  type: "object",
  properties: {
    assignments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          seed_title: { type: "string" },
          strategy: { type: "string" },
          strategy_note: { type: "string" }
        },
        required: ["seed_title", "strategy", "strategy_note"]
      }
    }
  },
  required: ["assignments"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Only seeds not yet strategized
    const page = await base44.entities.IpSeed.filter({ strategy_note: null }, { limit: 100, sort: '-created_date' });
    const seeds = (page.items || []).filter((s) => !s.strategy_note);
    if (!seeds.length) return Response.json({ assigned: 0, message: 'All seeds already carry a strategy.' });

    const prompt = `You are the Portfolio Strategist of an IP Factory. Below are unassigned IP-seeds. For EACH one, issue a monetization verdict.

SEEDS:
${JSON.stringify(seeds.map((s) => ({ id: s.id, title: s.title, gap: s.gap, solution: s.solution, asymmetric_score: s.asymmetric_score })))}

Assign exactly one strategy to each seed and return seed_title matching the input titles verbatim:
- "hold" — patentable and defensively valuable: patent it and collect royalties or license passively.
- "flip" — most valuable inside an incumbent's roadmap: package and sell or license to that buyer now.
- "build" — highest Vibe-to-Value ratio: develop into a full SaaS operation.

strategy_note — 1 to 2 sentences of institutional-grade justification: name who buys or who is threatened, or why the build case wins. Truthful, specific, no hype.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: STRATEGY_SCHEMA
    });
    const assignments = res?.assignments || [];
    const byTitle = new Map(seeds.map((s) => [s.title, s]));
    const updates = [];
    for (const a of assignments) {
      const seed = byTitle.get(a.seed_title);
      if (seed && ['hold', 'flip', 'build'].includes(a.strategy)) {
        updates.push({ id: seed.id, strategy: a.strategy, strategy_note: a.strategy_note });
      }
    }
    if (updates.length) await base44.entities.IpSeed.bulkUpdate(updates);
    return Response.json({ assigned: updates.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}