import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const MAX_BUYERS = 8;
const SERP_RESULTS_PER_QUERY = 5;
const SERP_TIMEOUT_MS = 12000;

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
  'You are the Market Development desk of InvestArch. For each company listed, write one buyer profile using only the EVIDENCE supplied with it — live search results for that company.',
  'The operator sells or licences a finished software asset to these companies. The profile exists so the operator opens with something the buyer has not already heard from every other vendor.',
  '',
  'Evidence rules, with no exceptions:',
  '- Every statement must be supported by one of the supplied EVIDENCE results for that company. Never invent a funding round, headcount, executive, mandate, contract, product name, person or figure.',
  '- sources may only contain URLs copied exactly from that company\'s EVIDENCE list. A URL you did not receive in the evidence is not a source, even if you believe the page exists.',
  '- If the evidence on a company is thin, return only what it supports, set confidence to "thin", and say in osint_angle what is missing and where it would be found. An honest thin profile beats a confident invented one.',
  '- Never reuse the operator\'s own asset description as evidence about the company.',
  '',
  'Fields:',
  '- snapshot: what the company does today, in their own market terms, 40 to 70 words, drawn from the evidence.',
  '- recent_moves: two to four dated public moves that bear on whether they buy this asset now (launches, filings, procurement notices, funding, leadership changes, partnerships, earnings language). Date each one from the evidence.',
  '- buying_trigger: the specific situation inside the company that makes this asset worth a budget line this quarter, tied to one of the moves above.',
  '- unique_insight: the non-obvious observation. Nothing the buyer would read on their own homepage: a structural gap in their product line, a stack or compliance constraint, an org change that moved the budget, or a customer segment they cannot serve today. One paragraph, falsifiable, and say which evidence result it came from.',
  '- osint_angle: the exact public sources an operator should re-check before the first send.',
  '- sources: two to four URLs copied exactly from the supplied evidence for that company. Only these count.',
  '- confidence: "verified" only when at least two evidence sources and at least one dated move support the profile; "likely" when the read is reasonable but thinner; "thin" when evidence is missing.',
  '',
  'Return one profile per company listed, in the same order, using the company name exactly as given.'
].join('\n');

const clean = (value: any) => String(value ?? '').trim();

const linkKey = (url: string) => clean(url).toLowerCase().replace(/#.*$/, '').replace(/\/+$/, '').split('?')[0];

type Evidence = { title: string; link: string; snippet: string; date: string };

async function serpSearch(query: string, apiKey: string): Promise<Evidence[]> {
  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google');
  url.searchParams.set('q', query);
  url.searchParams.set('num', String(SERP_RESULTS_PER_QUERY));
  url.searchParams.set('tbs', 'qdr:y');
  url.searchParams.set('api_key', apiKey);

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(SERP_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`SERP API ${res.status}`);
  const data = await res.json();
  const rows = Array.isArray(data?.organic_results) ? data.organic_results : [];
  return rows
    .map((row: any) => ({
      title: clean(row?.title),
      link: clean(row?.link),
      snippet: clean(row?.snippet),
      date: clean(row?.date)
    }))
    .filter((row: Evidence) => /^https?:\/\/\S+\.\S+/i.test(row.link));
}

function queriesFor(buyer: any) {
  const company = clean(buyer.company);
  const asset = clean(buyer.assets?.[0]).slice(0, 80);
  return [
    `${company} news`,
    asset ? `${company} ${asset}` : `${company} product launch OR partnership OR hiring OR procurement`
  ].map((q) => q.slice(0, 200));
}

// Live search evidence per company, at most two queries each, run in small parallel batches.
async function gatherEvidence(buyers: any[], apiKey: string) {
  const jobs: { key: string; query: string }[] = [];
  buyers.forEach((buyer: any) => {
    queriesFor(buyer).forEach((query) => jobs.push({ key: clean(buyer.company).toLowerCase(), query }));
  });

  const evidence = new Map<string, Evidence[]>();
  const seen = new Set<string>();

  for (let index = 0; index < jobs.length; index += 4) {
    const batch = jobs.slice(index, index + 4);
    const settled = await Promise.allSettled(batch.map((job) => serpSearch(job.query, apiKey)));
    settled.forEach((result, i) => {
      const key = batch[i].key;
      if (result.status === 'rejected') {
        console.error('[buyerIntel] serp failed', batch[i].query, result.reason?.message);
        if (!evidence.has(key)) evidence.set(key, []);
        return;
      }
      const list = evidence.get(key) || [];
      result.value.forEach((row) => {
        const dedupe = `${key}:${linkKey(row.link)}`;
        if (seen.has(dedupe)) return;
        seen.add(dedupe);
        list.push(row);
      });
      evidence.set(key, list.slice(0, 10));
    });
  }

  return evidence;
}

function normalizeRow(row: any, allowed: Set<string>) {
  const company = clean(row?.company);
  if (!company) return null;

  const sources = Array.isArray(row?.sources)
    ? row.sources
      .map(clean)
      .filter((url: string) => /^https?:\/\/\S+\.\S+/i.test(url) && allowed.has(linkKey(url)))
      .slice(0, 5)
    : [];
  const moves = Array.isArray(row?.recent_moves)
    ? row.recent_moves.map(clean).filter(Boolean).slice(0, 5)
    : [];

  // The grade has to match the evidence actually attached to the profile. A claim with no
  // searched URL behind it is an assertion, not a verified finding.
  let grade = ['verified', 'likely', 'thin'].includes(clean(row?.confidence).toLowerCase())
    ? clean(row?.confidence).toLowerCase()
    : 'thin';
  if (!sources.length) grade = 'thin';
  else if (grade === 'verified' && (sources.length < 2 || !moves.length)) grade = 'likely';

  return {
    company,
    snapshot: clean(row?.snapshot),
    recent_moves: moves,
    buying_trigger: clean(row?.buying_trigger),
    unique_insight: clean(row?.unique_insight),
    osint_angle: clean(row?.osint_angle),
    sources,
    confidence: grade
  };
}

// One research record per company, so the nexus and the buyer book read the same verified evidence.
async function storeRows(base44: any, rows: any[], seedIdsByCompany: Map<string, string[]>, queriesByCompany: Map<string, string[]>) {
  let stored = 0;
  for (const row of rows) {
    const key = row.company.toLowerCase();
    const seedIds = seedIdsByCompany.get(key) || [];
    const payload = {
      company: key,
      company_name: row.company,
      confidence: row.confidence,
      sources: row.sources,
      snapshot: row.snapshot,
      recent_moves: row.recent_moves,
      buying_trigger: row.buying_trigger,
      unique_insight: row.unique_insight,
      osint_angle: row.osint_angle,
      search_queries: queriesByCompany.get(key) || [],
      seed_ids: seedIds,
      researched_date: new Date().toISOString()
    };

    try {
      const { items } = await base44.entities.BuyerResearch.filter({ company: key }, { limit: 1 });
      const existing = items?.[0];
      if (existing) {
        const merged = Array.from(new Set([...(existing.seed_ids || []), ...seedIds]));
        await base44.entities.BuyerResearch.update(existing.id, { ...payload, seed_ids: merged });
      } else {
        await base44.entities.BuyerResearch.create(payload);
      }
      stored += 1;
    } catch (error: any) {
      console.error('[buyerIntel] could not store research', key, error?.message);
    }
  }
  return stored;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error: any) => (error?.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const incoming = Array.isArray(body?.buyers) ? body.buyers.slice(0, MAX_BUYERS) : [];

    const buyers = incoming
      .map((buyer: any) => ({
        company: clean(buyer?.company).slice(0, 120),
        category: clean(buyer?.category).slice(0, 40),
        why_fit: clean(buyer?.why_fit).slice(0, 600),
        assets: Array.isArray(buyer?.assets) ? buyer.assets.map(clean).filter(Boolean).slice(0, 3) : [],
        pitch: clean(buyer?.pitch).slice(0, 700),
        seed_ids: Array.isArray(buyer?.seed_ids) ? buyer.seed_ids.map(clean).filter(Boolean).slice(0, 12) : []
      }))
      .filter((buyer: any) => buyer.company);

    if (!buyers.length) return Response.json({ error: 'buyers is required' }, { status: 400 });

    const serpKey = secrets.get('SERP_API_KEY');
    if (!serpKey) return Response.json({ error: 'SERP_API_KEY is not configured' }, { status: 500 });

    const evidence = await gatherEvidence(buyers, serpKey);

    const seedIdsByCompany = new Map<string, string[]>();
    const queriesByCompany = new Map<string, string[]>();
    buyers.forEach((buyer: any) => {
      const key = buyer.company.toLowerCase();
      seedIdsByCompany.set(key, Array.from(new Set([...(seedIdsByCompany.get(key) || []), ...buyer.seed_ids])));
      queriesByCompany.set(key, queriesFor(buyer));
    });

    const blocks = buyers.map((buyer: any) => {
      const rows = evidence.get(buyer.company.toLowerCase()) || [];
      return {
        company: buyer.company,
        category: buyer.category,
        asset_the_operator_would_sell: buyer.assets,
        declared_fit: buyer.why_fit,
        evidence: rows.map((row) => ({ title: row.title, url: row.link, date: row.date, snippet: row.snippet }))
      };
    });

    const raw = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${INTEL_PROMPT}\n\nCOMPANIES WITH LIVE EVIDENCE\n${JSON.stringify(blocks, null, 2)}`,
      model: 'gemini_3_8_flash',
      response_json_schema: INTEL_SCHEMA
    });

    const rows = (Array.isArray(raw?.buyers) ? raw.buyers : [])
      .map((row: any) => {
        const allowed = new Set((evidence.get(clean(row?.company).toLowerCase()) || []).map((e) => linkKey(e.link)));
        return normalizeRow(row, allowed);
      })
      .filter((row: any) => row && row.snapshot);

    const stored = await storeRows(base44, rows, seedIdsByCompany, queriesByCompany);

    console.log(`[buyerIntel] ${buyers.length} buyers · ${rows.length} profiles · ${stored} stored · verified ${rows.filter((r: any) => r.confidence === 'verified').length}`);
    return Response.json({ buyers: rows, stored });
  } catch (error: any) {
    console.error('[buyerIntel] failed', error?.message);
    return Response.json({ error: error?.message || 'Buyer research failed' }, { status: 500 });
  }
}