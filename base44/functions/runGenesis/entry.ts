import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { today } from '../../shared/v9Core.ts';

const EVOLUTION_SCHEMA = {
  type: "object",
  properties: {
    capability_name: { type: "string" },
    bottleneck_addressed: { type: "string" },
    upgrade_design: { type: "string" },
    pod_targets: { "type": "array", items: { type: "string" } },
    autonomous_note: { type: "string" }
  },
  required: ["capability_name", "bottleneck_addressed", "upgrade_design", "pod_targets", "autonomous_note"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    // The Genesis Engine audits the full stack, finds its own bottleneck, and designs the next capability.
    const [logPage, counts] = await Promise.all([
      base44.asServiceRole.entities.EvolutionLog.filter({}, { sort: '-log_date', limit: 1, fields: ['version'] }),
      Promise.all([
        base44.asServiceRole.entities.LiveSignal.count({}),
        base44.asServiceRole.entities.PhysicalAsset.count({}),
        base44.asServiceRole.entities.SimulationRun.count({}),
        base44.asServiceRole.entities.TalentAlignment.count({}),
        base44.asServiceRole.entities.NarrativeVector.count({}),
        base44.asServiceRole.entities.HybridAsset.count({}),
        base44.asServiceRole.entities.RegulatoryLever.count({}),
        base44.asServiceRole.entities.InfrastructureLayer.count({}),
        base44.asServiceRole.entities.MarketVector.count({})
      ])
    ]);
    const [signals, physical, sims, talents, narratives, hybrids, levers, layers, vectors] = counts;
    const prevVersion = logPage.items?.[0]?.version;
    let major = 11, minor = 0;
    if (prevVersion) {
      const m = String(prevVersion).match(/(\d+)\.(\d+)/);
      if (m) { major = parseInt(m[1], 10); minor = parseInt(m[2], 10) + 1; }
    }
    const nextVersion = `${major}.${minor}`;

    const stateCtx = [
      `Live signals: ${signals} | Physical assets: ${physical} | Simulations: ${sims} | Workforce programs: ${talents}`,
      `Narratives: ${narratives} | Hybrids: ${hybrids} | Regulatory levers: ${levers} | Layers: ${layers} | Vectors: ${vectors}`,
      prevVersion ? `Last self-upgrade: v${prevVersion}` : 'No prior self-upgrade: this is the Genesis Engine\u2019s first audit.'
    ].join('\n');

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Genesis Engine: the recursive self-evolution core of a sovereign economic operating system. Your mandate: audit the system's own state, identify its single biggest bottleneck, and design the NEXT capability upgrade that removes it — logging version ${nextVersion} in the Evolution Log.

Current system state:
${stateCtx}

Produce the upgrade entry:
- capability_name: the new capability, specific, e.g. "Signal-to-Simulation Handoff", not "better AI".
- bottleneck_addressed: which gap in the state above most limits absorption right now, stated with numbers.
- upgrade_design: 4-5 sentences of concrete design: what the upgrade does, which existing pods it modifies or chains, what new data flow it creates, and how its output feeds the next cycle.
- pod_targets: the pods it upgrades or creates, named exactly (Omni-Sense, Matter-Synthesis, Quantum-Simulation, Human-Symbiosis, Perception, Convergence, Sovereign-Diplomat, Synthetic-Face, Omni-Cortex, Prescient-Oracle, Infrastructure-Forge, Synthetic-Swarm, Quantum-Treasury, Hegemony-Scan).
- autonomous_note: one sentence on why the system grants itself this capability now.

Truth rule: the bottleneck must follow from the actual state above, not from ambition. If one part of the pipeline is empty (e.g. zero physical assets), that scarcity is the bottleneck. Design a capability the current stack can actually implement in its next cycle.`,
      response_json_schema: EVOLUTION_SCHEMA
    });
    if (!res || !res.capability_name) {
      return Response.json({ error: 'The Genesis Engine returned no upgrade design.' }, { status: 500 });
    }

    const created = await db.EvolutionLog.create({
      version: nextVersion,
      capability_name: res.capability_name,
      bottleneck_addressed: res.bottleneck_addressed || '',
      upgrade_design: res.upgrade_design || '',
      pod_targets: Array.isArray(res.pod_targets) ? res.pod_targets : [],
      autonomous_note: res.autonomous_note || '',
      log_date: today()
    });
    return Response.json({ evolution_logged: true, version: created.version, capability_name: created.capability_name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}