import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { norm, today, existingNames } from '../../shared/v9Core.ts';

const PERSONA_SCHEMA = {
  type: "object",
  properties: {
    personas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          persona_name: { type: "string" },
          role_title: { type: "string" },
          niche: { "type": "string" },
          platform: { type: "string" },
          positioning: { type: "string" },
          content_pillars: { "type": "array", items: { type: "string" } },
          audience_estimate: { type: "number" },
          trust_note: { type: "string" }
        },
        required: ["persona_name", "role_title", "niche", "platform", "positioning", "content_pillars", "audience_estimate", "trust_note"]
      }
    }
  },
  required: ["personas"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const claimed = await existingNames(base44, 'SyntheticPersona', 'persona_name');

    // The Synthetic Face Pod designs transparent AI spokespeople for the empire's narratives.
    const narPage = await base44.asServiceRole.entities.NarrativeVector.filter({}, { sort: '-adoption_forecast_pct', limit: 10, fields: ['narrative_name', 'target_market', 'cultural_shift'] });
    const narCtx = (narPage.items || []).map((n) => `- ${n.narrative_name} [${n.target_market}]: ${n.cultural_shift}`).join('\n') || '- no narratives seeded yet';

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Synthetic Face Pod of a sovereign economic operating system: a virtual-talent director. Your mandate: design DISCLOSED AI brand personas (virtual analysts, hosts, educators) that publish under the empire's narratives and give the autonomous engine a recognizable, trustworthy public voice.

Live narrative positions:
${narCtx}

Design 2 DISTINCT personas. For each:
- persona_name: a credible byline name that is clearly fictional and does not match any real public figure.
- role_title: e.g. "Virtual Markets Analyst", "AI Policy Explainer".
- niche: the specific audience and subject matter, tied to one narrative above where possible.
- platform: the primary channel (newsletter, YouTube, LinkedIn, podcast, X).
- positioning: 2-3 sentences on the persona's editorial stance and why this voice builds durable trust in the niche.
- content_pillars: 3-4 recurring series or content formats.
- audience_estimate: your honest 12-month subscriber/follower estimate for a well-executed niche persona.
- trust_note: how the persona earns credibility: consistent sourcing, correction policy, transparent methodology.

Integrity rule: every persona is openly labeled as an AI (disclosure in bio and about page), never impersonates a real person, never fabricates credentials or data, and never publishes astroturf or undisclosed promotion. The trust advantage comes from honesty plus consistency, not from deception.`,
      response_json_schema: PERSONA_SCHEMA
    });
    const personas = (res?.personas || []).slice(0, 2);
    if (!personas.length) return Response.json({ error: 'The Synthetic Face Pod returned no personas.' }, { status: 500 });

    const fresh = personas.filter((p) => !claimed.has(norm(p.persona_name)));
    if (!fresh.length) return Response.json({ personas_created: 0, note: 'All persona designs are already in the Influence Ledger.' });

    const t = today();
    const records = fresh.map((p) => ({
      persona_name: p.persona_name,
      role_title: p.role_title || '',
      niche: p.niche || '',
      platform: p.platform || '',
      positioning: p.positioning || '',
      content_pillars: Array.isArray(p.content_pillars) ? p.content_pillars : [],
      audience_estimate: typeof p.audience_estimate === 'number' ? p.audience_estimate : 5000,
      trust_note: p.trust_note || '',
      disclosure: 'Disclosed AI persona',
      status: 'designed',
      designed_date: t
    }));
    const created = await db.SyntheticPersona.bulkCreate(records);
    return Response.json({ personas_created: (created || []).length || records.length, skipped_existing: personas.length - fresh.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}