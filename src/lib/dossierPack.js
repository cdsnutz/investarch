import JSZip from 'jszip';
import { buildPdf } from '@/lib/pdfBuilder';
import { buildAgentReadme, buildDeploymentGuide, buildScaffoldGuide, buildAcceptanceGuide } from '@/lib/agentDocs';
import { buildEnvExample, buildRoadmap, antislopFiles, devproDeployFiles, buildSeedScript } from '@/lib/scaffoldKit';
import { buildKitFiles } from '@/lib/buildKit';
import { entityModel } from '@/lib/kit/model';
import { normalizeBrand } from '@/lib/kit/brand';
import { auditKit } from '@/lib/kit/audit';
import { auditDossier, dossierAuditNotes } from '@/lib/dossierAudit';

const EXTENSIONS_NOTE = `# Extensions, not yet verified

These files were written by the model that architected this codebase. They live beside the
verified application rather than inside it, because they have not been reconciled with the
generated schema, routes or screens.

Read one, prove it against \`./verify.sh\`, then move it into the app in a normal commit.
Nothing here is loaded by the application.`;

function splitIntoSections(text) {
  const sections = [];
  let current = null;
  (text || '').split('\n').forEach((line) => {
    const match = line.match(/^(#{1,4})\s+(.*)/);
    if (match) {
      if (current) sections.push(current);
      current = { heading: match[2].trim(), body: '' };
    } else if (!current) {
      current = { heading: 'Overview', body: line };
    } else {
      current.body += (current.body ? '\n' : '') + line;
    }
  });
  if (current) sections.push(current);
  return sections.map((s) => ({ heading: s.heading, body: s.body.trim() })).filter((s) => s.heading || s.body);
}

export async function buildDossierPack({ seed, filings, prospectus, codebase, capital, brand }) {
  const zip = new JSZip();
  const base = (seed.title || 'IP-Asset').replace(/[^\w\s-]/g, '').trim() || 'IP-Asset';

  const byType = {};
  (filings || []).forEach((f) => { if (!byType[f.filing_type]) byType[f.filing_type] = f; });

  if (byType.patent) {
    const p = byType.patent;
    const sections = [
      { heading: 'Abstract', body: p.abstract || '' },
      { heading: 'Claims', body: p.claims || '' },
      { heading: 'Detailed Description', body: p.detailed_description || '' },
      ...(p.prior_art_note ? [{ heading: 'Prior Art Note', body: p.prior_art_note }] : [])
    ];
    zip.file(`${base}/01_Patent_Application_Draft.pdf`, buildPdf({
      title: `Patent Application Draft: ${seed.title}`,
      subtitle: 'Confidential instrument draft, prepared by InvestArch IP Factory',
      sections,
      footer: 'Patent Application Draft — Confidential'
    }));
  }

  if (byType.trademark) {
    const t = byType.trademark;
    const sections = [
      { heading: 'Brand Name', body: t.brand_name || '' },
      { heading: 'Trademark Classes', body: t.trademark_classes || '' },
      { heading: 'Logo Concepts', body: t.logo_concepts || '' },
      ...(t.clearance_note ? [{ heading: 'Clearance Note', body: t.clearance_note }] : [])
    ];
    zip.file(`${base}/02_Trademark_Filing_Packet.pdf`, buildPdf({
      title: `Trademark Filing Packet: ${seed.title}`,
      subtitle: 'Confidential instrument draft, prepared by InvestArch IP Factory',
      sections,
      footer: 'Trademark Filing Packet — Confidential'
    }));
  }

  if (byType.deed) {
    const d = byType.deed;
    zip.file(`${base}/03_Deed_of_Ownership.pdf`, buildPdf({
      title: `Deed of Ownership: ${seed.title}`,
      subtitle: 'Confidential instrument draft, prepared by InvestArch IP Factory',
      sections: splitIntoSections(d.deed_text),
      footer: 'Deed of Ownership — Confidential'
    }));
  }

  if (byType.copyright) {
    zip.file(`${base}/04_Copyright_Registration_Application.pdf`, buildPdf({
      title: `Copyright Registration Application: ${seed.title}`,
      subtitle: 'U.S. Copyright Office Standard Application, draft for counsel review',
      sections: splitIntoSections(byType.copyright.copyright_text),
      footer: 'Copyright Registration Application — Confidential'
    }));
  }

  (capital?.grants || []).forEach((g, i) => {
    const name = (g.program || `Grant ${i + 1}`).replace(/[^\w\s-]/g, '').trim();
    zip.file(`${base}/Grants/${String(i + 1).padStart(2, '0')}_${name}.pdf`, buildPdf({
      title: `${g.program} Application: ${seed.title}`,
      subtitle: `${g.agency}. Award: ${g.award_range || 'see program'}. Deadline: ${g.deadline || 'see program'}`,
      sections: [
        { heading: 'Program Source', body: g.url },
        { heading: 'Eligibility', body: g.eligibility },
        ...splitIntoSections(g.application)
      ],
      footer: `${g.program} Application — Confidential`
    }));
  });

  if (capital?.loan_proposal) {
    zip.file(`${base}/07_Small_Business_Loan_Proposal.pdf`, buildPdf({
      title: `Small Business Loan Proposal: ${seed.title}`,
      subtitle: 'Prepared for commercial bank / SBA 7(a) lender review',
      sections: splitIntoSections(capital.loan_proposal),
      footer: 'Loan Proposal — Confidential'
    }));
  }

  zip.file(`${base}/Codebase/AGENTS.md`, buildAgentReadme(seed, codebase));
  zip.file(`${base}/Codebase/README.md`, buildAgentReadme(seed, codebase));
  zip.file(`${base}/Codebase/DEPLOYMENT.md`, buildDeploymentGuide(seed));
  zip.file(`${base}/Codebase/ROADMAP.md`, buildRoadmap(seed));
  zip.file(`${base}/Codebase/SCAFFOLD.md`, buildScaffoldGuide(seed, codebase));
  zip.file(`${base}/Codebase/ACCEPTANCE.md`, buildAcceptanceGuide(seed, codebase));
  zip.file(`${base}/Codebase/database/seed.js`, buildSeedScript(seed), { unixPermissions: '755' });
  zip.file(`${base}/Codebase/.env.example`, buildEnvExample(seed));
  [...antislopFiles(), ...devproDeployFiles()].forEach((f) => zip.file(`${base}/Codebase/${f.path}`, f.content, f.path.endsWith('.sh') ? { unixPermissions: '755' } : undefined));

  const kit = buildKitFiles(seed, codebase, brand);
  const kitReport = auditKit(kit, { entities: entityModel(seed), brand: normalizeBrand(brand, seed) });
  const audit = auditDossier({ seed, filings, prospectus, capital, kitReport });

  if (!audit.ok) {
    const first = audit.errors[0];
    const problem = new Error(
      `Dossier blocked by verification: ${audit.errors.length} error${audit.errors.length === 1 ? '' : 's'}. ${first.doc}: ${first.message}`
    );
    problem.report = audit;
    throw problem;
  }

  kit.forEach((f) =>
    zip.file(`${base}/Codebase/${f.path}`, f.content, f.executable ? { unixPermissions: '755' } : undefined)
  );
  zip.file(`${base}/QA_REPORT.md`, dossierAuditNotes(audit, kitReport));

  if (codebase) {
    (codebase.files || []).forEach((f) => {
      if (!f?.path || f.path === 'package.json') return;
      zip.file(`${base}/Codebase/extensions/${f.path}`, f.content || '');
    });
    zip.file(`${base}/Codebase/extensions/README.md`, EXTENSIONS_NOTE);
    zip.file(`${base}/Codebase/Developer_Onboarding_Guide.md`, codebase.onboarding_guide || '');
    zip.file(`${base}/Codebase/User_Manual.md`, codebase.user_manual || '');
  }

  if (codebase?.onboarding_guide) {
    zip.file(`${base}/06_Developer_Onboarding_Guide.pdf`, buildPdf({
      title: `Developer Onboarding Guide: ${seed.title}`,
      subtitle: 'Architecture, setup and extension points for the engineering team',
      sections: splitIntoSections(codebase.onboarding_guide),
      footer: 'Developer Onboarding Guide — Confidential'
    }));
  }

  if (prospectus) {
    const sections = [
      { heading: 'Prospectus', body: prospectus.prospectus || '' },
      ...(Array.isArray(prospectus.targets) && prospectus.targets.length ? [{
        heading: 'Named Targets',
        body: prospectus.targets.map((t) => `${t.name}${t.rationale ? ' — ' + t.rationale : ''}`).join('\n')
      }] : []),
      ...(prospectus.lead_contact ? [{ heading: 'Lead Contact', body: prospectus.lead_contact }] : []),
      ...(prospectus.offer_terms ? [{ heading: `Offer Terms (${prospectus.offer_type})`, body: prospectus.offer_terms }] : [])
    ];
    zip.file(`${base}/05_Liquidation_Prospectus.pdf`, buildPdf({
      title: `Liquidation Prospectus: ${seed.title}`,
      subtitle: `Offer type: ${prospectus.offer_type || 'licensing'}. Confidential, prepared by InvestArch IP Factory`,
      sections,
      footer: 'Liquidation Prospectus — Confidential'
    }));
  }

  const blueprint = seed.blueprint || {};
  const stack = Array.isArray(blueprint.tech_stack) ? blueprint.tech_stack : [];
  const leads = Array.isArray(seed.buyer_leads) ? seed.buyer_leads : [];
  const mixLine = Array.isArray(seed.source_seed_titles) && seed.source_seed_titles.length
    ? `Merged ecosystem of ${seed.source_seed_titles.join(' + ')}`
    : 'Single-asset seed';

  if (seed.funding_playbook) {
    zip.file(`${base}/08_Funding_Playbook.pdf`, buildPdf({
      title: `Funding Playbook: ${seed.title}`,
      subtitle: 'Instruments, evidence and disqualifiers, in the order they should be attempted',
      sections: splitIntoSections(seed.funding_playbook),
      footer: 'Funding Playbook — Confidential'
    }));
  }

  if (seed.acquisition_playbook || leads.length) {
    const leadSections = leads.map((lead, i) => ({
      heading: `${i + 1}. ${lead.company}`,
      body: [
        lead.why_fit ? `Why it fits: ${lead.why_fit}` : '',
        lead.contact_role ? `Who to reach: ${lead.contact_role}` : '',
        lead.approach ? `Opening move: ${lead.approach}` : '',
        lead.evidence_to_lead_with ? `Lead with: ${lead.evidence_to_lead_with}` : ''
      ].filter(Boolean).join('\n')
    }));
    zip.file(`${base}/09_Acquisition_Playbook.pdf`, buildPdf({
      title: `Acquisition Playbook: ${seed.title}`,
      subtitle: `${leads.length} named buyer${leads.length === 1 ? '' : 's'}, the packaging argument, and the path to term sheet`,
      sections: [...splitIntoSections(seed.acquisition_playbook || ''), ...leadSections],
      footer: 'Acquisition Playbook — Confidential'
    }));
  }

  zip.file(`${base}/10_Seed_Architecture.pdf`, buildPdf({
    title: `Seed Architecture: ${seed.title}`,
    subtitle: mixLine,
    sections: [
      { heading: 'Asset', body: `${seed.title}\n${mixLine}\nVerdict: ${seed.strategy || 'hold'}${seed.asymmetric_score != null ? ` · asymmetry ${seed.asymmetric_score}/10` : ''}` },
      { heading: 'Technology Stack', body: stack.length ? stack.join('\n') : 'No stack recorded.' },
      { heading: 'Repository Layout', body: kit.map((f) => f.path).join('\n') },
      { heading: 'Runtime and Deployment', body: splitIntoSections(buildDeploymentGuide(seed)).map((s) => `${s.heading}\n${s.body}`).join('\n\n') }
    ],
    footer: 'Seed Architecture — Confidential'
  }));

  zip.file(`${base}/11_Seed_Logic.pdf`, buildPdf({
    title: `Seed Logic: ${seed.title}`,
    subtitle: 'The mechanisms the generated application runs on',
    sections: [
      { heading: 'Core Logic', body: blueprint.core_logic || 'No core logic recorded.' },
      ...(seed.mix_thesis ? [{ heading: 'Ecosystem Thesis', body: seed.mix_thesis }] : []),
      ...(seed.ecosystem_interlocks ? [{ heading: 'Interlocks', body: seed.ecosystem_interlocks }] : []),
      { heading: 'Gap the Logic Closes', body: seed.gap || '' },
      { heading: 'Solution', body: seed.solution || '' }
    ],
    footer: 'Seed Logic — Confidential'
  }));

  const tables = (String(blueprint.db_schema || '').match(/create\s+table\s+"?([\w.]+)"?/gi) || []).map((m) => m.replace(/create\s+table\s+/i, '').replace(/"/g, ''));
  zip.file(`${base}/12_Seed_Data_Model.pdf`, buildPdf({
    title: `Seed Data Model: ${seed.title}`,
    subtitle: `${tables.length} table${tables.length === 1 ? '' : 's'} in the generated Postgres schema`,
    sections: [
      { heading: 'Tables', body: tables.length ? tables.join('\n') : 'No tables recorded.' },
      { heading: 'Schema (PostgreSQL DDL)', body: blueprint.db_schema || 'No schema recorded.' }
    ],
    footer: 'Seed Data Model — Confidential'
  }));

  zip.file(`${base}/13_Seed_Strategy.pdf`, buildPdf({
    title: `Seed Strategy: ${seed.title}`,
    subtitle: `Portfolio verdict: ${seed.strategy || 'hold'}`,
    sections: [
      { heading: 'Verdict', body: `${(seed.strategy || 'hold').toUpperCase()} — ${seed.strategy_note || 'no rationale recorded'}` },
      { heading: 'Scores', body: [`Asymmetry: ${seed.asymmetric_score ?? '–'}/10`, seed.mix_score != null ? `Mix compounding: ${seed.mix_score}/10` : '', `Status: ${seed.status || 'seed'}`, seed.yield_date ? `Yielded: ${seed.yield_date}` : ''].filter(Boolean).join('\n') },
      ...(mixLine ? [{ heading: 'Ecosystem', body: mixLine }] : []),
      { heading: 'Go-to-Market Plan', body: seed.mini_plan || 'No plan recorded.' }
    ],
    footer: 'Seed Strategy — Confidential'
  }));

  zip.file(`${base}/14_Seed_Marketing_Plan.pdf`, buildPdf({
    title: `Marketing Plan: ${seed.title}`,
    subtitle: 'Buyer, wedge, first channel and the retention signal that proves it',
    sections: splitIntoSections(seed.marketing_plan || seed.mini_plan || 'No marketing plan recorded.'),
    footer: 'Marketing Plan — Confidential'
  }));

  zip.file(`${base}/15_Seed_Research_Brief.pdf`, buildPdf({
    title: `Research Brief: ${seed.title}`,
    subtitle: 'What the record shows, what is assumed, and what would falsify it',
    sections: [
      ...splitIntoSections(seed.research_brief || ''),
      { heading: 'Pain Signal on Record', body: seed.pain_signal || 'No pain signal recorded.' },
      { heading: 'Source Channel', body: seed.source_channel || 'Not recorded.' }
    ],
    footer: 'Research Brief — Confidential'
  }));

  if (seed.hardening_report) {
    const report = seed.hardening_report;
    const pods = Array.isArray(report.pods) ? report.pods : [];
    zip.file(`${base}/16_Codebase_Hardening_Report.pdf`, buildPdf({
      title: `Codebase Hardening Report: ${seed.title}`,
      subtitle: `Verdict: ${report.verdict || 'conditional'} · ${report.score ?? '–'}/100 · ${report.date ? String(report.date).slice(0, 10) : 'undated'}`,
      sections: [
        { heading: 'Summary', body: report.summary || '' },
        ...pods.map((pod) => ({
          heading: `Pod: ${pod.pod}`,
          body: [
            ...(pod.findings || []).map((f) => `Finding: ${f}`),
            ...(pod.fixes || []).map((f) => `Fix applied: ${f}`)
          ].join('\n')
        }))
      ],
      footer: 'Codebase Hardening Report — Confidential'
    }));
  }

  ['USER_GUIDE.md', 'TECHNICAL_GUIDE.md', 'MANIFEST.md'].forEach((name) => {
    const doc = kit.find((f) => f.path === name);
    if (doc) zip.file(`${base}/Documentation/${name}`, doc.content);
  });

  zip.file(`${base}/Data/schema.sql`, blueprint.db_schema || '-- no schema recorded');
  zip.file(`${base}/Data/seed_record.json`, JSON.stringify(seed, null, 2));

  const packed = Object.keys(zip.files).filter((path) => !zip.files[path].dir).sort();
  zip.file(`${base}/PACK_MANIFEST.md`, [
    `# ${base} — Dossier Pack Manifest`,
    '',
    `${packed.length} files in this pack, listed below. Every document is generated from the seed record; nothing here is a placeholder.`,
    '',
    ...packed.map((path) => `- \`${path.replace(`${base}/`, '')}\``)
  ].join('\n'));

  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}