import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { today } from '../../shared/v9Core.ts';

const SIM_SCHEMA = {
  type: "object",
  properties: {
    subject_name: { type: "string" },
    subject_type: { type: "string" },
    scenario_count: { type: "number" },
    scenarios: {
      type: "array",
      items: {
        type: "object",
        properties: {
          scenario: { type: "string" },
          outcome: { type: "string" },
          probability: { type: "number" }
        },
        required: ["scenario", "outcome", "probability"]
      }
    },
    optimal_path: { type: "string" },
    success_probability: { type: "number" },
    failure_modes: { "type": "array", items: { type: "string" } }
  },
  required: ["subject_name", "subject_type", "scenario_count", "scenarios", "optimal_path", "success_probability", "failure_modes"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const db = base44.entities;

    // The probability engine picks the highest-conviction untested IP asset and stress-tests it.
    const [seedPage, simPage] = await Promise.all([
      base44.entities.IpSeed.filter({}, { sort: '-asymmetric_score', limit: 30, fields: ['title', 'solution', 'mini_plan', 'asymmetric_score', 'status', 'strategy'] }),
      base44.entities.SimulationRun.filter({}, { sort: '-simulated_date', limit: 100, fields: ['subject_name', 'simulated_date'] })
    ]);

    // Walk the ranked candidate list until an untested subject is found.
    const sim = new Set((simPage.items || []).map((r) => String(r.subject_name || '').trim().toLowerCase()));
    const isUntested = (name) => !sim.has(String(name || '').trim().toLowerCase());
    const seed = (seedPage.items || []).find((s) => isUntested(s.title));
    if (!seed) {
      return Response.json({ note: 'Every high-conviction IP asset has already been simulated. Run a new hunt to test more.' });
    }

    const subjectCtx = `Subject: IP asset "${seed.title}" (asymmetric score ${seed.asymmetric_score}/10, strategy: ${seed.strategy || 'hold'}, build status: ${seed.status}). Approach: ${seed.solution} Business case: ${seed.mini_plan}`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the probability engine inside InvestArch: the stress-testing unit that makes every investment dossier defensible. Your mandate: stress-test ONE asset against the full adversarial landscape — competitor countermoves, regulatory shocks, macro crashes, adoption stalls — and return the Optimal Path.

${subjectCtx}

Run 16 DISTINCT simulation branches. For each:
- scenario: the named adverse or favorable branch, e.g. "A well-funded incumbent clones the core product in 90 days", "Regulator freezes the category for 12 months", "Adoption outpaces supply".
- outcome: what happens to the asset in that branch, in 1-2 sentences.
- probability: 0-100, your honest estimate. Convergence rule: the sixteen probabilities must partition the outcome space (sum between 90 and 110), no branch claiming >40%, and the set must include at least two competitor-countermove branches, at least one macro-crash branch, and at least one black-swan branch.

Then produce:
- optimal_path: the single execution sequence that maximizes success across the branches — 3-4 concrete moves in order, each referencing which branches it neutralizes.
- success_probability: 0-100, computed as the probability-weighted share of branches whose outcome is favorable under the optimal path (sum the probabilities of surviving branches); never above the best single-branch probability.
- failure_modes: 3-4 ways the optimal path itself fails, stated plainly.

Truth rule: these are structured expert simulations, not measured parallel universes. Probabilities are reasoned estimates; where the model is weakest, widen the failure_modes and lower the probabilities. Never round up to please.`,
      response_json_schema: SIM_SCHEMA
    });
    if (!res || !Array.isArray(res.scenarios) || !res.scenarios.length) {
      return Response.json({ error: 'The probability engine returned no scenarios.' }, { status: 500 });
    }

    const raw = res.scenarios.slice(0, 16).map((s) => ({
      scenario: s.scenario || '',
      outcome: s.outcome || '',
      probability: typeof s.probability === 'number' ? Math.max(0, s.probability) : 0
    }));
    // Convergence pass: the branch probabilities must partition the outcome space.
    // Normalize deterministically to sum exactly 100 (the convergence gate's 90-110 band, tightened to 100).
    const rawSum = raw.reduce((acc, b) => acc + b.probability, 0);
    let branches;
    if (rawSum <= 0) {
      const even = Math.floor((100 / raw.length) * 10) / 10;
      branches = raw.map((b) => ({ ...b, probability: even }));
    } else {
      branches = raw.map((b) => ({
        ...b,
        probability: Math.round((b.probability / rawSum) * 1000) / 10
      }));
      const drift = Math.round((100 - branches.reduce((acc, b) => acc + b.probability, 0)) * 10) / 10;
      if (drift !== 0 && branches.length) branches[0].probability = Math.round((branches[0].probability + drift) * 10) / 10;
    }
    const created = await db.SimulationRun.create({
      subject_name: res.subject_name || seed.title,
      subject_type: 'seed',
      scenario_count: branches.length,
      scenarios: branches,
      optimal_path: res.optimal_path || '',
      success_probability: typeof res.success_probability === 'number' ? res.success_probability : 0,
      failure_modes: Array.isArray(res.failure_modes) ? res.failure_modes : [],
      simulated_date: today()
    });
    return Response.json({ simulation_created: true, subject: created.subject_name, success_probability: created.success_probability, branches: created.scenario_count });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}