import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const CODEBASE_SCHEMA = {
  type: "object",
  properties: {
    repo_name: { type: "string" },
    files: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" }
        },
        required: ["path", "content"]
      }
    },
    onboarding_guide: { type: "string" },
    user_manual: { type: "string" },
    ecosystem_interlocks: { type: "string" }
  },
  required: ["repo_name", "files", "onboarding_guide", "user_manual", "ecosystem_interlocks"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const seedId = (body?.seedId || '').trim();
    if (!seedId) return Response.json({ error: 'seedId is required.' }, { status: 400 });

    const seed = await base44.entities.IpSeed.get(seedId);
    if (!seed) return Response.json({ error: 'Seed not found.' }, { status: 404 });

    // Omni-build: sibling repos for cross-app synergy
    const siblings = await base44.entities.IpSeed.filter({ status: 'built' }, { limit: 20, fields: ['title', 'repo_name'] });
    const siblingList = (siblings.items || []).filter((s) => s.id !== seedId).map((s) => `${s.title} (${s.repo_name || 'unnamed'})`).join('; ') || 'none yet';

    const prompt = `You are the Architect of an IP Factory: you convert an IP-seed into a TANGIBLE, EXPORTABLE ASSET — a working full-stack monorepo skeleton.

IP-SEED:
${JSON.stringify({ title: seed.title, gap: seed.gap, solution: seed.solution, blueprint: seed.blueprint, mini_plan: seed.mini_plan })}

Produce a monorepo: docker-compose.yml, .env.template, root README.md, package.json, a frontend (React-style components), a backend API (Node/Express-style), and database schema/migrations.
Output files: 8 to 12 files covering: infra configs, root README with real setup steps, 2 to 3 frontend files implementing the seed's core UX, 2 to 3 backend files implementing the seed's core_logic from the blueprint, 1 to 2 database files materializing the blueprint's db_schema.
Rules: every file must be internally consistent (imports resolve, ports and env names align). Code must implement the seed's DIFFERENTIATED logic, not a generic CRUD shell. Keep each file focused and under 100 lines. No placeholders like "// TODO" — write real code.

Also produce:
- onboarding_guide — 300 to 450 words for a developer taking over this repository: architecture map, env setup, how the core logic module works, extension points.
- user_manual — 200 to 300 words explaining the product to an operator: what it does, the primary workflow, and the differentiating capability.
- ecosystem_interlocks — the cross-app synergy contract: name the shared "Core Neural Layer" (a common core/ package: shared DB client, shared auth/session model, shared event bus) that must stay identical across sibling repos so the ecosystem interlocks, then specify which sibling repos this app exchanges data or users with (${siblingList}) and how, so owning one app creates pull toward the others. 120 to 200 words. No filler.`;

    const codebase = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: CODEBASE_SCHEMA
    });
    if (!codebase?.files?.length) return Response.json({ error: 'Architect returned no files.' }, { status: 502 });

    await base44.entities.IpSeed.update(seedId, { status: 'built', repo_name: codebase.repo_name, ecosystem_interlocks: codebase.ecosystem_interlocks || '' });
    return Response.json(codebase);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}