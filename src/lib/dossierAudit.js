// Verification of a dossier before it is packaged: every PDF must have real, complete copy,
// and the codebase inside the pack must pass its own three passes.

const REQUIREMENTS = {
  patent: [
    { field: 'abstract', label: 'Abstract', min: 200 },
    { field: 'claims', label: 'Claims', min: 400 },
    { field: 'detailed_description', label: 'Detailed Description', min: 400 }
  ],
  trademark: [
    { field: 'brand_name', label: 'Brand Name', min: 2 },
    { field: 'trademark_classes', label: 'Trademark Classes', min: 20 },
    { field: 'logo_concepts', label: 'Logo Concepts', min: 40 }
  ],
  deed: [{ field: 'deed_text', label: 'Deed text', min: 300 }],
  copyright: [{ field: 'copyright_text', label: 'Copyright application', min: 300 }]
};

const FILING_LABEL = {
  patent: '01_Patent_Application_Draft.pdf',
  trademark: '02_Trademark_Filing_Packet.pdf',
  deed: '03_Deed_of_Ownership.pdf',
  copyright: '04_Copyright_Registration_Application.pdf'
};

const BAD_TOKENS = [
  { re: /\$\{/, message: 'an unrendered template expression' },
  { re: /\bTODO\b/, message: 'a TODO marker' },
  { re: /\bundefined\b/, message: 'the word "undefined"' },
  { re: /\[object Object\]/, message: 'a stringified object' },
  { re: /\bNaN\b/, message: 'NaN' }
];

const text = (value) => (typeof value === 'string' ? value.trim() : '');

export function auditDossier({ seed, filings, prospectus, capital, kitReport }) {
  const issues = [];
  const add = (doc, level, message) => issues.push({ doc, level, message });
  let documents = 0;

  if (kitReport) documents += 1;

  if (!text(seed?.title)) add('Dossier', 'error', 'The asset has no title, so every document would ship untitled.');
  if (text(seed?.gap).length < 20) add('Dossier', 'error', 'The gap statement is missing, so the narrative has nothing to argue.');
  if (text(seed?.solution).length < 20) add('Dossier', 'error', 'The solution statement is missing.');
  if (!text(seed?.blueprint?.db_schema)) add('Dossier', 'error', 'The blueprint has no data model, so the codebase cannot be verified against it.');

  const byType = {};
  for (const filing of filings || []) {
    if (filing?.filing_type && !byType[filing.filing_type]) byType[filing.filing_type] = filing;
  }

  for (const [type, requirements] of Object.entries(REQUIREMENTS)) {
    const filing = byType[type];
    const file = FILING_LABEL[type];
    documents += 1;

    if (!filing) {
      add(file, 'error', 'The instrument is missing, so this PDF would be absent from the pack.');
      continue;
    }
    if (filing.status === 'drafted' && !text(filing.abstract || filing.claims || filing.deed_text || filing.copyright_text || filing.logo_concepts)) {
      add(file, 'error', 'The instrument was created but its body is empty.');
    }

    for (const item of requirements) {
      const value = text(filing[item.field]);
      if (!value) {
        add(file, 'error', item.label + ' is empty, so the page would ship blank.');
        continue;
      }
      if (value.length < item.min) {
        add(file, 'error', item.label + ' is ' + value.length + ' characters; at least ' + item.min + ' are needed for a submittable draft.');
      }
      for (const bad of BAD_TOKENS) {
        if (bad.re.test(value)) add(file, 'error', item.label + ' contains ' + bad.message + '.');
      }
    }
  }

  documents += 1;
  if (!prospectus) {
    add('05_Liquidation_Prospectus.pdf', 'error', 'The liquidation prospectus is missing, so no buyer-facing document ships.');
  } else {
    const body = text(prospectus.prospectus);
    if (body.length < 400) {
      add('05_Liquidation_Prospectus.pdf', 'error', 'The prospectus is ' + body.length + ' characters; at least 400 are needed to name a market and terms.');
    }
    if (!Array.isArray(prospectus.targets) || !prospectus.targets.filter((t) => text(t?.name)).length) {
      add('05_Liquidation_Prospectus.pdf', 'warn', 'No named buyer is listed, which weakens the offer.');
    }
    for (const bad of BAD_TOKENS) {
      if (bad.re.test(body)) add('05_Liquidation_Prospectus.pdf', 'error', 'The prospectus contains ' + bad.message + '.');
    }
  }

  const grants = Array.isArray(capital?.grants) ? capital.grants : [];
  documents += 1;
  if (!grants.length) {
    add('Grants/', 'error', 'No grant application was drafted, so the funding PDFs would be absent.');
  }
  grants.forEach((grant, index) => {
    const label = 'Grants/' + String(index + 1).padStart(2, '0') + '_' + (grant?.program || 'grant') + '.pdf';
    const body = text(grant?.application);
    if (!text(grant?.program)) add(label, 'error', 'The grant has no program name.');
    if (body.length < 300) {
      add(label, 'error', 'The application is ' + body.length + ' characters; a reviewer needs at least 300 to score it.');
    }
    for (const bad of BAD_TOKENS) {
      if (bad.re.test(body)) add(label, 'error', 'The application contains ' + bad.message + '.');
    }
  });

  documents += 1;
  if (!text(capital?.loan_proposal) || text(capital?.loan_proposal).length < 400) {
    add('07_Small_Business_Loan_Proposal.pdf', 'error', 'The loan proposal is missing or too short for a lender to assess.');
  }

  documents += 1;
  if (kitReport && !kitReport.ok) {
    add('Codebase/', 'error', 'The codebase inside the pack failed verification with ' + kitReport.errors.length + ' error(s).');
  }

  const errors = issues.filter((issue) => issue.level === 'error');
  return {
    ok: errors.length === 0,
    documents,
    issues,
    errors,
    warnings: issues.filter((issue) => issue.level === 'warn')
  };
}

export function dossierAuditNotes(audit, kitReport) {
  const lines = [];
  lines.push('# Pack verification');
  lines.push('');
  lines.push(
    audit.ok
      ? 'Every document and the codebase passed verification before this pack was written.'
      : 'This pack did not pass verification.'
  );
  lines.push('');
  lines.push('| Item | Check |');
  lines.push('| --- | --- |');
  lines.push('| Financial and legal drafts | ' + audit.documents + ' documents inspected for empty sections, short copy and unrendered tokens |');
  if (kitReport) {
    lines.push('| Codebase | ' + kitReport.files + ' files across three passes, ' + kitReport.errors.length + ' errors, ' + kitReport.warnings.length + ' notes |');
  }
  if (audit.warnings.length) {
    lines.push('');
    lines.push('## Advisory notes');
    lines.push('');
    for (const issue of audit.warnings) lines.push('- ' + issue.doc + ': ' + issue.message);
  }
  lines.push('');
  lines.push('PDFs are text-checked at build time; run the codebase verify.sh inside the pack for the runtime proof.');
  return lines.join('\n') + '\n';
}