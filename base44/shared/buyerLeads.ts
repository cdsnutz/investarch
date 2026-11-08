// Buyer-lead generation, shared by the single-seed draft and the nightly sweep.
//
// The boundary is deliberate and lives in the prompt: a pitch has to survive
// being forwarded to the buyer's general counsel. Breadth of coverage is the
// lever for reach — not pressure. No manufactured urgency or scarcity, no fear
// appeals, no invented social proof, no invented facts about the company.

export const LEADS_PER_SEED = 14;

export const LEAD_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    company: { type: 'string' },
    category: { type: 'string', enum: ['incumbent', 'platform', 'reseller', 'acquirer', 'services', 'research'] },
    why_fit: { type: 'string' },
    contact_role: { type: 'string' },
    approach: { type: 'string' },
    evidence_to_lead_with: { type: 'string' },
    subject: { type: 'string' },
    pitch: { type: 'string' }
  },
  required: ['company', 'category', 'why_fit', 'contact_role', 'approach', 'evidence_to_lead_with', 'subject', 'pitch']
};

export const LEADS_SCHEMA = {
  type: 'object',
  properties: {
    leads: { type: 'array', items: LEAD_ITEM_SCHEMA },
    coverage_note: { type: 'string' }
  },
  required: ['leads']
};

export const LEAD_PROMPT = [
  'You are the Market Development desk of InvestArch. Your job is coverage: name every company that has a budget line this asset could land in, and write each one a first-touch email that its recipient can act on today.',
  '',
  '1. Breadth first. Return ten to sixteen companies, covering every category that pays for this capability: incumbents whose product line this completes (incumbent), platforms that would licence or embed it (platform), services firms that would resell or deliver it (reseller), adjacent companies whose strategy this accelerates (acquirer), agencies or consultancies that need it to serve clients (services), and research or standards bodies that would fund or cite it (research). Do not return six variants of the same buyer.',
  '2. Reliability. Only companies that exist and operate today, matched to a named product, program, or stated strategy you can point to. If you are not confident a company is still independent and buying, leave it out rather than pad the list. Never invent a company, a person, an email address, or a funding round.',
  '3. why_fit — one or two sentences tying the asset to that company\'s own current product line or stated priority, in their terms. Say what part of their business it improves and what they would do with it.',
  '4. contact_role — the function that owns the budget for this, by title (e.g. Head of Corporate Development, VP Product, Chief Underwriting Officer). A role, never a person\'s name.',
  '5. approach — the opening move for that specific company: the warm path, the event, the published piece to reply to, or the intro to earn. Concrete, one or two sentences.',
  '6. evidence_to_lead_with — the one artifact this operator can produce that this buyer would actually check (a demo, a measured pilot result, a data sample, a reference architecture).',
  '7. subject and pitch — the first-touch email, written for that company alone. subject: under nine words, specific, no clickbait, no all-caps. pitch: 90 to 140 words in first person. One line on their situation as a buyer, one line on what the asset makes possible for them, one concrete piece of proof the operator can produce this week, and one small ask (a fifteen-minute call, or permission to send a two-page brief). No flattering opener, no throat-clearing, no adjectives doing the work of evidence.',
  '',
  'Forbidden, with no exceptions: manufactured urgency or scarcity, fear-based framing, fake social proof or "everyone is moving", flattery openers, pretending to be a customer, investor or insider, overstating what exists or what it does, and any invented fact about the company. A pitch that would embarrass the operator if the buyer\'s lawyer read it must not be written.',
  '',
  'Never cite a statistic, report, study or survey in a pitch unless you can name the source so the operator can link it before sending. If you cannot name it, describe the buyer\'s situation without numbers. A figure the operator cannot source costs more trust than it buys.',
  'coverage_note: one sentence naming which buyer categories this asset has no credible buyer in, if any.'
].join('\n');

export function seedBrief(seed: any): string {
  const blueprint = seed?.blueprint || {};
  return [
    `Asset: ${seed?.title || ''}`,
    seed?.gap ? `Gap it closes: ${seed.gap}` : '',
    seed?.solution ? `Solution: ${seed.solution}` : '',
    seed?.pain_signal ? `Pain signal: ${seed.pain_signal}` : '',
    seed?.mini_plan ? `Route to first users: ${seed.mini_plan}` : '',
    seed?.strategy ? `Portfolio verdict: ${seed.strategy}${seed.strategy_note ? ' — ' + seed.strategy_note : ''}` : '',
    Array.isArray(blueprint.tech_stack) && blueprint.tech_stack.length ? `Stack: ${blueprint.tech_stack.join(', ')}` : '',
    blueprint.core_logic ? `Core logic: ${blueprint.core_logic}` : '',
    seed?.acquisition_playbook ? `Buyer categories already argued:\n${String(seed.acquisition_playbook).slice(0, 1500)}` : '',
    Array.isArray(seed?.source_seed_titles) && seed.source_seed_titles.length
      ? `Ecosystem merging: ${seed.source_seed_titles.join(' + ')}` : '',
    seed?.mix_thesis ? `Why the merge holds: ${seed.mix_thesis}` : ''
  ].filter(Boolean).join('\n');
}

function clean(value: any): string {
  return String(value || '').trim();
}

export function normalizeLeads(raw: any, limit = LEADS_PER_SEED, requirePitch = true) {
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.leads) ? raw.leads : [];
  const seen = new Set<string>();
  return list
    .map((lead: any) => ({
      company: clean(lead?.company),
      category: ['incumbent', 'platform', 'reseller', 'acquirer', 'services', 'research'].includes(clean(lead?.category).toLowerCase())
        ? clean(lead?.category).toLowerCase() : 'incumbent',
      why_fit: clean(lead?.why_fit),
      contact_role: clean(lead?.contact_role),
      approach: clean(lead?.approach),
      evidence_to_lead_with: clean(lead?.evidence_to_lead_with),
      subject: clean(lead?.subject),
      pitch: clean(lead?.pitch)
    }))
    .filter((lead: any) => {
      const key = lead.company.toLowerCase();
      if (!lead.company || !lead.why_fit || seen.has(key)) return false;
      if (requirePitch && !lead.pitch) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export async function draftLeadsForSeed(base44: any, seed: any) {
  const raw = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `${LEAD_PROMPT}\n\nASSET\n${seedBrief(seed)}`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: LEADS_SCHEMA
  });
  const leads = normalizeLeads(raw);
  return {
    leads,
    coverage_note: clean(raw?.coverage_note),
    date: new Date().toISOString().slice(0, 10)
  };
}

export function leadTarget(seed: any): boolean {
  const leads = Array.isArray(seed?.buyer_leads) ? seed.buyer_leads : [];
  if (!leads.length) return true;
  return leads.some((lead: any) => !clean(lead?.pitch) || !clean(lead?.subject));
}