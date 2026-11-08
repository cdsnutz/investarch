// Bulk archive of every seed: its dossier documents, its verified codebase and its buyer book.
//
// Documents ship as Markdown by default, or as a PDF set when the caller asks for one.
// Markdown is the default because the ledger holds thousands of seeds: rendered PDFs for all of
// them run to hundreds of megabytes and minutes of rendering, while the same text compresses to
// a few megabytes. PDF sets are therefore capped by the caller.
import JSZip from 'jszip';
import { appSlug } from '@/lib/scaffoldKit';
import { buildKitFiles } from '@/lib/buildKit';
import { renderDossierPdfs } from '@/lib/dossierPdf';
import { buildAgentReadme, buildAcceptanceGuide, buildDeploymentGuide } from '@/lib/agentDocs';

const text = (value) => String(value ?? '').trim();
const section = (title, body) => (text(body) ? `## ${title}\n\n${text(body)}\n\n` : '');
const document = (title, subtitle, body) => `# ${title}\n\n${subtitle ? `_${subtitle}_\n\n` : ''}${body.trim()}\n`;

export const isEcosystem = (seed) =>
  Boolean((seed?.source_seed_ids || []).length) || seed?.source_channel === 'seed mix';

const filingOf = (filings, type) => (filings || []).find((f) => f.filing_type === type);

export function seedDocuments(seed, { filings = [], prospectus = null } = {}) {
  const blueprint = seed.blueprint || {};
  const leads = Array.isArray(seed.buyer_leads) ? seed.buyer_leads : [];
  const stack = Array.isArray(blueprint.tech_stack) ? blueprint.tech_stack : [];
  const mixLine = seed.source_seed_titles?.length
    ? `Merged ecosystem of ${seed.source_seed_titles.join(' + ')}`
    : 'Single-asset seed';
  const tables = (String(blueprint.db_schema || '').match(/create\s+table\s+"?([\w.]+)"?/gi) || [])
    .map((line) => line.replace(/create\s+table\s+/i, '').replace(/"/g, ''));

  const files = [];
  const add = (path, content) => files.push({ path, content });

  add('Dossier/01_Asset_Thesis.md', document(`Asset Thesis: ${seed.title}`, mixLine, [
    section('Scores', [
      `Asymmetry: ${seed.asymmetric_score ?? '–'}/10`,
      seed.mix_score != null ? `Mix compounding: ${seed.mix_score}/10` : '',
      `Verdict: ${seed.strategy || 'hold'}`,
      `Status: ${seed.status || 'seed'}`,
      seed.yield_date ? `Yielded: ${seed.yield_date}` : ''
    ].filter(Boolean).join('\n')),
    section('The Gap', seed.gap),
    section('Pain Signal on Record', seed.pain_signal),
    section('Source Channel', seed.source_channel),
    section('The Solution', seed.solution),
    section('Mini-Plan', seed.mini_plan)
  ].join('')));

  const patent = filingOf(filings, 'patent');
  if (patent) {
    add('Dossier/02_Patent_Application_Draft.md', document(`Patent Application Draft: ${seed.title}`, 'Confidential instrument draft', [
      section('Abstract', patent.abstract),
      section('Claims', patent.claims),
      section('Detailed Description', patent.detailed_description),
      section('Prior Art Note', patent.prior_art_note)
    ].join('')));
  }

  const trademark = filingOf(filings, 'trademark');
  if (trademark) {
    add('Dossier/03_Trademark_Filing_Packet.md', document(`Trademark Filing Packet: ${seed.title}`, 'Confidential instrument draft', [
      section('Brand Name', trademark.brand_name),
      section('Trademark Classes', trademark.trademark_classes),
      section('Logo Concepts', trademark.logo_concepts),
      section('Clearance Note', trademark.clearance_note)
    ].join('')));
  }

  const deed = filingOf(filings, 'deed');
  if (deed) {
    add('Dossier/04_Deed_of_Ownership.md', document(`Deed of Ownership: ${seed.title}`, 'Confidential instrument draft', text(deed.deed_text)));
  }

  const copyright = filingOf(filings, 'copyright');
  if (copyright) {
    add('Dossier/05_Copyright_Registration.md', document(`Copyright Registration Application: ${seed.title}`, 'Draft for counsel review', text(copyright.copyright_text)));
  }

  if (prospectus) {
    const targets = Array.isArray(prospectus.targets) && prospectus.targets.length
      ? prospectus.targets.map((t) => `- **${t.name}**${t.rationale ? ` — ${t.rationale}` : ''}`).join('\n')
      : '';
    add('Dossier/06_Liquidation_Prospectus.md', document(`Liquidation Prospectus: ${seed.title}`, `Offer type: ${prospectus.offer_type || 'licensing'}`, [
      section('Prospectus', prospectus.prospectus),
      section('Named Targets', targets),
      section('Lead Contact', prospectus.lead_contact),
      section('Offer Terms', prospectus.offer_terms)
    ].join('')));
  }

  add('Dossier/07_Funding_Playbook.md', document(`Funding Playbook: ${seed.title}`, 'Instruments, evidence and disqualifiers, in the order they should be attempted', text(seed.funding_playbook) || 'No funding playbook drafted yet.'));

  const leadRows = leads.map((lead, index) => [
    `### ${index + 1}. ${lead.company}`,
    lead.why_fit ? `Why it fits: ${lead.why_fit}` : '',
    lead.contact_role ? `Who to reach: ${lead.contact_role}` : '',
    lead.approach ? `Opening move: ${lead.approach}` : '',
    lead.evidence_to_lead_with ? `Lead with: ${lead.evidence_to_lead_with}` : ''
  ].filter(Boolean).join('\n\n')).join('\n\n');

  add('Dossier/08_Acquisition_Playbook.md', document(`Acquisition Playbook: ${seed.title}`, `${leads.length} named buyer${leads.length === 1 ? '' : 's'} and the path to term sheet`, [
    section('Playbook', seed.acquisition_playbook),
    leadRows ? `## Named Buyers\n\n${leadRows}\n` : ''
  ].join('')));

  add('Dossier/09_Marketing_Plan.md', document(`Marketing Plan: ${seed.title}`, 'Buyer, wedge, first channel and the retention signal that proves it', text(seed.marketing_plan || seed.mini_plan) || 'No marketing plan recorded.'));
  add('Dossier/10_Research_Brief.md', document(`Research Brief: ${seed.title}`, 'What the record shows, what is assumed, and what would falsify it', [
    section('Brief', seed.research_brief),
    section('Pain Signal on Record', seed.pain_signal),
    section('Source Channel', seed.source_channel)
  ].join('')));
  add('Dossier/11_Seed_Architecture.md', document(`Seed Architecture: ${seed.title}`, mixLine, [
    section('Technology Stack', stack.length ? stack.join('\n') : 'No stack recorded.'),
    section('Tables', tables.length ? tables.join('\n') : 'No tables recorded.'),
    section('Ecosystem Interlocks', seed.ecosystem_interlocks)
  ].join('')));
  add('Dossier/12_Seed_Logic.md', document(`Seed Logic: ${seed.title}`, 'The mechanisms the generated application runs on', [
    section('Core Logic', blueprint.core_logic),
    section('Ecosystem Thesis', seed.mix_thesis),
    section('Interlocks', seed.ecosystem_interlocks),
    section('Gap the Logic Closes', seed.gap),
    section('Solution', seed.solution)
  ].join('')));
  add('Dossier/13_Seed_Data_Model.md', document(`Seed Data Model: ${seed.title}`, `${tables.length} table${tables.length === 1 ? '' : 's'} in the generated Postgres schema`, [
    section('Tables', tables.length ? tables.join('\n') : 'No tables recorded.'),
    section('Schema (PostgreSQL DDL)', blueprint.db_schema)
  ].join('')));
  add('Dossier/14_Seed_Strategy.md', document(`Seed Strategy: ${seed.title}`, `Portfolio verdict: ${seed.strategy || 'hold'}`, [
    section('Verdict', `${(seed.strategy || 'hold').toUpperCase()} — ${seed.strategy_note || 'no rationale recorded'}`),
    section('Go-to-Market Plan', seed.mini_plan)
  ].join('')));

  if (seed.hardening_report) {
    const report = seed.hardening_report;
    const pods = Array.isArray(report.pods) ? report.pods : [];
    add('Dossier/15_Codebase_Hardening_Report.md', document(
      `Codebase Hardening Report: ${seed.title}`,
      `Verdict: ${report.verdict || 'conditional'} · ${report.score ?? '–'}/100 · ${report.date ? String(report.date).slice(0, 10) : 'undated'}`,
      [
        section('Summary', report.summary),
        ...pods.map((pod) => section(
          `Pod: ${pod.pod}`,
          [...(pod.findings || []).map((f) => `Finding: ${f}`), ...(pod.fixes || []).map((f) => `Fix applied: ${f}`)].join('\n')
        ))
      ].join('')
    ));
  }

  if (leads.length) {
    add('Buyers/Buyer_Leads.md', document(`Buyer Leads: ${seed.title}`, `${leads.length} named buyers, each with a first-touch email`, leads.map((lead, index) => [
      `## ${index + 1}. ${lead.company}`,
      `Category: ${lead.category || 'incumbent'}`,
      lead.why_fit ? `**Why it fits.** ${lead.why_fit}` : '',
      lead.contact_role ? `**Who to reach.** ${lead.contact_role}` : '',
      lead.approach ? `**Opening move.** ${lead.approach}` : '',
      lead.evidence_to_lead_with ? `**Lead with.** ${lead.evidence_to_lead_with}` : '',
      lead.subject ? `**Subject.** ${lead.subject}` : '',
      lead.pitch ? `**First touch.**\n\n${lead.pitch}` : ''
    ].filter(Boolean).join('\n\n')).join('\n\n')));
    add('Buyers/buyer_leads.json', JSON.stringify(leads, null, 2));
  }

  add('Data/schema.sql', blueprint.db_schema || '-- no schema recorded');
  add('Data/seed_record.json', JSON.stringify(seed, null, 2));

  return files;
}

export function seedCodebase(seed, brand) {
  const files = buildKitFiles(seed, null, brand) || [];
  return [
    ...files.map((file) => ({ path: `Codebase/${file.path}`, content: file.content })),
    { path: 'Codebase/AGENTS.md', content: buildAgentReadme(seed, null) },
    { path: 'Codebase/ACCEPTANCE.md', content: buildAcceptanceGuide(seed, null) },
    { path: 'Codebase/DEPLOYMENT.md', content: buildDeploymentGuide(seed) }
  ];
}

function manifestFor(seed, entries, format) {
  return [
    `# ${seed.title} — Archive Manifest`,
    '',
    `${entries.length} files in this folder. Documents are ${format === 'pdf' ? 'PDF renderings' : 'Markdown renderings'} of the dossier pack; the codebase is the verified generated application.`,
    '',
    ...entries.map((entry) => `- \`${entry.path}\``)
  ].join('\n');
}

export async function buildSeedArchive({
  seeds,
  filingsBySeed = {},
  prospectusBySeed = {},
  brand = null,
  root = 'Seeds',
  format = 'markdown',
  onProgress
}) {
  const zip = new JSZip();
  const used = new Set();
  const skipped = [];
  let files = 0;

  for (let index = 0; index < seeds.length; index += 1) {
    const seed = seeds[index];
    onProgress?.(index + 1, seeds.length, seed.title || 'untitled seed');

    let folder = appSlug(seed) || 'ip-asset';
    if (used.has(folder)) folder = `${folder}-${String(seed.id || '').slice(0, 6)}`;
    used.add(folder);
    const base = `${root}/${folder}`;

    const authored = seedDocuments(seed, {
      filings: filingsBySeed[seed.id] || [],
      prospectus: prospectusBySeed[seed.id] || null
    });
    const entries = format === 'pdf' ? renderDossierPdfs(authored, seed.title) : authored;

    try {
      entries.push(...seedCodebase(seed, brand));
    } catch (problem) {
      const reason = problem?.message || 'codebase generation failed';
      skipped.push({ title: seed.title, reason });
      entries.push({
        path: 'Codebase/GENERATION_FAILED.md',
        content: `# Codebase not generated\n\n${reason}\n\nThe dossier documents in this folder are complete; the generated application could not be assembled from this blueprint.\n`
      });
    }

    entries.forEach((entry) => {
      zip.file(`${base}/${entry.path}`, entry.content);
      files += 1;
    });
    zip.file(`${base}/MANIFEST.md`, manifestFor(seed, entries, format));
    files += 1;

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 4 }
  });

  return {
    blob,
    files,
    skipped,
    filename: `investarch-${root.toLowerCase().replace(/\s+/g, '-')}${format === 'pdf' ? '-pdf' : ''}-${new Date().toISOString().slice(0, 10)}.zip`
  };
}