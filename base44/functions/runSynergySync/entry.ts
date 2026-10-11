import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { normTitle } from "../../shared/seedTargets.ts";

const TRIGGERS_SCHEMA = {
  type: "object",
  properties: {
    triggers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          source_title: { type: "string" },
          target_title: { type: "string" },
          trigger_name: { type: "string" },
          message: { type: "string" },
          channel: { type: "string" }
        },
        required: ["source_title", "target_title", "trigger_name", "message", "channel"]
      }
    }
  },
  required: ["triggers"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    // Scheduled runs arrive without a user session; manual runs carry one.
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const builtPage = await base44.asServiceRole.entities.IpSeed.filter({ status: 'built' }, { sort: '-asymmetric_score', limit: 20 });
    const built = builtPage.items || [];
    if (built.length < 2) return Response.json({ triggers_created: 0, note: 'Synergy requires at least two built assets.' });

    const trigPage = await base44.asServiceRole.entities.SynergyTrigger.filter({}, { limit: 300, fields: ['source_seed_id'] });
    const covered = new Set((trigPage.items || []).map((t) => t.source_seed_id));
    const targets = built.filter((s) => s.ecosystem_interlocks && !covered.has(s.id)).slice(0, 3);
    if (!targets.length) return Response.json({ triggers_created: 0, note: 'Every built asset is already cross-pollinated.' });

    const siblings = built.map((s) => s.title).join(', ');
    const prompt = `You are the Synergy-Core of a sovereign IP conglomerate: the ecosystem glue. The conglomerate owns several deployed apps; users of one must be pulled into the others, forming a closed-loop economy they never leave.

For EACH source app below, read its cross-app synergy contract (ecosystem_interlocks) and produce EXACTLY 2 cross-pollination upsell triggers aimed at its sibling apps (${siblings}):

1. source_title — copy the source app's title exactly.
2. target_title — the sibling app the user is pulled toward (copy its title exactly).
3. trigger_name — the in-product moment that fires this (e.g. "first successful export", "third week of active use").
4. message — the upsell notification copy the user sees: one specific sentence connecting the moment to the sibling app's value. No hype adjectives.
5. channel — "in_app", "email", or "push".

SOURCE APPS:
${JSON.stringify(targets.map((s) => ({ id: s.id, title: s.title, solution: s.solution, ecosystem_interlocks: s.ecosystem_interlocks })))}`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: TRIGGERS_SCHEMA
    });
    const triggers = (res?.triggers || []).slice(0, targets.length * 2);
    if (!triggers.length) return Response.json({ error: 'Synergy-Core returned no triggers.' }, { status: 502 });

    const byTitle = new Map(targets.map((t) => [normTitle(t.title), t.id]));
    const records = triggers
      .map((t) => ({
        source_seed_id: byTitle.get(normTitle(t.source_title)) || '',
        target_seed_id: (built.find((s) => normTitle(s.title) === normTitle(t.target_title)) || {}).id || '',
        trigger_name: t.trigger_name || '',
        message: t.message || '',
        channel: t.channel || 'in_app'
      }))
      .filter((r) => r.source_seed_id);
    if (!records.length) return Response.json({ error: 'Synergy triggers did not match any asset.' }, { status: 502 });

    const created = await db.SynergyTrigger.bulkCreate(records);
    return Response.json({ triggers_created: (created || []).length || records.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}