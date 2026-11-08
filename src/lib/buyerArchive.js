// The buyer archive: one profile per company, carrying the buyer-lead record the factory
// already holds plus the OSINT read of that company's current situation.
import JSZip from 'jszip';

const text = (value) => String(value ?? '').trim();
const section = (title, body) => (text(body) ? `## ${title}\n\n${text(body)}\n\n` : '');
const bulletList = (items) => (Array.isArray(items) && items.length
  ? items.filter(Boolean).map((item) => `- ${text(item)}`).join('\n')
  : '');
const slug = (name) => text(name).replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'buyer';

const CONFIDENCE = {
  verified: 'Verified in public sources',
  likely: 'Likely — corroborate before the first send',
  thin: 'Thin — not enough public evidence yet'
};

export function buyerMarkdown(buyer, intel) {
  const row = intel?.[buyer.company.toLowerCase()] || null;

  return [
    `# ${buyer.company}`,
    '',
    `_${buyer.category} · ${buyer.seeds.length} asset${buyer.seeds.length === 1 ? '' : 's'}${row ? ` · ${CONFIDENCE[row.confidence] || CONFIDENCE.thin}` : ' · not yet researched'}_`,
    '',
    section('What They Do Today', row?.snapshot),
    section('Recent Public Moves', bulletList(row?.recent_moves)),
    section('The Buying Trigger', row?.buying_trigger),
    section('Unique Insight', row?.unique_insight),
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

export async function buildBuyerArchive({ buyers, intel = {}, onProgress }) {
  const zip = new JSZip();
  const used = new Set();
  let files = 0;

  buyers.forEach((buyer, index) => {
    onProgress?.(index + 1, buyers.length, buyer.company);
    let name = slug(buyer.company);
    if (used.has(name)) name = `${name}_${index + 1}`;
    used.add(name);
    zip.file(`Buyers/${name}.md`, buyerMarkdown(buyer, intel));
    files += 1;
  });

  const researched = buyers.filter((buyer) => intel[buyer.company.toLowerCase()]).length;

  zip.file('Buyers/INDEX.md', [
    '# Buyer Book',
    '',
    `${buyers.length} named buyers across the ledger. ${researched} carry a current OSINT read; the rest are the factory's own lead records.`,
    '',
    '| Company | Category | Assets | Confidence | Trigger |',
    '| --- | --- | --- | --- | --- |',
    ...buyers.map((buyer) => {
      const row = intel[buyer.company.toLowerCase()];
      const trigger = text(row?.buying_trigger).replace(/\|/g, '/').slice(0, 140) || '—';
      return `| ${buyer.company.replace(/\|/g, '/')} | ${buyer.category} | ${buyer.seeds.length} | ${row ? row.confidence : 'unresearched'} | ${trigger} |`;
    })
  ].join('\n'));
  files += 1;

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
    total: buyers.length,
    filename: `investarch-buyers-${new Date().toISOString().slice(0, 10)}.zip`
  };
}