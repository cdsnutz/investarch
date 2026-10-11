import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const PATENT_SCHEMA = {
  type: "object",
  properties: {
    abstract: { type: "string" },
    claims: { type: "string" },
    detailed_description: { type: "string" },
    prior_art_note: { type: "string" }
  },
  required: ["abstract", "claims", "detailed_description", "prior_art_note"]
};

const TRADEMARK_SCHEMA = {
  type: "object",
  properties: {
    brand_name: { type: "string" },
    trademark_classes: { type: "string" },
    logo_concepts: { type: "string" },
    clearance_note: { type: "string" }
  },
  required: ["brand_name", "trademark_classes", "logo_concepts", "clearance_note"]
};

const DEED_SCHEMA = {
  type: "object",
  properties: {
    deed_text: { type: "string" }
  },
  required: ["deed_text"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const seedId = (body?.seedId || '').trim();
    const filingType = (body?.filingType || '').trim();
    if (!seedId || !['patent', 'trademark', 'deed'].includes(filingType)) {
      return Response.json({ error: 'seedId and a valid filingType (patent, trademark, deed) are required.' }, { status: 400 });
    }

    const seed = await base44.entities.IpSeed.get(seedId);
    if (!seed) return Response.json({ error: 'Seed not found.' }, { status: 404 });

    const context = `IP-SEED:\nTitle: ${seed.title}\nMarket gap: ${seed.gap}\nTechnical solution: ${seed.solution}\nBlueprint: ${JSON.stringify(seed.blueprint || {})}`;

    let filing = null;
    if (filingType === 'patent') {
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a registered patent attorney drafting a utility patent application. Write to MAXIMIZE THE SCOPE OF PROTECTION: the claims are the fence a competitor cannot jump.

${context}

Produce:
1. abstract — under 150 words, formal patent register.
2. claims — the heart of the document. Numbered: 2 to 4 INDEPENDENT claims (method, system, and computer-readable-medium form) written broadly enough to cover variations, then 6 to 10 DEPENDENT claims narrowing onto the specific mechanisms from the blueprint (each adding one concrete limiting element). Use precise legal language ("comprising", "configured to", "wherein"). Never describe the invention as "an idea" or "a concept".
3. detailed_description — enablement-grade description (400 to 600 words): architecture, data flow, and operation of each claim element so a person of ordinary skill could implement it.
4. prior_art_note — the closest known prior art by category (not fabricated citations), and how the claims distinguish over it.

Draft as DRAFT LEGAL WORK PRODUCT for attorney review. Institutional tone, zero filler.`,
        response_json_schema: PATENT_SCHEMA
      });
      filing = res;
    } else if (filingType === 'trademark') {
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a trademark counsel preparing a filing packet for the brand behind this IP-seed.

${context}

Produce:
1. brand_name — one primary mark (and two alternates listed after a colon) with coined or suggestive character strong enough to register.
2. trademark_classes — the specific Nice Classification classes (numbers plus class names) covering the product and its software services, with one line each on why the class applies.
3. logo_concepts — 3 logo concepts described precisely enough to hand a designer (geometry, weight, treatment).
4. clearance_note — the clearance protocol: which registries to search (USPTO TESS, EUIPO, WIPO Global Brand Database), common-law use risks, and the likelihood-of-confusion standard applied to this mark. State plainly that this is a draft packet, not a filed registration.

Institutional tone, zero filler.`,
        response_json_schema: TRADEMARK_SCHEMA
      });
      filing = res;
    } else {
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are legal counsel drafting an IP DEED OF OWNERSHIP memorializing assignment of the rights in this IP-seed to the holding entity.

${context}

Produce deed_text — a formal deed (500 to 700 words) with: parties (Assignor: the creator; Assignee: the holding entity, both as placeholders like [ASSIGNOR NAME]), recitals establishing creation and the market gap, operative words of conveyance ("grant, bargain, sell, assign, and transfer"), the granted property (copyright, trade secret, know-how, and pending patent rights in the described invention), warranties of title and non-infringement, severability, governing law placeholder, and execution blocks. Use precise legal terminology throughout. Mark clearly: DRAFT LEGAL WORK PRODUCT for attorney review.`,
        response_json_schema: DEED_SCHEMA
      });
      filing = res;
    }
    if (!filing) return Response.json({ error: 'Registrar returned no document.' }, { status: 502 });

    const record = { seed_id: seedId, filing_type: filingType };
    if (filingType === 'patent') {
      record.abstract = filing.abstract;
      record.claims = filing.claims;
      record.detailed_description = filing.detailed_description;
      record.prior_art_note = filing.prior_art_note;
    } else if (filingType === 'trademark') {
      record.brand_name = filing.brand_name;
      record.trademark_classes = filing.trademark_classes;
      record.logo_concepts = filing.logo_concepts;
      record.clearance_note = filing.clearance_note;
    } else {
      record.deed_text = filing.deed_text;
    }
    const created = await base44.entities.IpFiling.create(record);
    return Response.json({ filing: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}