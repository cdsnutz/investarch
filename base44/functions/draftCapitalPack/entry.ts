import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const SCHEMA = {
  type: 'object',
  properties: {
    grants: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          program: { type: 'string' },
          agency: { type: 'string' },
          url: { type: 'string' },
          award_range: { type: 'string' },
          deadline: { type: 'string' },
          eligibility: { type: 'string' },
          application: { type: 'string' }
        },
        required: ['program', 'agency', 'url', 'eligibility', 'application']
      }
    },
    loan_proposal: { type: 'string' }
  },
  required: ['grants', 'loan_proposal']
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { seedId } = await req.json();
    if (!seedId) return Response.json({ error: 'seedId is required.' }, { status: 400 });
    const seed = await base44.entities.IpSeed.get(seedId);
    if (!seed) return Response.json({ error: 'Seed not found.' }, { status: 404 });

    const context = `Title: ${seed.title}\nMarket gap: ${seed.gap}\nSolution: ${seed.solution}\nMini-plan: ${seed.mini_plan || ''}\nBlueprint: ${JSON.stringify(seed.blueprint || {})}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a capital-formation specialist. Using current web sources, prepare submission-ready funding documents for this venture.

${context}

1. grants — 3 to 4 REAL, currently operating grant programs this venture is eligible for (e.g. SBIR/STTR Phase I at the relevant agency, NSF, state economic-development programs). Only programs you can verify with an official URL; never invent a program. For each: program, agency, url (official), award_range, deadline (next known cycle or "rolling"), eligibility (the actual criteria and how this venture meets them), and application — the full completed narrative in markdown with "## " headings matching that program's required sections (e.g. for SBIR: Project Summary, Identification and Significance of the Innovation, Technical Objectives, Work Plan, Commercialization Strategy, Key Personnel, Budget Justification). Use [PLACEHOLDER] only for facts only the applicant knows (EIN, UEI/SAM number, names, addresses).

2. loan_proposal — a complete small business loan proposal for a commercial bank / SBA 7(a) lender, markdown with "## " headings: Loan Request Summary (amount, term, purpose, SBA 7(a) program), Company Description, Ownership and Management, Products and Market, Use of Proceeds (itemized table), Financial Projections (3-year revenue, expenses, net income, conservative and grounded), Debt Service Coverage Ratio calculation (target ≥1.25x), Repayment Plan, Collateral and Personal Guarantee, Risk Mitigation, Required Attachments checklist (SBA Form 1919, 413, tax returns, etc.).

Grounded numbers only, no hype. Institutional tone, zero filler.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: SCHEMA
    });
    return Response.json(result);
  } catch (error) {
    console.error('draftCapitalPack failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}