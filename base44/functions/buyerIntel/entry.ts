import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const MAX_BUYERS = 8;

const INTEL_SCHEMA = {
  type: 'object',
  properties: {
    buyers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          snapshot: { type: 'string' },
          recent_moves: { type: 'array', items: { type: 'string' } },
          buying_trigger: { type: 'string' },
          unique_insight: { type: 'string' },
          osint_angle: { type: 'string' },
          sources: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'string', enum: ['verified', 'likely', 'thin'] }
        },
        required: ['company', 'snapshot', 'recent_moves', 'buying_trigger', 'unique_insight', 'osint_angle', 'sources', 'confidence']
      }
    }
  },
  required: ['buyers']
};

const INTEL_PROMPT = [
  'You are the Market Development desk of InvestArch. For each company listed, run an OSINT read from public sources and return one buyer profile.',
  'The operator sells or licences a finished software asset to these companies. The profile exists so the operator opens with something the buyer has not already heard from every other vendor.',
  '',
  'Evidence rules, with no exceptions:',
  '- Every statement must be supportable from a public source you actually saw. Never invent a funding round, headcount, executive, mandate, contract or product name. Never invent a person, an email address, or a figure.',
  '- If public evidence on a company is thin, return only what you can support, set confidence to "thin", and say in osint_angle what is missing and where it would be found. An honest thin profile beats a confident invented one.',
  '- Never reuse the operator\'s own asset description as evidence about the company.',
  '',
  'Fields:',
  '- snapshot: what the company does today, in their own market terms, 40 to 70 words. Concrete: what they sell, to whom, and at what layer of the stack.',
  '- recent_moves: two to four dated public moves that bear on whether they buy this asset now (product launches, regulatory filings, procurement notices, funding, leadership changes, partnerships, earnings language). Date each one.',
  '- buying_trigger: the specific situation inside the company that makes this asset worth a budget line this quarter, tied to one of the moves above.',
  '- unique_insight: the non-obvious observation. Nothing the buyer would read on their own homepage: a structural gap in their product line, a stack or compliance constraint, an org change that moved the budget, or a customer segment they cannot serve today. One paragraph, falsifiable, and name the source you saw it in.',
  '- osint_angle: the exact public sources an operator should re-check before the first send — company filings, careers page, changelog or docs, procurement portals, patent and trademark registries, regulator dockets, conference talks.',
  '- sources: two to four full https URLs for pages you actually opened and that carry the claims above — the press release, filing, changelog, procurement record or article. A URL that merely exists is not a source: it must be the page the claim came from. If you cannot name a URL for the insight, return an empty array and set confidence to "thin" rather than citing something you did not read.',
  '- confidence: "verified", "likely" or "thin".',
  '',
  'Return one profile per company listed, in the same order, using the company name exactly as given.'
].join('\n');

const clean = (value: any) => String(value ?? '').trim();

function normalizeRow(row: any) {
  const company = clean(row?.company);
  if (!company) return null;
  const confidence = ['verified', 'likely', 'thin'].includes(clean(row?.confidence).toLowerCase())
    ? clean(row?.confidence).toLowerCase()
    : 'thin';
  return {
    company,
    snapshot: clean(row?.snapshot),
    recent_moves: Array.isArray(row?.recent_moves) ? row.recent_moves.map(clean).filter(Boolean).slice(0, 5) : [],
    buying_trigger: clean(row?.buying_trigger),
    unique_insight: clean(row?.unique_insight),
    osint_angle: clean(row?.osint_angle),
    sources: Array.isArray(row?.sources)
      ? row.sources.map(clean).filter((url: string) => /^https?:\/\/\S+\.\S+/i.test(url)).slice(0, 5)
      : [],
    confidence
  };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error?.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const incoming = Array.isArray(body?.buyers) ? body.buyers.slice(0, MAX_BUYERS) : [];

    const buyers = incoming
      .map((buyer: any) => ({
        company: clean(buyer?.company).slice(0, 120),
        category: clean(buyer?.category).slice(0, 40),
        why_fit: clean(buyer?.why_fit).slice(0, 600),
        assets: Array.isArray(buyer?.assets) ? buyer.assets.map(clean).filter(Boolean).slice(0, 3) : [],
        pitch: clean(buyer?.pitch).slice(0, 700)
      }))
      .filter((buyer: any) => buyer.company);

    if (!buyers.length) return Response.json({ error: 'buyers is required' }, { status: 400 });

    const raw = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${INTEL_PROMPT}\n\nCOMPANIES\n${JSON.stringify(buyers, null, 2)}`,
      add_context_from_internet: true,
      model: 'gemini_3_8_flash',
      response_json_schema: INTEL_SCHEMA
    });

    const rows = (Array.isArray(raw?.buyers) ? raw.buyers : [])
      .map(normalizeRow)
      .filter((row: any) => row && row.snapshot);

    console.log(`[buyerIntel] requested ${buyers.length} buyers, returned ${rows.length} profiles`);
    return Response.json({ buyers: rows });
  } catch (error: any) {
    console.error('[buyerIntel] failed', error?.message);
    return Response.json({ error: error?.message || 'Buyer research failed' }, { status: 500 });
  }
}