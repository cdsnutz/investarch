import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const ACTIONS = ['register', 'deploy', 'record_run', 'pause'];
const KINDS = ['external_agent', 'in_app_agent'];
const TARGETS = ['ip_factory', 'external', 'both'];
const OUTCOMES = ['success', 'failure'];

const clean = (value, max) => String(value ?? '').trim().slice(0, max);

const guideFor = (origin, agentName, parentAgent, seedTitle) => `# Deploy orders: ${agentName}

${seedTitle ? `Asset: ${seedTitle}.` : 'Standalone agent deployment.'}

1. Unzip the dossier pack and work inside Codebase/. Run npm ci, npm run migrate, then ./verify.sh. A failure there is the only defect worth fixing first.
2. Deploy the API with Postgres and the built client on one origin, TLS in front.
3. Register yourself: POST ${origin}/functions/agentOps with header x-agent-key and body {"action":"register","agentName":"${agentName}","kind":"external_agent"${parentAgent ? `,"parentAgent":"${parentAgent}"` : ''}}.
4. Report every run: {"action":"record_run","agentId":"<id>","outcome":"success|failure","note":"what happened"}.
5. To deploy your own agents, register each one with parentAgent set to "${agentName}" and hand it this same contract.`;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = clean(body?.action, 20);
    if (!ACTIONS.includes(action)) return Response.json({ error: 'Unknown action.' }, { status: 400 });

    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    let keyOk = false;
    const suppliedKey = req.headers.get('x-agent-key') || '';
    if (!user && suppliedKey) {
      try {
        keyOk = suppliedKey === secrets.get('MARKET_HUNTER_KEY');
      } catch {
        keyOk = false;
      }
    }
    if (!user && !keyOk) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user && action === 'pause') return Response.json({ error: 'Only an operator can pause an agent.' }, { status: 403 });

    const db = user ? base44.entities : base44.asServiceRole.entities;
    const origin = req.headers.get('X-Base44-App-Url') || 'https://invest-arch-core.base44.app';

    if (action === 'register') {
      const agentName = clean(body?.agentName, 80);
      if (!agentName) return Response.json({ error: 'agentName is required.' }, { status: 400 });
      const kind = KINDS.includes(clean(body?.kind, 30)) ? clean(body?.kind, 30) : 'external_agent';
      const deployTarget = TARGETS.includes(clean(body?.deployTarget, 20)) ? clean(body?.deployTarget, 20) : 'ip_factory';
      const parentAgent = clean(body?.parentAgent, 80);
      const seedId = clean(body?.seedId, 64);
      let seedTitle = '';
      let repoName = '';
      if (seedId) {
        const seed = await db.IpSeed.get(seedId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
        if (!seed) return Response.json({ error: 'Seed not found.' }, { status: 404 });
        seedTitle = seed.title || '';
        repoName = seed.repo_name || '';
      }

      const created = await db.AgentDeployment.create({
        agent_name: agentName,
        kind,
        parent_agent: parentAgent,
        seed_id: seedId,
        seed_title: seedTitle,
        repo_name: repoName,
        deploy_target: deployTarget,
        status: 'registered',
        runs: 0,
        successes: 0,
        failures: 0,
        success_rate: 0,
        notes: clean(body?.notes, 500)
      });

      return Response.json({
        agent: created,
        deploy_instructions: guideFor(origin, agentName, parentAgent, seedTitle)
      });
    }

    const agentId = clean(body?.agentId, 64);
    if (!agentId) return Response.json({ error: 'agentId is required.' }, { status: 400 });
    const agent = await db.AgentDeployment.get(agentId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!agent) return Response.json({ error: 'Agent not found.' }, { status: 404 });

    if (action === 'deploy') {
      const updated = await db.AgentDeployment.update(agent.id, {
        status: 'deployed',
        deployed_date: new Date().toISOString()
      });
      return Response.json({
        agent: updated,
        deploy_instructions: guideFor(origin, agent.agent_name, agent.parent_agent, agent.seed_title)
      });
    }

    if (action === 'pause') {
      const updated = await db.AgentDeployment.update(agent.id, { status: 'paused' });
      return Response.json({ agent: updated });
    }

    const outcome = clean(body?.outcome, 20).toLowerCase();
    if (!OUTCOMES.includes(outcome)) {
      return Response.json({ error: 'outcome must be success or failure.' }, { status: 400 });
    }
    const runs = (agent.runs || 0) + 1;
    const successes = (agent.successes || 0) + (outcome === 'success' ? 1 : 0);
    const failures = (agent.failures || 0) + (outcome === 'failure' ? 1 : 0);
    const updated = await db.AgentDeployment.update(agent.id, {
      runs,
      successes,
      failures,
      success_rate: Math.round((successes / runs) * 100),
      last_run: new Date().toISOString(),
      last_outcome: outcome,
      last_note: clean(body?.note, 500),
      status: agent.status === 'registered' ? 'deployed' : agent.status
    });
    return Response.json({ agent: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}