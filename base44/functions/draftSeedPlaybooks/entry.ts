import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const PLAYBOOK_SCHEMA = {
  type: 'object',
  properties: {
    funding_playbook: { type: 'string' },
    acquisition_playbook: { type: 'string' },
    marketing_plan: { type: 'string' },
    research_brief: { type: 'string' },
    buyer_leads: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          why_fit: { type: 'string' },
          contact_role: { type: 'string' },
          approach: { type: 'string' },
          evidence_to_lead_with: { type: 'string' }
        },
        required: ['company', 'why_fit', 'contact_role', 'approach']
      }
    }
  },
  required: ['funding_playbook', 'acquisition_playbook', 'marketing_plan', 'research_brief', 'buyer_leads']
};

const PROMPT = [
  'You are the Capital and Exit Counsel of InvestArch. Write four operating playbooks and one list of named buyers for the asset described below. Every line must be actionable by a founder with no banker and no lawyer on retainer.',
  '',
  '1. funding_playbook — how this asset gets funded. Order the instruments by what should be attempted first and why: non-dilutive grant programs that actually fund this category, revenue-based and receivables facilities, then equity. For each instrument, state what evidence the funder scores, the size range it typically writes, and the disqualifier that kills the application. Close with the evidence package to assemble before the first send, and the three diligence questions that will expose the model fastest.',
  '2. acquisition_playbook — how this asset is sold to a larger company. Name the buyer categories that pay for this capability and what they are really buying (a customer list, a licence, a compliance position, a team). Give the packaging argument, the valuation logic in terms a buyer accepts (multiples, comparable transactions, cost-to-rebuild), the approach sequence from first contact to term sheet, what belongs in the data room, and the four conditions that make a strategic buyer walk.',
  '3. marketing_plan — the first thousand users. Name the buyer, the wedge, the single channel that carries the first hundred, the proof asset that closes them, the pricing test, and the retention signal that says the wedge holds.',
  '4. research_brief — separate what the record actually shows from what is assumed. List the load-bearing assumptions, the evidence that would falsify each one, the sources a reader can check, and the questions that must be answered before money is spent.',
  '5. buyer_leads — six to ten specific companies that plausibly acquire or license this asset. Each must be a real, currently operating company found in your sources, with why it fits its own current product line, the role to approach, the opening move, and the proof to lead with.',
  '',
  'Rules: no invented funding amounts, no invented statistics, no invented contacts. Where a figure is an estimate, say it is an estimate and give the basis. Never claim a program funds this category unless your sources support it. Plain declarative sentences. No headings inside the four playbooks other than short markdown headings.'
].join('\n');

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const seedId = typeof body?.seedId === 'string' ? body.seedId : '';
    if (!seedId) return Response.json({ error: 'seedId is required' }, { status: 400 });

    const seed = await base44.entities.IpSeed.get(seedId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!seed) return Response.json({ error: 'Seed not found' }, { status: 404 });

    const blueprint = seed.blueprint || {};
    const context = [
      `Asset: ${seed.title}`,
      `Gap: ${seed.gap}`,
      `Solution: ${seed.solution}`,
      seed.pain_signal ? `Pain signal: ${seed.pain_signal}` : '',
      seed.mini_plan ? `Go-to-market plan on record: ${seed.mini_plan}` : '',
      seed.strategy ? `Portfolio verdict: ${seed.strategy}${seed.strategy_note ? ' — ' + seed.strategy_note : ''}` : '',
      Array.isArray(blueprint.tech_stack) && blueprint.tech_stack.length ? `Stack: ${blueprint.tech_stack.join(', ')}` : '',
      blueprint.core_logic ? `Core logic: ${blueprint.core_logic}` : '',
      blueprint.db_schema ? `Data model:\n${String(blueprint.db_schema).slice(0, 1800)}` : '',
      Array.isArray(seed.source_seed_titles) && seed.source_seed_titles.length ? `This asset is an ecosystem merging: ${seed.source_seed_titles.join(' + ')}` : '',
      seed.mix_thesis ? `Why the merge holds: ${seed.mix_thesis}` : '',
      seed.ecosystem_interlocks ? `Interlocks: ${seed.ecosystem_interlocks}` : ''
    ].filter(Boolean).join('\n');

    const raw = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${PROMPT}\n\nASSET\n${context}`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: PLAYBOOK_SCHEMA
    });

    const playbooks = {
      funding_playbook: String(raw?.funding_playbook || '').trim(),
      acquisition_playbook: String(raw?.acquisition_playbook || '').trim(),
      marketing_plan: String(raw?.marketing_plan || '').trim(),
      research_brief: String(raw?.research_brief || '').trim(),
      buyer_leads: (Array.isArray(raw?.buyer_leads) ? raw.buyer_leads : [])
        .map((lead) => ({
          company: String(lead?.company || '').trim(),
          why_fit: String(lead?.why_fit || '').trim(),
          contact_role: String(lead?.contact_role || '').trim(),
          approach: String(lead?.approach || '').trim(),
          evidence_to_lead_with: String(lead?.evidence_to_lead_with || '').trim()
        }))
        .filter((lead) => lead.company && lead.why_fit && lead.approach)
        .slice(0, 10)
    };

    if (!playbooks.funding_playbook || !playbooks.acquisition_playbook || !playbooks.buyer_leads.length) {
      return Response.json({ error: 'The playbook pass returned an incomplete brief. Run it again.' }, { status: 502 });
    }

    await base44.entities.IpSeed.update(seedId, playbooks);
    return Response.json({ playbooks });
  } catch (error) {
    console.log('draftSeedPlaybooks failed:', error?.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}