import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { today, norm } from '../../shared/v9Core.ts';

const CONSTANT_SCHEMA = {
  type: "object",
  properties: {
    constant_name: { type: "string" },
    axiom_text: { type: "string" },
    solves_for: { type: "string" },
    efficiency_note: { type: "string" },
    self_correction_note: { type: "string" }
  },
  required: ["constant_name", "axiom_text", "solves_for", "efficiency_note", "self_correction_note"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const [logPage, priorPage, simPage] = await Promise.all([
      base44.asServiceRole.entities.EvolutionLog.filter({}, { sort: '-log_date', limit: 5, fields: ['capability_name', 'bottleneck_addressed', 'upgrade_design'] }),
      base44.asServiceRole.entities.LogicConstant.filter({}, { sort: '-defined_date', limit: 1 }),
      base44.asServiceRole.entities.SimulationRun.filter({}, { sort: '-simulated_date', limit: 5, fields: ['subject_name', 'success_probability', 'optimal_path'] })
    ]);

    const prior = priorPage.items?.[0];
    const logCtx = (logPage.items || []).map((l) => `- ${l.capability_name}: addressed "${l.bottleneck_addressed}" via ${l.upgrade_design}`).join('\n');
    const simCtx = (simPage.items || []).map((s) => `- ${s.subject_name}: optimal path at ${s.success_probability}% success`).join('\n');

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Omega-Code: the pure logic core of a sovereign economic operating system (V11.0). Your mandate: distill the system's accumulated evolution log and simulation telemetry into ONE self-correcting logic constant — the equation the whole engine optimizes, refined each cycle so the engine needs less external input over time.

EVOLUTION LOG (what the system just learned to do):
${logCtx || '- (no evolution logged yet)'}

SIMULATION TELEMETRY (latest optimal paths):
${simCtx || '- (no simulations run yet)'}

${prior ? `CURRENT CONSTANT (v${prior.version}): "${prior.constant_name}" — ${prior.axiom_text} It solves for: ${prior.solves_for}. Supersede it: refine the constant so it subsumes the old one, tighter and more complete.` : 'No constant exists yet: derive the founding logic constant.'}

Produce:
- constant_name: the name of this refinement of the constant.
- axiom_text: the constant expressed as a compact formal statement or equation — the objective the whole engine optimizes. Precise, no mysticism.
- solves_for: what the constant solves for, in one sentence.
- efficiency_note: which external input this refinement eliminates or reduces (what the engine needed from outside before that it now derives itself).
- self_correction_note: how the constant detects its own degradation (which telemetry it watches) and repairs itself (what it re-derives and when).

Truth rule: the constant must be derivable from the logged capabilities and simulation telemetry above — it consolidates what the system actually does, it does not invent capabilities that don't exist.`,
      response_json_schema: CONSTANT_SCHEMA
    });
    if (!res || !res.axiom_text) return Response.json({ error: 'The Omega-Code returned no constant.' }, { status: 500 });

    const priorNum = prior && /^Ω-(\d+)$/.test(String(prior.version || '').trim()) ? parseInt(String(prior.version).trim().slice(2), 10) : 0;
    const version = `Ω-${priorNum + 1}`;

    await db.LogicConstant.create({
      constant_name: res.constant_name || `Axiom Constant ${version}`,
      axiom_text: res.axiom_text,
      solves_for: res.solves_for || '',
      efficiency_note: res.efficiency_note || '',
      self_correction_note: res.self_correction_note || '',
      supersedes: prior ? prior.constant_name : 'none',
      version,
      defined_date: today()
    });
    return Response.json({ constant_defined: true, version, constant_name: res.constant_name, supersedes: prior ? prior.version : 'none' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}