// Hunt scope for the IP Factory: the market vectors the Signal Miner sweeps,
// grouped into presets the UI can offer. Every hunt run receives the resolved
// vector briefs and must spread its signals across them.

export type IpVector = {
  id: string;
  label: string;
  brief: string;
  channels: string[];
};

export const IP_VECTORS: IpVector[] = [
  {
    id: 'fintech',
    label: 'Regulated finance',
    brief: 'Payments, lending, treasury operations, KYC/AML, reconciliation, embedded finance, capital markets plumbing.',
    channels: ['r/fintech and r/Accounting threads', 'bank core-vendor complaint forums', 'CFPB and OCC rulemaking comment files', 'USPTO class 705/235 filings']
  },
  {
    id: 'insuretech',
    label: 'Insurance & risk',
    brief: 'Underwriting workbenches, claims adjudication, actuarial operations, broker and MGA tooling, exposure data.',
    channels: ['r/InsuranceProfessional threads', 'AM Best and NAIC filings commentary', 'agent E&O complaint boards', 'state DOI rate filing dockets']
  },
  {
    id: 'legal',
    label: 'Legal & compliance operations',
    brief: 'Matter management, court and agency filing, contract lifecycle, e-discovery, regulatory change tracking.',
    channels: ['r/LawFirm and r/paralegal threads', 'state bar practice-management surveys', 'PACER and agency docket backlogs', 'legal-ops vendor G2 and Capterra reviews']
  },
  {
    id: 'healthcare',
    label: 'Healthcare & clinical operations',
    brief: 'Revenue cycle, prior authorization, clinical documentation, lab and pharmacy workflows, telehealth operations, credentialing.',
    channels: ['r/healthIT and r/CodingandBilling threads', 'CMS interoperability rules and FAQs', 'EHR app-store one-star reviews', 'hospital association staffing surveys']
  },
  {
    id: 'logistics',
    label: 'Logistics & trade',
    brief: 'Freight brokerage, last-mile routing, customs and trade documentation, warehousing, fleet compliance, drayage.',
    channels: ['r/FreightBrokers and r/logistics threads', 'FMCSA and CBP rule updates', 'TMS vendor review sites', 'shipper and 3PL conference Q&A boards']
  },
  {
    id: 'industrial',
    label: 'Industrial & manufacturing',
    brief: 'MES and quality systems, maintenance planning, PLM, machine data capture, supplier quality, shop-floor scheduling.',
    channels: ['r/manufacturing and r/PLC threads', 'ISO and Nadcap audit findings', 'automation-vendor forums', 'plant maintenance trade publications']
  },
  {
    id: 'energy',
    label: 'Energy & utilities',
    brief: 'Grid interconnection queues, utility data access, solar and storage operations, emissions accounting, demand response.',
    channels: ['FERC and state PUC dockets', 'r/energy and r/solar installer threads', 'utility interconnection queue reports', 'emissions disclosure rulemaking comments']
  },
  {
    id: 'agrifood',
    label: 'Agriculture & food',
    brief: 'Farm operations, traceability, cold chain, food-safety compliance, cooperative accounting, input procurement.',
    channels: ['r/farming and r/foodscience threads', 'USDA and FDA traceability rules', 'extension-office pain reports', 'cold-chain audit findings']
  },
  {
    id: 'construction',
    label: 'Construction & built environment',
    brief: 'Estimating and takeoff, permitting, submittals and RFIs, jobsite coordination, progress billing, inspection records.',
    channels: ['r/Construction and r/estimators threads', 'municipal permitting portal friction reports', 'AGC and ABC member surveys', 'Procore and Buildertrend review complaints']
  },
  {
    id: 'trades_smb',
    label: 'Trades & field service',
    brief: 'Field service scheduling, invoicing and collections, inventory for small operators, warranty and service history, dispatch.',
    channels: ['r/HVAC, r/electricians and r/Plumbing threads', 'field-service app one-star reviews', 'supplier counter and trade-association forums', 'SBA and SCORE small-business question boards']
  },
  {
    id: 'govtech',
    label: 'Public sector & procurement',
    brief: 'RFP and bid response, permitting and licensing, benefits eligibility, public-records response, civic data publishing.',
    channels: ['SAM.gov and state procurement portals', 'r/GovernmentContracting threads', 'city council and county board minutes', 'NASPO and NIGP member surveys']
  },
  {
    id: 'education',
    label: 'Education & credentialing',
    brief: 'Enrollment and student systems, learning operations, accreditation reporting, credential verification, transcript exchange.',
    channels: ['r/highereducation and r/Teachers threads', 'ED and state board reporting mandates', 'LMS procurement complaints', 'registrar and admissions listservs']
  },
  {
    id: 'nonprofits',
    label: 'Nonprofits & grantmaking',
    brief: 'Grant discovery, grant reporting compliance, donor operations, program measurement, fiscal sponsorship.',
    channels: ['r/nonprofit and r/grantwriting threads', 'foundation reporting requirement changes', 'NTEN and TechSoup member threads', '990 filing and audit findings']
  },
  {
    id: 'devinfra',
    label: 'Developer & infrastructure software',
    brief: 'CI/CD, observability, data pipelines, API platforms, self-hosted operations, migration and upgrade tooling.',
    channels: ['Hacker News and r/devops threads', 'GitHub issue backlogs on popular projects', 'cloud provider deprecation notices', 'Stack Overflow unanswered high-view questions']
  },
  {
    id: 'security',
    label: 'Security & identity',
    brief: 'Identity and access, threat detection, secrets management, software supply chain, compliance evidence collection.',
    channels: ['CISA advisories and KEV catalog', 'r/netsec and r/cybersecurity threads', 'SOC 2 and ISO audit finding patterns', 'bug-bounty disclosure writeups']
  },
  {
    id: 'dataai',
    label: 'Data & applied AI operations',
    brief: 'Model evaluation, data quality and lineage, retrieval infrastructure, agent operations, model governance and audit trails.',
    channels: ['r/MachineLearning and r/LLMDevs threads', 'EU AI Act and NIST framework guidance', 'MLOps vendor review complaints', 'open-source eval and observability issue trackers']
  }
];

export type IpPreset = {
  id: string;
  label: string;
  blurb: string;
  vectors: string[];
};

const ALL = IP_VECTORS.map((v) => v.id);

export const IP_PRESETS: IpPreset[] = [
  { id: 'all', label: 'All markets', blurb: 'Every vector in the taxonomy', vectors: ALL },
  { id: 'regulated', label: 'Regulated & money', blurb: 'Finance, insurance, legal, healthcare', vectors: ['fintech', 'insuretech', 'legal', 'healthcare'] },
  { id: 'physical', label: 'Physical economy', blurb: 'Logistics, industrial, energy, food, construction, trades', vectors: ['logistics', 'industrial', 'energy', 'agrifood', 'construction', 'trades_smb'] },
  { id: 'public', label: 'Public & institutional', blurb: 'Government, education, nonprofits', vectors: ['govtech', 'education', 'nonprofits'] },
  { id: 'software', label: 'Software & data', blurb: 'Dev infra, security, applied AI', vectors: ['devinfra', 'security', 'dataai'] }
];

export const DEFAULT_PRESET = 'all';

export function resolveVectors(preset?: string): IpVector[] {
  const chosen = IP_PRESETS.find((p) => p.id === preset) || IP_PRESETS[0];
  const picked = IP_VECTORS.filter((v) => chosen.vectors.includes(v.id));
  return picked.length ? picked : IP_VECTORS;
}

export function vectorBriefBlock(vectors: IpVector[]): string {
  return vectors
    .map((v) => `- ${v.label} (${v.id}): ${v.brief}\n  Evidence channels: ${v.channels.join('; ')}.`)
    .join('\n');
}