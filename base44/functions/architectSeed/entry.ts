import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const PROSE_SCHEMA = {
  type: "object",
  properties: {
    repo_name: { type: "string" },
    onboarding_guide: { type: "string" },
    user_manual: { type: "string" },
    ecosystem_interlocks: { type: "string" }
  },
  required: ["repo_name", "onboarding_guide", "user_manual", "ecosystem_interlocks"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const seedId = (body?.seedId || '').trim();
    if (!seedId) return Response.json({ error: 'seedId is required.' }, { status: 400 });

    const seed = await base44.entities.IpSeed.get(seedId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!seed) return Response.json({ error: 'Seed not found.' }, { status: 404 });

    const siblings = await base44.entities.IpSeed.filter({ status: 'built' }, { limit: 20, fields: ['title', 'repo_name'] });
    const siblingList = (siblings.items || []).filter((s) => s.id !== seedId).map((s) => `${s.title} (${s.repo_name || 'unnamed'})`).join('; ') || 'none yet';

    const prompt = `You are the Architect of an IP Factory. The codebase for this asset is already generated and complete: an Express 4 API with Postgres, session-cookie authentication, owner-scoped collections, a React 18 interface, five vitest suites and a verify.sh that runs the whole thing. Your job is the written hand-off, not the code.

The shipped repository layout is fixed:
- server/ (app.js factory, routes/, services/, middleware/auth.js, db.js)
- database/ (migrations/001_init.sql, migrate.js, seed.js)
- src/ (api.js, auth.jsx, schema.js, App.jsx, components/, pages/)
- tests/, verify.sh, README.md, MANIFEST.md, TECHNICAL_GUIDE.md, USER_GUIDE.md, AGENT_ORDERS.md

IP-SEED:
${JSON.stringify({ title: seed.title, gap: seed.gap, solution: seed.solution, blueprint: seed.blueprint, mini_plan: seed.mini_plan })}

Produce:
- repo_name — kebab-case, 2 to 4 words, derived from the seed's title.
- onboarding_guide — 300 to 450 words for the developer taking this repository over. Name the seed's differentiating capability, the collection that carries it, and the directory it belongs in. Never invent a file name: the only files that exist are the ones in the layout above, so to point at work still to be done name its directory and say it is to be added. Say where the baseline schema has to grow to hold the real business rules, and the two or three extension points that matter.
- user_manual — 200 to 300 words for the operator: what the product does, the primary workflow, and the differentiating capability.
- ecosystem_interlocks — the cross-app synergy contract: name the shared Core Neural Layer (a common core/ package: shared DB client, shared auth/session model, shared event bus) that stays identical across sibling repos, then specify which sibling repos this app exchanges data or users with (${siblingList}) and how. 120 to 200 words.

No filler. No em dashes.`;

    const prose = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: PROSE_SCHEMA
    });

    const repoName = (prose?.repo_name || seed.title || 'asset').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'asset';

    await base44.entities.IpSeed.update(seedId, {
      status: 'built',
      repo_name: repoName,
      ecosystem_interlocks: prose?.ecosystem_interlocks || '',
      onboarding_guide: prose?.onboarding_guide || ''
    });

    return Response.json({
      repo_name: repoName,
      onboarding_guide: prose?.onboarding_guide || '',
      user_manual: prose?.user_manual || '',
      ecosystem_interlocks: prose?.ecosystem_interlocks || ''
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}