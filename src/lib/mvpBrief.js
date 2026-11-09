// The teardown that set the build's scope, shipped inside every forged app so the operator can
// see exactly which competitors were read, what they leave open, and how this build answers it.
// It closes with the source register: every market claim beside the page and quote behind it.
import { buildVerificationSection, verificationOf } from '@/lib/mvpSources';

const text = (value) => String(value ?? '').trim();

const list = (items, fallback) => (Array.isArray(items) && items.length ? items : null) || fallback;

function competitorRows(spec) {
  const rows = (spec.competitors || []).map((row) => {
    const name = row.url ? `[${row.name}](${row.url})` : row.name;
    return `| ${name} | ${row.offers} | ${row.weakness} | ${row.price_signal || 'not stated'} |`;
  });
  return rows.length
    ? ['| Competitor | What they sell | Observed gap | Price signal |', '| --- | --- | --- | --- |', ...rows].join('\n')
    : 'No competitor was supported by the evidence for this seed. Treat the wedge below as a hypothesis.';
}

function wedgeRows(spec) {
  return (spec.differentiators || [])
    .map((row, index) => `${index + 1}. **${row.feature}** ${row.why_it_wins}\n   Proof in the shipped app: ${row.proof}`)
    .join('\n');
}

function screenRows(spec) {
  const rows = (spec.screens || []).map((row) => `| \`${row.path}\` | ${row.name} | ${row.purpose} |`);
  return rows.length ? ['| Route | Screen | Purpose |', '| --- | --- | --- |', ...rows].join('\n') : 'Screens are listed in ACCEPTANCE.md.';
}

export function buildMvpBrief(seed, spec) {
  const verified = verificationOf(spec);
  return `# ${text(seed.title)}: Gold-standard MVP brief

${text(spec.headline)}

${text(spec.subhead)}

| Item | Value |
| --- | --- |
| Category | ${text(spec.category) || 'not classified'} |
| Promise measured | ${text(spec.promise) || 'not stated'} |
| Entry pricing | ${text(spec.pricing) || 'not set'} |
| Teardown score | ${spec.score ?? 0}/100 |
| Forged | ${text(spec.forged_date).slice(0, 10) || 'today'} |
| Source verification | ${verified.traced}/${verified.total} claims traced to a page |

## Why this beats the field

${text(spec.wedge) || 'No single wedge was supported by the evidence. Re-run the forge.'}

## The competitive field

${competitorRows(spec)}

## Table stakes: what must match to be considered

${list(spec.parity_features, []).map((item) => `- ${item}`).join('\n') || '- None recorded.'}

## The wedge: what must go beyond

${wedgeRows(spec) || 'None recorded.'}

## Core loop

${text(spec.core_loop) || 'Not described.'}

## Screens this build ships

${screenRows(spec)}

## Acceptance criteria

${list(spec.acceptance_criteria, []).map((item) => `- [ ] ${item}`).join('\n') || '- [ ] Run ./verify.sh and check the primary flow by hand.'}

## Ways this thesis fails

${list(spec.risks, []).map((item) => `- ${item}`).join('\n') || '- No risk was recorded for this seed.'}

${buildVerificationSection(spec)}
`;
}