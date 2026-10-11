import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { pickSeedTargets, normTitle } from "../../shared/seedTargets.ts";

const KIT_SCHEMA = {
  type: "object",
  properties: {
    kits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          seed_title: { type: "string" },
          platform: { type: "string" },
          configs: {
            type: "array",
            items: {
              type: "object",
              properties: { path: { type: "string" }, content: { type: "string" } },
              required: ["path", "content"]
            }
          },
          dns_checklist: { type: "array", items: { type: "string" } },
          env_template: { type: "string" },
          launch_note: { type: "string" }
        },
        required: ["seed_title", "platform", "configs", "dns_checklist", "env_template", "launch_note"]
      }
    }
  },
  required: ["kits"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const db = base44.entities;

    const body = await req.json().catch(() => ({}));
    const targets = await pickSeedTargets(base44, 'Deployment', (body?.seedId || '').trim(), 3, { status: 'built' });
    if (!targets.length) return Response.json({ kits_created: 0, note: 'No built assets awaiting a deployment kit.' });

    const prompt = `You are the deployment engine inside InvestArch. For each built asset below, produce a ZERO-TOUCH DEPLOYMENT KIT — the exact infrastructure package an engineer (or a CI pipeline) applies to push the repo live.

For EACH asset:
1. seed_title — copy the asset's title exactly.
2. platform — the best-fit platform for this asset: Vercel, Railway, or Fly.io, with a one-clause reason.
3. configs — 4 to 6 deployment files as {path, content}: platform config (e.g. vercel.json / railway.toml / fly.toml), a Dockerfile where useful, a CI deploy script (.github/workflows/deploy.yml), and a healthcheck script. Real content, internally consistent: ports, env names, and build commands must match the asset's stack.
4. dns_checklist — 4 to 6 ordered steps: domain registration or connection, A/CNAME records, SSL issuance, database provisioning, first-deploy verification.
5. env_template — the production .env keys (names plus a safe placeholder each, never real secrets).
6. launch_note — 2 sentences: the deploy command sequence and the post-deploy smoke test.

ASSETS:
${JSON.stringify(targets.map((s) => ({ id: s.id, title: s.title, solution: s.solution, blueprint: s.blueprint, repo_name: s.repo_name, ecosystem_interlocks: s.ecosystem_interlocks })))}

Real config syntax only. No placeholders like "TODO". Every line carries utility.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: KIT_SCHEMA
    });
    const kits = (res?.kits || []).slice(0, targets.length);
    if (!kits.length) return Response.json({ error: 'Deployment Pod returned no kits.' }, { status: 502 });

    const byTitle = new Map(targets.map((t) => [normTitle(t.title), t.id]));
    const records = kits
      .map((k) => ({
        seed_id: byTitle.get(normTitle(k.seed_title)) || '',
        platform: k.platform || '',
        kit_configs: Array.isArray(k.configs) ? k.configs.slice(0, 8) : [],
        dns_checklist: Array.isArray(k.dns_checklist) ? k.dns_checklist : [],
        env_template: k.env_template || '',
        launch_note: k.launch_note || '',
        status: 'kit_ready',
        live_url: '',
        deployed_date: ''
      }))
      .filter((r) => r.seed_id);
    if (!records.length) return Response.json({ error: 'Deployment kits did not match any asset.' }, { status: 502 });

    const created = await db.Deployment.bulkCreate(records);
    return Response.json({ kits_created: (created || []).length || records.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}