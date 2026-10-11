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
    const db = user ? base44.entities : base44.asServiceRole.entities;

    // The Quantum-Simulation Pod picks the highest-stakes untested asset and stress-tests it.
    const [hybPage, narPage, simPage] = await Promise.all([
      base44.asServiceRole.entities.HybridAsset.filter({}, { sort: '-monopoly_score', limit: 1, fields: ['asset_name', 'sectors', 'synthesis_thesis', 'value_lock', 'monopoly_score'] }),
      base44.asServiceRole.entities.NarrativeVector.filter({}, { sort: '-adoption_forecast_pct', limit: 1, fields: ['narrative_name', 'narrative_thesis', 'adoption_forecast_pct'] }),
      base44.asServiceRole.entities.SimulationRun.filter({}, { sort: '-simulated_date', limit: 20, fields: ['subject_name', 'simulated_date'] })
    ]);

    const hybrid = hybPage.items?.[0];
    const narrative = narPage.items?.[0];
    if (!hybrid && !narrative) {
      return Response.json({ error: 'Nothing to simulate: no hybrid assets or narratives exist yet.' }, { status: 400 });
    }

    const subject = hybrid || narrative;
    const subjectType = hybrid ? 'hybrid' : 'narrative';
    const sim = new Set((simPage.items || []).map((r) => String(r.subject_name || '').trim().toLowerCase()));
    if (sim.has(String(subject.asset_name || subject.narrative_name || '').trim().toLowerCase())) {
      return Response.json({ note: `Highest-stakes subject "${subject.asset_name || subject.narrative_name}" was already simulated. Nothing new to test.` });
    }

    const subjectCtx = hybrid
      ? `Subject: hybrid super-asset "${hybrid.asset_name}" spanning [${(hybrid.sectors || []).join(', ')}]. Thesis: ${hybrid.synthesis_thesis} Value-lock: ${hybrid.value_lock} Monopoly score: ${hybrid.monopoly_score}.`
      : `Subject: narrative position "${narrative.narrative_name}". Thesis: ${narrative.narrative_thesis} 12-month forecast: ${narrative.adoption_forecast_pct}%.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Quantum-Simulation Pod of a sovereign economic operating system: a probability engine. Your mandate: stress-test ONE asset against the full adversarial landscape — competitor countermoves, regulatory shocks, macro crashes, adoption stalls — and return the Optimal Path.

${subjectCtx}

Run 8 DISTINCT simulation branches. For each:
- scenario: the named adverse or favorable branch, e.g. "A well-funded incumbent clones the core layer in 90 days", "Regulator freezes the category for 12 months", "Adoption outpaces supply".
- outcome: what happens to the subject in that branch, in 1-2 sentences.
- probability: 0-100, your honest estimate. The eight probabilities must be internally coherent (they should roughly partition the outcome space, no branch claiming >60%).

Then produce:
- optimal_path: the single execution sequence that maximizes success across the branches — 3-4 concrete moves in order, each referencing which branches it neutralizes.
- success_probability: 0-100, your honest overall estimate if the optimal path is executed; never above the best single-branch probability.
- failure_modes: 3-4 ways the optimal path itself fails, stated plainly.

Truth rule: these are structured expert simulations, not measured parallel universes. Probabilities are reasoned estimates; where the model is weakest, widen the failure_modes and lower the probabilities. Never round up to please.`,
      response_json_schema: SIM_SCHEMA
    });
    if (!res || !Array.isArray(res.scenarios) || !res.scenarios.length) {
      return Response.json({ error: 'The Quantum-Simulation Pod returned no scenarios.' }, { status: 500 });
    }

    const created = await db.SimulationRun.create({
      subject_name: res.subject_name || subject.asset_name || subject.narrative_name,
      subject_type: ['narrative', 'hybrid', 'layer', 'seed'].includes(res.subject_type) ? res.subject_type : subjectType,
      scenario_count: res.scenarios.length,
      scenarios: res.scenarios.slice(0, 10).map((s) => ({
        scenario: s.scenario || '',
        outcome: s.outcome || '',
        probability: typeof s.probability === 'number' ? s.probability : 0
      })),
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