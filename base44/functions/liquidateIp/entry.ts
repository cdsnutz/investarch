import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const PROSPECTUS_SCHEMA = {
  type: "object",
  properties: {
    targets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          rationale: { type: "string" }
        },
        required: ["name", "rationale"]
      }
    },
    prospectus: { type: "string" },
    offer_type: { type: "string" },
    offer_terms: { type: "string" },
    lead_contact: { type: "string" }
  },
  required: ["targets", "prospectus", "offer_type", "offer_terms", "lead_contact"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const seedId = (body?.seedId || '').trim();
    if (!seedId) return Response.json({ error: 'seedId is required.' }, { status: 400 });

    const seed = await base44.entities.IpSeed.get(seedId);
    if (!seed) return Response.json({ error: 'Seed not found.' }, { status: 404 });

    const prompt = `You are the Dealer of an IP Factory: you convert an IP-asset into a SALE. Identify the top 5 corporations that are either THREATENED by this IP (it attacks their core revenue) or ENHANCED by it (it completes their roadmap), then write the instrument that makes them move.

IP-ASSET:
${JSON.stringify({ title: seed.title, gap: seed.gap, solution: seed.solution, mini_plan: seed.mini_plan, blueprint: seed.blueprint || {}, asymmetric_score: seed.asymmetric_score })}

Produce:
1. targets — 5 real corporations, each with a rationale naming the specific product line, market position, or strategic pressure that makes them the right buyer. Truthful: if a target is speculative, say what the diligence would confirm.
2. prospectus — a high-pressure but factual sales prospectus (350 to 500 words): the asset, the market failure it monetizes, the defensive and offensive value to the buyer, the cost of ignoring it (freedom-to-operate risk), and the ask. Institutional tone; persuasion through specificity, never hyperbole.
3. offer_type — "licensing" or "acquisition" — whichever converts faster for this asset, with the reasoning embedded in offer_terms.
4. offer_terms — the concrete structure: for licensing, royalty base and rate band with exclusivity terms; for acquisition, an indicative price band with its valuation logic and what diligence the buyer gets. Every number labeled as an indicative opening position.
5. lead_contact — the contact channel for the LEAD target (targets[0]): its publicly listed corporate development / M&A contact, business development email, or main website URL. If no public channel is known, write exactly: "Contact via corporate development office. Verify on the target's official website." Do not invent personal names or private emails.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: PROSPECTUS_SCHEMA
    });
    if (!res?.prospectus) return Response.json({ error: 'Liquidation agent returned no prospectus.' }, { status: 502 });

    const record = {
      seed_id: seedId,
      targets: (res.targets || []).slice(0, 5),
      prospectus: res.prospectus,
      offer_type: res.offer_type === 'acquisition' ? 'acquisition' : 'licensing',
      offer_terms: res.offer_terms || '',
      lead_contact: res.lead_contact || 'Contact via corporate development office. Verify on the target\'s official website.'
    };
    const created = await base44.entities.IpProspectus.create(record);
    return Response.json({ prospectus: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}