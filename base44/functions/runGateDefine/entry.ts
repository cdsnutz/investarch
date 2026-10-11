import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { today, existingNames } from '../../shared/v9Core.ts';

const GATE_SCHEMA = {
  type: "object",
  properties: {
    gates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          gate_name: { type: "string" },
          scope: { type: "string" },
          rule_text: { type: "string" },
          metric_key: { type: "string" },
          comparator: { type: "string" },
          threshold: { type: "number" },
          threshold_upper: { type: "number" },
          action: { type: "string" }
        },
        required: ["gate_name", "scope", "rule_text", "metric_key", "comparator", "threshold", "action"]
      }
    }
  },
  required: ["gates"]
};

const METRIC_KEYS = ['toll_config_coverage', 'value_flow_stall', 'axiom_index_coverage', 'sim_probability_sum', 'anchor_progress_max', 'imprint_disclosure_coverage', 'claim_legal_coverage', 'signal_confidence_min', 'ledger_duplication'];
const COMPARATORS = ['gte', 'lte', 'between'];
const SCOPES = ['value_flow', 'temporal', 'consciousness', 'forge', 'simulation', 'axiom'];
const ACTIONS = ['observe', 'flag', 'block'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const claimed = await existingNames(base44, 'LogicGate', 'gate_name');

    const axiomPage = await base44.asServiceRole.entities.ValueAxiom.filter({}, { sort: '-revaluation_date', limit: 1, fields: ['metric_name', 'definition', 'unit'] });
    const axiom = axiomPage.items?.[0];
    const axiomCtx = axiom
      ? `THE CURRENT AXIOM: metric "${axiom.metric_name}" (${axiom.unit}). ${axiom.definition} Every gate must enforce the flow of value as measured by this standard.`
      : 'No axiom standard defined yet: derive gates that protect the ledger from first principles (toll configuration, value flow, legal grounding, simulation coherence).';

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Gate-Architect of a sovereign economic operating system (V11.0): the Axiom Logic Gates layer. Your mandate: convert the Synthetic Value Standard into enforceable market rules — logic gates that validate value flow across every registry of the platform and are evaluated automatically each cycle.

${axiomCtx}

MEASURABLE METRICS (a gate may use ONLY these metric keys — each is computed from live platform data):
- toll_config_coverage: % of live infrastructure layers with a configured toll rate (use gte; threshold typically 80)
- value_flow_stall: count of live layers recording zero toll revenue (use lte; threshold 0)
- axiom_index_coverage: % of the top ledger assets indexed against the Value Standard (use gte; threshold typically 75)
- sim_probability_sum: probability sum of the latest simulation branch set (use between; thresholds 90 and 110)
- anchor_progress_max: highest steering progress on the Temporal Map (use lte; threshold 100)
- imprint_disclosure_coverage: % of archetypal imprints carrying a disclosure (use gte; threshold 100)
- claim_legal_coverage: % of celestial claims citing a real legal framework (use gte; threshold 100)
- signal_confidence_min: minimum confidence on the live value-stream (use gte; threshold 5)
- ledger_duplication: duplicate signal names on the stream (use lte; threshold 0)

Define 6-8 gates. For each:
- gate_name: short rule name, e.g. "Toll Configuration Integrity".
- scope: one of value_flow, temporal, consciousness, forge, simulation, axiom — match the metric.
- rule_text: the market rule in plain terms, tied to the axiom — 1-2 sentences stating what must hold and why the axiom requires it.
- metric_key, comparator, threshold: ONLY from the catalog above; threshold_upper only for between.
- action: observe (log only), flag (record a violation), or block (hard rule — reserve for integrity rules like ledger duplication and zero-revenue stalls).

Truth rule: never invent a metric outside the catalog, never set a threshold the platform cannot satisfy today without saying so in the rule text.`,
      response_json_schema: GATE_SCHEMA
    });
    const gates = (res?.gates || []).filter((g) =>
      METRIC_KEYS.includes(g.metric_key) &&
      COMPARATORS.includes(g.comparator) &&
      SCOPES.includes(g.scope) &&
      ACTIONS.includes(g.action) &&
      typeof g.threshold === 'number'
    ).slice(0, 8);
    if (!gates.length) return Response.json({ error: 'The Gate-Architect returned no valid gates.' }, { status: 500 });

    const fresh = gates.filter((g) => !claimed.has(String(g.gate_name || '').trim().toLowerCase()));
    if (!fresh.length) return Response.json({ gates_created: 0, note: 'All proposed gates are already on the rule book.' });

    const t = today();
    const records = fresh.map((g) => ({
      gate_name: g.gate_name,
      scope: g.scope,
      rule_text: g.rule_text || '',
      metric_key: g.metric_key,
      comparator: g.comparator,
      threshold: g.threshold,
      threshold_upper: typeof g.threshold_upper === 'number' ? g.threshold_upper : undefined,
      action: g.action,
      status: 'active',
      enforcement_count: 0,
      defined_date: t
    }));
    const created = await db.LogicGate.bulkCreate(records);
    return Response.json({ gates_created: (created || []).length || records.length, skipped_existing: gates.length - fresh.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}