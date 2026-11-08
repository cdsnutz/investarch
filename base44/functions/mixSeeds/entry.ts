import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const MAX_SEEDS = 60;
const MAX_COMBINATIONS = 6;
const AUTO_CREATE = 3;

const clip = (value, limit = 220) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);
const keyOf = (ids) => [...ids].sort().join('|');
const score = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(10, Math.max(1, Math.round(n))) : fallback;
};

const PROMPT = [
  'You are the Portfolio Architect of InvestArch. The ledger below is the operator\'s live yield of IP-seeds, each a distinct market lacuna with its own product and its own buyer.',
  'Your task: find combinations of TWO or THREE seeds that hold together as one ecosystem. A qualifying combination serves the same buyer through a shared data spine, a shared distribution surface, or a shared economic loop, so shipping the members as one product produces strictly more revenue and more defensibility than shipping them apart.',
  'Rules:',
  '1. Members come only from the numbered ledger. Put their numbers in member_indices.',
  '2. Every member must supply something the others cannot: a data source, a distribution channel, a switching cost, or a regulated capability. Two seeds that merely share a theme do not qualify.',
  '3. Every member keeps its own revenue surface. No member may collapse into a feature of another.',
  '4. Name the shared loop concretely: what the first member produces that the second consumes, and what returns to close the cycle.',
  '5. blueprint.db_schema is the merged data model: valid PostgreSQL DDL made of CREATE TABLE statements with keys and indexes, at least four tables, no prose outside the SQL.',
  '6. blueprint.core_logic describes the three to five cross-seed mechanisms that make the merge work, one sentence each.',
  '7. thesis states why this combination is an ecosystem rather than a bundle, in plain declarative sentences.',
  '8. No marketing language. No adjectives standing in for facts. Do not invent market sizes, customers or partners.',
  '9. mix_score rates how much the merged product out-earns the sum of its members, 1 to 10. asymmetric_score rates the merged asset\'s own asymmetry, 1 to 10.',
  'Return the strongest combinations only, ordered by mix_score. An empty list is a valid answer when nothing in this ledger compounds.'
].join('\n');

const COMBINATION_SCHEMA = {
  type: 'object',
  properties: {
    combinations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          thesis: { type: 'string' },
          shared_value_loop: { type: 'string' },
          member_indices: { type: 'array', items: { type: 'number' } },
          roles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                seed_title: { type: 'string' },
                role: { type: 'string' }
              },
              required: ['seed_title', 'role']
            }
          },
          gap: { type: 'string' },
          solution: { type: 'string' },
          pain_signal: { type: 'string' },
          mini_plan: { type: 'string' },
          blueprint: {
            type: 'object',
            properties: {
              tech_stack: { type: 'array', items: { type: 'string' } },
              db_schema: { type: 'string' },
              core_logic: { type: 'string' }
            },
            required: ['tech_stack', 'db_schema', 'core_logic']
          },
          mix_score: { type: 'number' },
          asymmetric_score: { type: 'number' }
        },
        required: [
          'title',
          'thesis',
          'shared_value_loop',
          'member_indices',
          'roles',
          'gap',
          'solution',
          'mini_plan',
          'blueprint',
          'mix_score',
          'asymmetric_score'
        ]
      }
    }
  },
  required: ['combinations']
};

function resolveMembers(raw, pool) {
  if (Array.isArray(raw?.member_ids)) {
    const ids = [...new Set(raw.member_ids.filter((id) => typeof id === 'string'))];
    return pool.filter((seed) => ids.includes(seed.id));
  }
  const indices = Array.isArray(raw?.member_indices)
    ? [...new Set(raw.member_indices.map(Number).filter((n) => Number.isInteger(n)))]
    : [];
  return indices.map((n) => pool[n - 1]).filter(Boolean);
}

function normalize(raw, pool) {
  if (!raw || typeof raw !== 'object') return null;

  const members = resolveMembers(raw, pool);
  if (members.length < 2 || members.length > 3) return null;

  const blueprint = raw.blueprint || {};
  const techStack = Array.isArray(blueprint.tech_stack)
    ? blueprint.tech_stack.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const dbSchema = String(blueprint.db_schema || '').trim();
  const coreLogic = String(blueprint.core_logic || '').trim();
  if (!techStack.length || !/create\s+table/i.test(dbSchema) || !coreLogic) return null;

  const title = String(raw.title || '').trim();
  const thesis = String(raw.thesis || '').trim();
  const loop = String(raw.shared_value_loop || '').trim();
  const gap = String(raw.gap || '').trim();
  const solution = String(raw.solution || '').trim();
  if (title.length < 6 || thesis.length < 40 || loop.length < 20 || !gap || !solution) return null;

  return {
    title,
    thesis,
    shared_value_loop: loop,
    member_ids: members.map((seed) => seed.id),
    member_titles: members.map((seed) => seed.title),
    roles: (Array.isArray(raw.roles) ? raw.roles : [])
      .map((role) => ({
        seed_title: String(role?.seed_title || '').trim(),
        role: String(role?.role || '').trim()
      }))
      .filter((role) => role.seed_title && role.role),
    gap,
    solution,
    pain_signal: String(raw.pain_signal || '').trim(),
    mini_plan: String(raw.mini_plan || solution).trim(),
    blueprint: { tech_stack: techStack, db_schema: dbSchema, core_logic: coreLogic },
    mix_score: score(raw.mix_score, 5),
    asymmetric_score: score(raw.asymmetric_score, 5)
  };
}

async function persist(base44, combo) {
  const interlocks = [
    combo.shared_value_loop,
    ...combo.roles.map((role) => `${role.seed_title}: ${role.role}`)
  ].filter(Boolean).join('\n\n');

  return base44.entities.IpSeed.create({
    title: combo.title,
    gap: combo.gap,
    solution: combo.solution,
    pain_signal: combo.pain_signal,
    mini_plan: combo.mini_plan,
    blueprint: combo.blueprint,
    asymmetric_score: combo.asymmetric_score,
    mix_score: combo.mix_score,
    mix_thesis: combo.thesis,
    ecosystem_interlocks: interlocks,
    source_seed_ids: combo.member_ids,
    source_seed_titles: combo.member_titles,
    source_channel: 'seed mix',
    strategy: 'build',
    status: 'seed',
    yield_date: new Date().toISOString().slice(0, 10)
  });
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action === 'create' || body?.action === 'auto' ? body.action : 'find';

    const { items } = await base44.entities.IpSeed.filter({}, { sort: '-created_date', limit: MAX_SEEDS });
    const seeds = items || [];
    const mixes = seeds.filter((seed) => Array.isArray(seed.source_seed_ids) && seed.source_seed_ids.length > 0);
    const pool = seeds.filter((seed) => !(Array.isArray(seed.source_seed_ids) && seed.source_seed_ids.length > 0));
    const existing = new Set(mixes.map((seed) => keyOf(seed.source_seed_ids)));

    if (action === 'create') {
      const combo = normalize(body?.combination, pool);
      if (!combo) {
        return Response.json({ error: 'That mix needs two or three live seeds, a merged schema and a written rationale.' }, { status: 400 });
      }
      if (existing.has(keyOf(combo.member_ids))) {
        return Response.json({ error: 'These seeds are already mixed into one ecosystem.' }, { status: 409 });
      }

      const created = await persist(base44, combo);
      return Response.json({ seed: created });
    }

    if (pool.length < 2) {
      return Response.json({ combinations: [], reason: 'At least two unmixed seeds are needed before seeds can be combined.' });
    }

    const catalog = pool
      .map((seed, index) => `[${index + 1}] ${seed.title}\n  gap: ${clip(seed.gap)}\n  solution: ${clip(seed.solution)}${seed.mini_plan ? `\n  plan: ${clip(seed.mini_plan, 160)}` : ''}`)
      .join('\n');

    const raw = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${PROMPT}\n\nSEED LEDGER (${pool.length} seeds):\n${catalog}`,
      response_json_schema: COMBINATION_SCHEMA
    });

    const seen = new Set();
    const combinations = [];
    for (const entry of Array.isArray(raw?.combinations) ? raw.combinations : []) {
      const combo = normalize(entry, pool);
      if (!combo) continue;
      const comboKey = keyOf(combo.member_ids);
      if (seen.has(comboKey) || existing.has(comboKey)) continue;
      seen.add(comboKey);
      combinations.push(combo);
    }

    if (!combinations.length) {
      return Response.json({
        combinations: [],
        created: [],
        scanned: pool.length,
        reason: 'No combination in this ledger compounds. Every pairing would fold one seed into another. Hunt more seeds, then mix again.'
      });
    }

    combinations.sort((a, b) => b.mix_score - a.mix_score);
    const ranked = combinations.slice(0, MAX_COMBINATIONS);

    if (action === 'auto') {
      const created = [];
      for (const combo of ranked.slice(0, AUTO_CREATE)) {
        try {
          const seed = await persist(base44, combo);
          created.push({ id: seed.id, title: seed.title, mix_score: combo.mix_score, members: combo.member_titles });
        } catch (error) {
          console.log('mixSeeds auto persist failed:', combo.title, error?.message);
        }
      }
      return Response.json({ created, combinations: ranked.length, scanned: pool.length });
    }

    return Response.json({ combinations: ranked, scanned: pool.length });
  } catch (error) {
    console.log('mixSeeds failed:', error?.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}