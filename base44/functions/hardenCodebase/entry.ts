import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const MAX_PER_SWEEP = 3;

const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['pass', 'conditional', 'blocked'] },
    score: { type: 'number' },
    summary: { type: 'string' },
    pods: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          pod: { type: 'string', enum: ['structure', 'contracts', 'security', 'enhancement'] },
          findings: { type: 'array', items: { type: 'string' } },
          fixes: { type: 'array', items: { type: 'string' } }
        },
        required: ['pod', 'findings', 'fixes']
      }
    },
    hardened_blueprint: {
      type: 'object',
      properties: {
        tech_stack: { type: 'array', items: { type: 'string' } },
        db_schema: { type: 'string' },
        core_logic: { type: 'string' }
      },
      required: ['tech_stack', 'db_schema', 'core_logic']
    }
  },
  required: ['verdict', 'score', 'summary', 'pods', 'hardened_blueprint']
};

const REVIEW_PROMPT = [
  'You are the hardening bench of InvestArch. Four pods review one asset blueprint before its codebase is generated: structure, contracts, security, enhancement.',
  '',
  'structure — does the data model carry every entity the solution needs, primary and foreign keys, uniqueness where duplicates would corrupt records, indexes on the columns the screens filter by, and timestamps? Name each missing table or column.',
  'contracts — does the schema agree with the core logic and the stated screens? Flag any field the logic reads that the schema does not store, any money or quantity stored as a type that rounds it, and any status value the logic assumes without a column to hold it.',
  'security — tenant or owner isolation on every table that holds customer data, no secrets in the schema, no client-supplied price or role trusted as a column, deletion handled without orphaning records.',
  'enhancement — the two to four changes that most raise this asset\'s value: a table that unlocks a revenue surface, a computed column that removes a reconciliation step, an audit trail a buyer will demand in diligence.',
  '',
  'Then return hardened_blueprint: the complete corrected data model as valid PostgreSQL DDL. Keep every table that already exists, add what you argued for, keep foreign keys intact. Do not summarise it — return the full DDL. tech_stack is the corrected stack list. core_logic restates the mechanisms in one paragraph including the changes you made.',
  'Score 0 to 100 the codebase this blueprint would produce today. verdict is pass at 80 and above, conditional from 55 to 79, blocked below 55. Findings and fixes must be concrete sentences about this schema, never generic advice.'
].join('\n');

function toReport(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const verdict = ['pass', 'conditional', 'blocked'].includes(raw.verdict) ? raw.verdict : 'conditional';
  const scoreNumber = Number(raw.score);
  const score = Number.isFinite(scoreNumber) ? Math.min(100, Math.max(0, Math.round(scoreNumber))) : 50;
  const summary = String(raw.summary || '').trim();
  if (!summary) return null;
  const pods = (Array.isArray(raw.pods) ? raw.pods : [])
    .map((pod) => ({
      pod: String(pod?.pod || '').trim().toLowerCase(),
      findings: (Array.isArray(pod?.findings) ? pod.findings : []).map((item) => String(item).trim()).filter(Boolean).slice(0, 8),
      fixes: (Array.isArray(pod?.fixes) ? pod.fixes : []).map((item) => String(item).trim()).filter(Boolean).slice(0, 8)
    }))
    .filter((pod) => pod.pod && (pod.findings.length || pod.fixes.length));
  return { verdict, score, summary, pods, date: new Date().toISOString(), generator: 'hardening-pod' };
}

function toBlueprint(raw, current) {
  const hardened = raw?.hardened_blueprint;
  if (!hardened) return null;
  const dbSchema = String(hardened.db_schema || '').trim();
  const techStack = Array.isArray(hardened.tech_stack) ? hardened.tech_stack.map((item) => String(item).trim()).filter(Boolean) : [];
  const coreLogic = String(hardened.core_logic || '').trim();
  if (!/create\s+table/i.test(dbSchema) || !techStack.length || !coreLogic) return null;
  const before = (String(current?.db_schema || '').match(/create\s+table/gi) || []).length;
  const after = (dbSchema.match(/create\s+table/gi) || []).length;
  if (after < before) return null;
  return { tech_stack: techStack, db_schema: dbSchema, core_logic: coreLogic };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action === 'sweep' ? 'sweep' : 'seed';

    let targets = [];
    if (action === 'seed') {
      const seedId = typeof body?.seedId === 'string' ? body.seedId : '';
      if (!seedId) return Response.json({ error: 'seedId is required' }, { status: 400 });
      const seed = await base44.entities.IpSeed.get(seedId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!seed) return Response.json({ error: 'Seed not found' }, { status: 404 });
      targets = [seed];
    } else {
      const { items } = await base44.entities.IpSeed.filter({}, { sort: '-created_date', limit: 60 });
      targets = (items || [])
        .filter((seed) => seed.blueprint && /create\s+table/i.test(String(seed.blueprint.db_schema || '')))
        .filter((seed) => !seed.hardening_report)
        .slice(0, MAX_PER_SWEEP);
      if (!targets.length) {
        return Response.json({ hardened: 0, attempted: 0, results: [], note: 'Every seed with a blueprint already carries a hardening report.' });
      }
    }

    const results = [];
    for (const seed of targets) {
      try {
        const blueprint = seed.blueprint || {};
        const context = [
          `Asset: ${seed.title}`,
          `Gap: ${seed.gap}`,
          `Solution: ${seed.solution}`,
          seed.mini_plan ? `Screens and motion on record: ${seed.mini_plan}` : '',
          Array.isArray(seed.source_seed_titles) && seed.source_seed_titles.length ? `Merged ecosystem: ${seed.source_seed_titles.join(' + ')}` : '',
          Array.isArray(blueprint.tech_stack) ? `Stack: ${blueprint.tech_stack.join(', ')}` : '',
          `Core logic: ${blueprint.core_logic || 'none recorded'}`,
          `Data model:\n${String(blueprint.db_schema || '')}`
        ].filter(Boolean).join('\n');

        const raw = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `${REVIEW_PROMPT}\n\nBLUEPRINT UNDER REVIEW\n${context}`,
          response_json_schema: REPORT_SCHEMA
        });

        const report = toReport(raw);
        if (!report) {
          results.push({ seed: seed.title, ok: false, error: 'The pods returned no usable report.' });
          continue;
        }

        const patch = { hardening_report: report };
        const hardened = toBlueprint(raw, blueprint);
        if (hardened) patch.blueprint = hardened;

        await base44.entities.IpSeed.update(seed.id, patch);
        await base44.entities.ActivityEvent.create({
          action: 'Codebase hardened',
          detail: `${seed.title} — ${report.verdict} ${report.score}/100${hardened ? ', blueprint upgraded' : ''}`,
          timestamp: new Date().toISOString()
        });

        results.push({
          seed: seed.title,
          ok: true,
          verdict: report.verdict,
          score: report.score,
          blueprint_upgraded: Boolean(hardened)
        });
      } catch (error) {
        console.log('hardenCodebase seed failed:', seed.id, error?.message);
        results.push({ seed: seed.title, ok: false, error: error.message });
      }
    }

    return Response.json({
      hardened: results.filter((result) => result.ok).length,
      attempted: targets.length,
      results
    });
  } catch (error) {
    console.log('hardenCodebase failed:', error?.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}