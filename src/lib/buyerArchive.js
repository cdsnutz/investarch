// The buyer archive: one profile per company, carrying the buyer-lead record the factory
// already holds plus the OSINT read of that company's current situation.
import JSZip from 'jszip';
import { researchSummary } from '@/lib/buyerSummary';
import { rankBuyers } from '@/lib/buyerScore';

const text = (value) => String(value ?? '').trim();
const section = (title, body) => (text(body) ? `## ${title}\n\n${text(body)}\n\n` : '');
const bulletList = (items) => (Array.isArray(items) && items.length
  ? items.filter(Boolean).map((item) => `- ${text(item)}`).join('\n')
  : '');
const slug = (name) => text(name).replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'buyer';

export function buyerMarkdown({ buyer, row, score, label, why }) {
  return [
    `# ${buyer.company}`,
    '',
    `_${buyer.category} · ${buyer.seeds.length} asset${buyer.seeds.length === 1 ? '' : 's'} · conviction ${score}/100 · ${label}_`,
    '',
    `## Conviction\n\n**${score}/100 — ${label}.** ${why}.\n`,
    section('What They Do Today', row?.snapshot),
    section('Recent Public Moves', bulletList(row?.recent_moves)),
    section('The Buying Trigger', row?.buying_trigger),
    section('Unique Insight', row?.unique_insight),
    section('Sources Read', bulletList(row?.sources)),
    section('Where to Verify Before Sending', row?.osint_angle),
    section('Why This Asset Fits Them', buyer.why_fit),
    section('Who Owns the Budget', buyer.contact_role),
    section('The Opening Move', buyer.approach),
    section('Proof to Lead With', buyer.evidence_to_lead_with),
    section('Assets That Fit', bulletList(buyer.seeds)),
    buyer.pitch
      ? `## First Touch${buyer.subject ? `: ${buyer.subject}` : ''}\n\n${buyer.pitch}\n${buyer.pitch_seed ? `\n_Written for ${buyer.pitch_seed}._\n` : ''}`
      : ''
  ].filter(Boolean).join('\n');
}

export async function buildBuyerArchive({ buyers, intel = {}, onProgress, failures = [] }) {
  const zip = new JSZip();
  const used = new Set();
  const ranked = rankBuyers(buyers, intel);
  let files = 0;

  ranked.forEach((entry, index) => {
    onProgress?.(index + 1, ranked.length, entry.buyer.company);
    let name = slug(entry.buyer.company);
    if (used.has(name)) name = `${name}_${index + 1}`;
    used.add(name);
    zip.file(`Buyers/${name}.md`, buyerMarkdown(entry));
    files += 1;
  });

  const researched = ranked.filter((entry) => entry.row).length;
  const highConviction = ranked.filter((entry) => entry.tier === 'high');

  zip.file('Buyers/INDEX.md', [
    '# Buyer Book',
    '',
    `${ranked.length} named buyers across the ledger, ranked by conviction: how deep the public-source read went, how many sources and dated moves it found, and how specifically it names the buying trigger. ${researched} carry a current OSINT read; the rest are the factory's own lead records and sit at the end.`,
    '',
    `## High-conviction targets (${highConviction.length})`,
    '',
    highConviction.length
      ? highConviction.slice(0, 30).map((entry, index) => `${index + 1}. **${entry.buyer.company}** — ${entry.score}/100 · ${entry.why}`).join('\n')
      : 'None cleared the high-conviction bar this run. The strongest Watch names below are the next best opening.',
    '',
    '## Every buyer, best first',
    '',
    '| # | Company | Conviction | Score | Category | Assets | Confidence | Trigger |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...ranked.map((entry, index) => {
      const trigger = text(entry.row?.buying_trigger).replace(/\|/g, '/').slice(0, 120) || '—';
      return `| ${index + 1} | ${entry.buyer.company.replace(/\|/g, '/')} | ${entry.label} | ${entry.score} | ${entry.buyer.category} | ${entry.buyer.seeds.length} | ${entry.row ? entry.row.confidence : 'unresearched'} | ${trigger} |`;
    })
  ].join('\n'));
  files += 1;

  const summary = researchSummary(buyers, intel, { failures });
  zip.file('Buyers/RESEARCH_SUMMARY.md', summary.markdown);
  zip.file('Buyers/RESEARCH_SUMMARY.pdf', summary.pdf);
  files += 2;

  zip.file('Buyers/buyers.json', JSON.stringify(
    buyers.map((buyer) => ({ ...buyer, intel: intel[buyer.company.toLowerCase()] || null })),
    null,
    2
  ));
  files += 1;

  zip.file('Buyers/README.md', [
    '# How this buyer book was built',
    '',
    'Every company here was named by the factory as a buyer of a specific asset. Each profile combines two records:',
    '',
    '1. **The lead record.** Why the company fits, who owns the budget, the opening move, the proof to lead with, and the first-touch email written for that company.',
    '2. **The OSINT read.** A profile assembled from public sources: what the company does today, its dated recent moves, the buying trigger those moves expose, and one non-obvious insight with the source it came from.',
    '',
    'Confidence is explicit. **Verified** means the insight is supported by a named public source. **Likely** means it is consistent with what is public but should be corroborated. **Thin** means public evidence was insufficient, and the profile says what is missing rather than filling the gap.',
    '',
    '**Conviction score.** Every buyer is scored out of 100 on the depth of the read, and the book is ordered best first: evidence grade (40), source URLs attached (20), dated public moves (15), specificity of the buying trigger (10), distinctiveness of the insight (10), and how many portfolio assets name the company (5). High conviction is 70 or above; a profile graded thin is capped at 44 and can never be a conviction target, whatever its prose.',
    '',
    'Re-check the sources listed under *Where to Verify Before Sending* before the first send. Nothing in this archive is a substitute for that check.'
  ].join('\n'));
  files += 1;

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 4 }
  });

  return {
    blob,
    files,
    researched,
    total: ranked.length,
    highConviction: highConviction.length,
    top: ranked.filter((entry) => entry.row).slice(0, 5).map((entry) => ({
      company: entry.buyer.company,
      score: entry.score,
      label: entry.label
    })),
    summary,
    filename: `investarch-buyers-${new Date().toISOString().slice(0, 10)}.zip`
  };
}