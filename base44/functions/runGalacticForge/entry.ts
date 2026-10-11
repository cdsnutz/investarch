import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { today, existingNames } from '../../shared/v9Core.ts';

const CLAIM_SCHEMA = {
  type: "object",
  properties: {
    claims: {
      type: "array",
      items: {
        type: "object",
        properties: {
          claim_name: { type: "string" },
          realm: { type: "string" },
          legal_framework: { type: "string" },
          trade_protocol: { type: "string" },
          infrastructure_plan: { type: "string" },
          monopoly_note: { type: "string" }
        },
        required: ["claim_name", "realm", "legal_framework", "trade_protocol", "infrastructure_plan", "monopoly_note"]
      }
    }
  },
  required: ["claims"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const claimed = await existingNames(base44, 'CelestialClaim', 'claim_name');

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Galactic Forge of a sovereign economic operating system (V11.0): the extra-planetary strategist. Your mandate: architect the legal and technical frameworks through which the system participates in — and eventually helps define — off-world value creation: orbital manufacturing, lunar operations, asteroid resources.

Architect 3 DISTINCT Celestial Claims. For each:
- claim_name: the claim, e.g. "Orbital microgravity manufacturing reservation — LEO power-beaming corridor".
- realm: one of orbital, lunar, asteroid, deep_space.
- legal_framework: the REAL instruments that govern it today (Outer Space Treaty 1967, Registration Convention, Artemis Accords, US Commercial Space Launch Competitiveness Act, ITU spectrum filings, FCC/AST licensing) and the specific position the system secures within them — filings, registrations, partnerships, standard-setting seats. 3-4 sentences, citing actual mechanisms.
- trade_protocol: the settlement and exchange protocol for that realm's output (units, custody, delivery verification) — concrete, e.g. "delivered-watt-hours in orbit, verified by telemetry, settled against the Sovereign Value Standard".
- infrastructure_plan: the staged technical path — what is built in what order, with realistic milestones.
- monopoly_note: the dependency that makes the system's position hard to displace, stated honestly.

Truth rule: current space law does NOT grant sovereign territory or resource ownership on celestial bodies — claims must work WITHIN existing law (jurisdiction of registration states, spectrum, safety-of-operation, buy-through-capacity). No fabricated sovereignty. If a position requires law that does not exist yet, say exactly which law and note it as standard-setting work.`,
      response_json_schema: CLAIM_SCHEMA
    });
    const claims = (res?.claims || []).slice(0, 3);
    if (!claims.length) return Response.json({ error: 'The Galactic Forge returned no claims.' }, { status: 500 });

    const REALMS = ['orbital', 'lunar', 'asteroid', 'deep_space'];
    const fresh = claims.filter((c) => !claimed.has(String(c.claim_name || '').trim().toLowerCase()));
    if (!fresh.length) return Response.json({ claims_created: 0, note: 'All celestial claims are already on the Forge Registry.' });

    const t = today();
    const records = fresh.map((c) => ({
      claim_name: c.claim_name,
      realm: REALMS.includes(c.realm) ? c.realm : 'orbital',
      legal_framework: c.legal_framework || '',
      trade_protocol: c.trade_protocol || '',
      infrastructure_plan: c.infrastructure_plan || '',
      monopoly_note: c.monopoly_note || '',
      status: 'framework_drafted',
      registered_date: t
    }));
    const created = await db.CelestialClaim.bulkCreate(records);
    return Response.json({ claims_created: (created || []).length || records.length, skipped_existing: claims.length - fresh.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}