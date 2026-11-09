import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { clean, linkKey, gatherEvidence } from '../../shared/serp.ts';

const MAX_COMPETITORS = 8;
const MAX_EVIDENCE = 30;
const RESULTS_PER_QUERY = 6;

const SPEC_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    subhead: { type: 'string' },
    promise: { type: 'string' },
    category: { type: 'string' },
    core_loop: { type: 'string' },
    wedge: { type: 'string' },
    pricing: { type: 'string' },
    competitors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          url: { type: 'string' },
          offers: { type: 'string' },
          weakness: { type: 'string' },
          price_signal: { type: 'string' }
        },
        required: ['name', 'offers', 'weakness']
      }
    },
    parity_features: { type: 'array', items: { type: 'string' } },
    differentiators: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          feature: { type: 'string' },
          why_it_wins: { type: 'string' },
          proof: { type: 'string' }
        },
        required: ['feature', 'why_it_wins', 'proof']
      }
    },
    screens: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          name: { type: 'string' },
          purpose: { type: 'string' }
        },
        required: ['path', 'name', 'purpose']
      }
    },
    entities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          table: { type: 'string' },
          columns: { type: 'array', items: { type: 'string' } }
        },
        required: ['table', 'columns']
      }
    },
    acceptance_criteria: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    sources: { type: 'array', items: { type: 'string' } }
  },
  required: [
    'headline',
    'subhead',
    'promise',
    'category',
    'core_loop',
    'wedge',
    'pricing',
    'competitors',
    'parity_features',
    'differentiators',
    'screens',
    'entities',
    'acceptance_criteria',
    'risks',
    'sources'
  ]
};

const SPEC_PROMPT = [
  'You are the product architect of InvestArch. You are given one IP seed and live search evidence about the products already selling into its space. You return the specification for the best MVP website that could be shipped for that seed, built to beat every named competitor rather than to imitate them.',
  '',
  'Evidence rules, with no exceptions:',
  '- Name a competitor only when the supplied EVIDENCE shows it. Give its real product name, and copy its url exactly from the evidence. Never invent a company, a price, a funding round, a customer or a metric.',
  '- The competitor name must appear verbatim in the evidence text. A directory or comparison page that lists many tools does not establish a competitor unless that tool is named in the result you read.',
  '- weakness must be an observed gap you can support from the evidence (a missing capability, a pricing model that punishes scale, a workflow the product skips, a complaint quoted in a result). If the evidence does not support a specific weakness, say what is unproven instead of guessing.',
  '- price_signal: quote the pricing language or figure the evidence shows, or "not stated" when it does not.',
  '- sources: two to six URLs copied exactly from the evidence.',
  '- Never describe the seed as already built or already having customers.',
  '',
  'What to produce:',
  '- headline: the promise printed at the top of the product, under 12 words, concrete, no superlatives.',
  '- subhead: one sentence naming who it is for and what changes for them.',
  '- promise: the measurable outcome the product delivers, with the unit it is measured in.',
  '- category: the product category a buyer would search for.',
  '- core_loop: the repeatable action a user takes weekly that creates value, described as a loop of three or four steps.',
  '- wedge: one sentence naming the single advantage that makes this the better choice than the strongest competitor on the list.',
  '- pricing: the entry plan and its price logic, honest about what is metered.',
  '- competitors: 3 to 8 rows, strongest first.',
  '- parity_features: the capabilities every credible product in this category has and this one must match to be considered. Four to eight short items.',
  '- differentiators: three to five features that go beyond parity. Each needs why_it_wins (the mechanism, not the adjective) and proof (how the shipped product demonstrates it, verifiable by the buyer).',
  '- screens: every screen the MVP ships, with a route path, a name and one sentence of purpose. Include sign up, sign in, the primary workspace, creation, detail, and settings. Six to ten rows.',
  '- entities: the data model, at most four tables, each with two to eight column names in snake_case. Exclude id, created_at, updated_at and owner_id. Column names must imply their type (amount, status, due_date, title, is_active).',
  '- acceptance_criteria: testable conditions a reviewer checks on the running app, one per line, no adjectives.',
  '- risks: two to four ways this MVP fails commercially, each tied to a named competitor or a stated assumption.',
  '',
  'Writing rules: no em dashes, no filler, no marketing fluff, no superlatives. Declarative sentences.',
  'Return only the specification object.'
].join('\n');

const SNAKE = (value, limit = 40) => clean(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .slice(0, limit);

function queriesFor(seed) {
  const title = clean(seed.title).slice(0, 90);
  const solution = clean(seed.solution).slice(0, 90);
  const gap = clean(seed.pain_signal || seed.gap).slice(0, 90);
  const queries = [
    `${title} competitors`,
    `${title} alternatives pricing`,
    solution ? `${solution} software competitors` : '',
    gap ? `${gap} software tools` : ''
  ];
  return Array.from(new Set(queries.map((q) => q.replace(/\s+/g, ' ').trim()).filter((q) => q.length > 8))).slice(0, 4);
}

const META_COLUMNS = /^(id|created_at|updated_at|owner_id|user_id|deleted_at)$/i;
const RESERVED_TABLES = /^(users?|sessions|migrations|accounts)$/i;

// The data model is derived from column names alone, so the generator's own type inference stays
// in charge of SQL types and the spec can never smuggle in a malformed statement.
function modelFrom(rawEntities) {
  const tables = [];
  const takenTables = new Set();
  for (const entity of Array.isArray(rawEntities) ? rawEntities : []) {
    const table = SNAKE(entity?.table);
    if (!table || RESERVED_TABLES.test(table) || takenTables.has(table)) continue;
    const cols = [];
    for (const column of Array.isArray(entity?.columns) ? entity.columns : []) {
      const name = SNAKE(column);
      if (!name || META_COLUMNS.test(name) || cols.includes(name)) continue;
      cols.push(name);
    }
    if (cols.length < 2) continue;
    takenTables.add(table);
    tables.push({ table, cols: cols.slice(0, 8) });
    if (tables.length === 4) break;
  }
  return tables;
}

function composeSchema(tables) {
  return tables
    .map((table) => `create table if not exists "${table.table}" (\n  ${table.cols.map((col) => `"${col}" text`).join(',\n  ')}\n);`)
    .join('\n\n');
}

function normalizeSpec(raw, allowed, evidence) {
  const haystack = evidence.map((row) => `${row.title} ${row.snippet}`).join(' ').toLowerCase().replace(/\s+/g, ' ');
  const urls = (list) => (Array.isArray(list) ? list : [])
    .map(clean)
    .filter((url) => /^https?:\/\/\S+\.\S+/i.test(url) && allowed.has(linkKey(url)))
    .slice(0, 6);

  const competitors = (Array.isArray(raw?.competitors) ? raw.competitors : [])
    .map((row) => ({
      name: clean(row?.name).slice(0, 120),
      url: allowed.has(linkKey(row?.url)) ? clean(row?.url) : '',
      offers: clean(row?.offers).slice(0, 400),
      weakness: clean(row?.weakness).slice(0, 400),
      price_signal: clean(row?.price_signal).slice(0, 200) || 'not stated'
    }))
    .filter((row) => row.name && row.offers)
    // Keep a name the evidence actually prints, or a name tied to a page from the evidence.
    // Anything else is an invention and never reaches the brief.
    .filter((row) => row.url || haystack.includes(row.name.toLowerCase().slice(0, 60)))
    .slice(0, MAX_COMPETITORS);

  const differentiators = (Array.isArray(raw?.differentiators) ? raw.differentiators : [])
    .map((row) => ({
      feature: clean(row?.feature).slice(0, 160),
      why_it_wins: clean(row?.why_it_wins).slice(0, 400),
      proof: clean(row?.proof).slice(0, 400)
    }))
    .filter((row) => row.feature && row.why_it_wins)
    .slice(0, 6);

  const screens = (Array.isArray(raw?.screens) ? raw.screens : [])
    .map((row) => ({
      path: clean(row?.path).slice(0, 60) || '/',
      name: clean(row?.name).slice(0, 80),
      purpose: clean(row?.purpose).slice(0, 240)
    }))
    .filter((row) => row.name)
    .slice(0, 12);

  const tables = modelFrom(raw?.entities);
  const strings = (list, cap) => (Array.isArray(list) ? list : []).map((item) => clean(item).slice(0, 300)).filter(Boolean).slice(0, cap);

  const spec = {
    headline: clean(raw?.headline).slice(0, 160),
    subhead: clean(raw?.subhead).slice(0, 280),
    promise: clean(raw?.promise).slice(0, 280),
    category: clean(raw?.category).slice(0, 120),
    core_loop: clean(raw?.core_loop).slice(0, 600),
    wedge: clean(raw?.wedge).slice(0, 400),
    pricing: clean(raw?.pricing).slice(0, 400),
    competitors,
    parity_features: strings(raw?.parity_features, 8),
    differentiators,
    screens,
    db_schema: composeSchema(tables),
    acceptance_criteria: strings(raw?.acceptance_criteria, 12),
    risks: strings(raw?.risks, 5),
    sources: urls(raw?.sources)
  };

  // A spec with no evidence behind it is a pitch, not a teardown. Fall back to the searched URLs
  // rather than returning an empty source list the buyer would read as a claim.
  if (!spec.sources.length) spec.sources = evidence.slice(0, 4).map((row) => row.link);

  return spec;
}

// Every market statement in the teardown is paired with the page it was read from, so each exported
// document can print the URL and the evidence text beside the claim instead of asserting it.
function buildVerification(spec: any, evidence: any[], research: any[], queries: string[]) {
  const byLink = new Map<string, any>();
  evidence.forEach((row) => byLink.set(linkKey(row.link), row));

  const quote = (url: string) => {
    const row = byLink.get(linkKey(url));
    return row ? clean(`${row.title}. ${row.snippet}`).slice(0, 320) : '';
  };
  const findByName = (name: string) => {
    const needle = clean(name).toLowerCase().slice(0, 60);
    if (needle.length < 3) return null;
    return evidence.find((row) => `${row.title} ${row.snippet}`.toLowerCase().includes(needle)) || null;
  };

  const claims: any[] = [];
  const pushClaim = (label: string, kind: string, row: any | null, untraced: string) => {
    const url = row?.link ? clean(row.link) : '';
    claims.push({
      claim: clean(label).slice(0, 400),
      kind,
      source_url: url,
      evidence: url ? quote(url) : untraced,
      verified: Boolean(url)
    });
  };

  spec.competitors.forEach((row: any) => {
    const hit = row.url ? byLink.get(linkKey(row.url)) : findByName(row.name);
    pushClaim(
      `${row.name}: ${row.weakness}`,
      'competitor',
      hit || null,
      'The name appears in a result read for this seed, but no single page established this gap.'
    );
  });

  spec.competitors.forEach((row: any) => {
    if (!row.price_signal || /^not stated$/i.test(clean(row.price_signal))) return;
    const hit = row.url ? byLink.get(linkKey(row.url)) : findByName(row.name);
    pushClaim(
      `${row.name} price signal: ${row.price_signal}`,
      'price',
      hit || null,
      'Pricing language was generated by the teardown model and no page matched it on re-read.'
    );
  });

  const inferences = [
    'The headline, subhead, promise, category, core loop, entry pricing model, screens and data model are synthesis decisions drawn from the seed and the buyer research, not quoted claims.'
  ];
  spec.differentiators.forEach((row: any) => {
    inferences.push(`${row.feature} is a design decision for this build, not a market claim. Proof to ship: ${row.proof}`);
  });

  const used = new Set<string>();
  claims.forEach((row) => {
    if (row.source_url && byLink.has(linkKey(row.source_url))) used.add(linkKey(row.source_url));
  });
  (spec.sources || []).forEach((url: string) => {
    if (byLink.has(linkKey(url))) used.add(linkKey(url));
  });

  const sources = evidence
    .filter((row) => used.has(linkKey(row.link)))
    .slice(0, 24)
    .map((row) => ({
      url: clean(row.link),
      title: clean(row.title).slice(0, 160),
      date: clean(row.date).slice(0, 40),
      used_for: claims
        .filter((claim) => claim.source_url && linkKey(claim.source_url) === linkKey(row.link))
        .map((claim) => claim.kind)
        .filter((kind, index, all) => all.indexOf(kind) === index)
        .join(', ')
    }));

  const traced = claims.filter((row) => row.verified).length;
  const checked = new Date().toISOString().slice(0, 10);

  return {
    checked_date: checked,
    summary: `${traced} of ${claims.length} market claims traced to a page read on ${checked}; ${evidence.length} search results read across ${queries.length} searches.`,
    evidence_read: evidence.length,
    claims_total: claims.length,
    claims_traced: traced,
    queries: queries.slice(0, 6),
    claims: claims.slice(0, 16),
    sources,
    research: research.map((row: any) => ({
      company: clean(row.company).slice(0, 120),
      confidence: clean(row.confidence) || 'thin',
      sources: (Array.isArray(row.sources) ? row.sources : []).map(clean).filter(Boolean).slice(0, 4)
    })),
    inferences: inferences.slice(0, 8)
  };
}

function scoreSpec(spec, evidenceCount) {
  const points = spec.competitors.length * 8
    + spec.differentiators.length * 8
    + spec.parity_features.length * 3
    + spec.screens.length
    + (spec.db_schema ? 12 : 0)
    + (spec.acceptance_criteria.length ? 6 : 0)
    + (spec.sources.length ? 6 : 0)
    + Math.min(evidenceCount, 10);
  return Math.max(10, Math.min(100, points));
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error?.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const seedId = clean(body?.seedId);
    if (!seedId) return Response.json({ error: 'seedId is required' }, { status: 400 });

    // Research already on file for this seed's buyers. It aims the product; it is never a
    // competitor claim, which still has to come from live evidence.
    const research = (Array.isArray(body?.research) ? body.research : [])
      .slice(0, 4)
      .map((row: any) => ({
        company: clean(row?.company).slice(0, 120),
        confidence: clean(row?.confidence).slice(0, 20),
        snapshot: clean(row?.snapshot).slice(0, 900),
        recent_moves: (Array.isArray(row?.recent_moves) ? row.recent_moves : []).map(clean).filter(Boolean).slice(0, 4),
        buying_trigger: clean(row?.buying_trigger).slice(0, 600),
        unique_insight: clean(row?.unique_insight).slice(0, 900),
        osint_angle: clean(row?.osint_angle).slice(0, 600),
        sources: (Array.isArray(row?.sources) ? row.sources : []).map(clean).filter(Boolean).slice(0, 4)
      }))
      .filter((row: any) => row.company);

    const seed = await base44.entities.IpSeed.get(seedId).catch((error) => (error?.status === 404 ? null : Promise.reject(error)));
    if (!seed) return Response.json({ error: 'Seed not found' }, { status: 404 });

    const apiKey = secrets.get('SERP_API_KEY') || secrets.get('SERP_API_TOKEN');
    if (!apiKey) return Response.json({ error: 'SERP_API_KEY is not configured' }, { status: 500 });

    const queries = queriesFor(seed);
    const byQuery = await gatherEvidence(
      queries.map((query, index) => ({ key: `q${index}`, query })),
      apiKey,
      { results: RESULTS_PER_QUERY }
    );
    const seenLinks = new Set();
    const evidence: any[] = [];
    byQuery.forEach((rows) => {
      rows.forEach((row) => {
        const key = linkKey(row.link);
        if (!key || seenLinks.has(key) || evidence.length >= MAX_EVIDENCE) return;
        seenLinks.add(key);
        evidence.push(row);
      });
    });
    if (!evidence.length) {
      console.error('[forgeGoldMvp] no evidence for seed', seedId);
      return Response.json({ error: 'Live search returned nothing for this seed. Re-run the forge.' }, { status: 502 });
    }

    const brief = {
      title: clean(seed.title),
      gap: clean(seed.gap),
      pain_signal: clean(seed.pain_signal),
      solution: clean(seed.solution),
      mini_plan: clean(seed.mini_plan),
      blueprint: {
        tech_stack: Array.isArray(seed.blueprint?.tech_stack) ? seed.blueprint.tech_stack : [],
        core_logic: clean(seed.blueprint?.core_logic)
      },
      ecosystem_interlocks: clean(seed.ecosystem_interlocks)
    };

    const researchBlock = research.length
      ? `\n\nBUYER RESEARCH ALREADY ON FILE (dated public-source reads on the buyers; use it to aim the promise, the core loop and the wedge. Competitor names, prices and urls still come only from LIVE EVIDENCE)\n${JSON.stringify(
        research,
        null,
        2
      )}`
      : '';

    const raw = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${SPEC_PROMPT}\n\nSEED\n${JSON.stringify(brief, null, 2)}\n\nLIVE EVIDENCE (search results, one per line as JSON)\n${JSON.stringify(
        evidence.map((row) => ({ title: row.title, url: row.link, date: row.date, snippet: row.snippet })),
        null,
        2
      )}${researchBlock}`,
      model: 'gemini_3_8_flash',
      response_json_schema: SPEC_SCHEMA
    });

    const allowed = new Set(evidence.map((row) => linkKey(row.link)));
    const spec = normalizeSpec(raw, allowed, evidence);
    if (!spec.competitors.length) {
      return Response.json({ error: 'The teardown came back without supported competitors. Re-run the forge.' }, { status: 502 });
    }

    const score = scoreSpec(spec, evidence.length);
    const verification = buildVerification(spec, evidence, research, queries);
    const payload = {
      seed_id: seedId,
      seed_title: brief.title,
      ...spec,
      source_verification: verification,
      score,
      forged_date: new Date().toISOString()
    };

    const { items } = await base44.entities.MvpForge.filter({ seed_id: seedId }, { limit: 1 });
    const existing = items?.[0];
    let recordId = existing?.id || '';
    if (existing) {
      await base44.entities.MvpForge.update(existing.id, payload);
    } else {
      const created = await base44.entities.MvpForge.create(payload);
      recordId = created?.id || '';
    }

    console.log(
      `[forgeGoldMvp] ${brief.title} · ${evidence.length} results · ${spec.competitors.length} competitors · score ${score} · ${verification.summary}`
    );
    return Response.json({
      spec: { ...payload, id: recordId },
      score,
      evidence: evidence.length,
      queries,
      verification: verification.summary
    });
  } catch (error) {
    console.error('[forgeGoldMvp] failed', error?.message);
    return Response.json({ error: error?.message || 'The forge failed' }, { status: 500 });
  }
}