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
    id: 'agentic_ai',
    label: 'AI agents & autonomy',
    brief: 'Agent orchestration, tool calling, long-term memory, agent payments and identity, guardrails, evals for nondeterministic systems, agent-to-agent handoff.',
    channels: ['Hugging Face trending models and spaces', 'r/LocalLLaMA and r/AI_Agents threads', 'arXiv and model release notes', 'agent framework GitHub issue backlogs']
  },
  {
    id: 'dev_experience',
    label: 'AI-assisted development',
    brief: 'Coding assistants, repo context and retrieval, automated review, test synthesis, migration and refactor tooling, spec-to-code pipelines, agentic CI.',
    channels: ['Hacker News front page and Show HN', 'r/ExperiencedDevs and r/vibecoding threads', 'IDE extension one-star reviews', 'GitHub Copilot and Cursor community complaints']
  },
  {
    id: 'dataai',
    label: 'Data & applied AI operations',
    brief: 'Model evaluation, data quality and lineage, retrieval infrastructure, inference routing and cost control, model governance and audit trails.',
    channels: ['r/MachineLearning and r/LLMDevs threads', 'EU AI Act and NIST framework guidance', 'MLOps vendor review complaints', 'open-source eval and observability issue trackers']
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
    id: 'frontier_compute',
    label: 'Frontier compute',
    brief: 'GPU allocation and scheduling, inference cost routing, edge and on-device compute, accelerator abstraction, experimental quantum and bio-compute interfaces.',
    channels: ['cloud GPU pricing and availability trackers', 'r/hardware and r/MLQuestions threads', 'accelerator vendor launch notes', 'arXiv systems papers']
  },
  {
    id: 'robotics_embodied',
    label: 'Robotics & embodied systems',
    brief: 'Robot fleet operations, teleoperation, sim-to-real pipelines, embodied data collection, warehouse and mobile robot coordination.',
    channels: ['r/robotics and ROS Discourse threads', 'robot vendor integration complaints', 'DARPA and NSF program solicitations', 'embodied AI benchmark leaderboards']
  },
  {
    id: 'spatial_xr',
    label: 'Spatial & immersive',
    brief: 'AR and VR applications, 3D capture and reconstruction, spatial commerce, headset enterprise deployment, mixed-reality collaboration.',
    channels: ['visionOS and Quest store review complaints', 'r/virtualreality and r/augmentedreality threads', 'enterprise XR pilot case studies', '3D capture creator forums']
  },
  {
    id: 'viral_consumer',
    label: 'Viral consumer apps',
    brief: 'New social formats, single-purpose utilities with shareable output, habit loops, group and invite mechanics, breakouts on the app-store charts.',
    channels: ['App Store and Google Play top-chart movements', 'TikTok and Reels trend audio and format analysis', 'r/AppIdeas and r/SideProject threads', 'Product Hunt daily leaderboard comments']
  },
  {
    id: 'creator_economy',
    label: 'Creators & monetization',
    brief: 'Creator tooling, audience analytics, clipping and repurposing pipelines, sponsorship marketplaces, payout and rights management.',
    channels: ['r/NewTubers, r/Twitch and r/InstagramMarketing threads', 'creator platform policy and payout changes', 'sponsorship marketplace complaints', 'clipping and editing community threads']
  },
  {
    id: 'growth_ops',
    label: 'Growth & distribution',
    brief: 'Attribution and incrementality, referral mechanics, app-store optimization, lifecycle messaging, product-led growth instrumentation.',
    channels: ['r/marketing and r/SaaS growth threads', 'ASA and ASO benchmark reports', 'attribution vendor migration complaints', 'indie hacker revenue breakdown threads']
  },
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
    id: 'hr_talent',
    label: 'People, HR & payroll',
    brief: 'Recruiting operations, screening and credential checks, onboarding paperwork, payroll and benefits administration, workforce scheduling, time and attendance.',
    channels: ['r/humanresources and r/recruiting threads', 'SHRM member surveys and compliance alerts', 'HRIS vendor review complaints', 'state payroll and wage-regulation notices']
  },
  {
    id: 'marketplaces',
    label: 'Marketplaces & matching',
    brief: 'Two-sided marketplaces, supply and demand matching, take-rate and trust mechanics, payouts to sellers, dispute and refund operations.',
    channels: ['r/marketplace and r/ecommerce threads', 'marketplace seller-forum payout complaints', 'trust-and-safety incident writeups', 'platform policy-change threads']
  },
  {
    id: 'commerce_retail',
    label: 'Retail & commerce operations',
    brief: 'Inventory and replenishment, order routing, returns and reverse logistics, pricing and promotion execution, wholesale and CPG trade operations.',
    channels: ['r/ecommerce, r/retail and r/FulfillmentByAmazon threads', 'Shopify and marketplace app one-star reviews', 'NRF member surveys', 'wholesale and broker complaint boards']
  },
  {
    id: 'media_rights',
    label: 'Media, publishing & rights',
    brief: 'Rights and royalties, content licensing, editorial workflow, subscriber operations, ad operations and yield, archives and asset management.',
    channels: ['r/publishing, r/editors and r/adops threads', 'royalty-statement and rights-dispute threads', 'publisher platform policy changes', 'newsroom and trade-publication postmortems']
  },
  {
    id: 'travel_hospitality',
    label: 'Travel & hospitality',
    brief: 'Property management, rate and revenue management, booking and distribution, guest operations, tour and activity operators, multi-property accounting.',
    channels: ['r/askhotels and r/travelagents threads', 'OTA and channel-manager integration complaints', 'HSMAI and AHLA member surveys', 'short-term-rental host forums']
  },
  {
    id: 'proptech_realestate',
    label: 'Property & real estate',
    brief: 'Listings and syndication, property management, leasing and renewals, title and closing, valuations and inspections, HOA and portfolio accounting.',
    channels: ['r/realestate and r/PropertyManagement threads', 'MLS and brokerage compliance rule changes', 'title and closing vendor complaint boards', 'NAR and state realtor association surveys']
  },
  {
    id: 'mobility_auto',
    label: 'Fleets, mobility & automotive',
    brief: 'Fleet operations and telematics, dealership F&I and inventory, EV charging operations, roadside and claims workflows, last-mile and delivery fleets.',
    channels: ['r/justrolledintotheshop and r/FleetManagement threads', 'NHTSA and FMCSA rule updates', 'dealership DMS vendor complaints', 'charging-network uptime reports']
  },
  {
    id: 'telecom_network',
    label: 'Telecom & networking',
    brief: 'Network operations and provisioning, connectivity ordering, usage and billing mediation, subscriber support, tower and fibre asset records.',
    channels: ['r/networking, r/telecom and r/sysadmin threads', 'FCC and state PUC filings', 'OSS/BSS vendor integration complaints', 'ISP operator forums']
  },
  {
    id: 'defense_space',
    label: 'Defense, space & public safety',
    brief: 'Defense procurement and compliance, export control, satellite and ground-segment operations, mission data handling, emergency response coordination.',
    channels: ['SAM.gov and DIU solicitations', 'ITAR and CMMC guidance updates', 'r/space and r/defensecontracting threads', 'GAO bid-protest decisions']
  },
  {
    id: 'sports_wellness',
    label: 'Sport, fitness & wellness',
    brief: 'Club and league operations, memberships and billing, class scheduling, athlete performance data, clinic and studio management, waivers and compliance.',
    channels: ['r/personaltraining, r/gymowners and r/Coaching threads', 'studio-management app one-star reviews', 'league and federation rule changes', 'club-owner association forums']
  }
];

export type IpPreset = {
  id: string;
  label: string;
  blurb: string;
  vectors: string[];
};

export const IP_PRESETS: IpPreset[] = [
  { id: 'all', label: 'All markets', blurb: 'Every vector in the taxonomy', vectors: IP_VECTORS.map((v) => v.id) },
  { id: 'frontier', label: 'Frontier tech', blurb: 'Agents, dev tools, compute, robotics, spatial', vectors: ['agentic_ai', 'dev_experience', 'dataai', 'devinfra', 'security', 'frontier_compute', 'robotics_embodied', 'spatial_xr'] },
  { id: 'viral', label: 'Viral & consumer', blurb: 'Consumer breakouts, creators, growth', vectors: ['viral_consumer', 'creator_economy', 'growth_ops', 'dev_experience'] },
  { id: 'software', label: 'Software & data', blurb: 'Dev infra, security, applied AI, agents', vectors: ['devinfra', 'security', 'dataai', 'dev_experience', 'agentic_ai', 'frontier_compute'] },
  { id: 'regulated', label: 'Regulated & money', blurb: 'Finance, insurance, legal, healthcare', vectors: ['fintech', 'insuretech', 'legal', 'healthcare'] },
  { id: 'physical', label: 'Physical economy', blurb: 'Logistics, industry, energy, food, construction, trades, fleets, telecom', vectors: ['logistics', 'industrial', 'energy', 'agrifood', 'construction', 'trades_smb', 'mobility_auto', 'telecom_network'] },
  { id: 'public', label: 'Public & institutional', blurb: 'Government, education, nonprofits, defense', vectors: ['govtech', 'education', 'nonprofits', 'defense_space'] },
  { id: 'commerce', label: 'Commerce & property', blurb: 'Retail, marketplaces, media, travel, real estate', vectors: ['commerce_retail', 'marketplaces', 'media_rights', 'travel_hospitality', 'proptech_realestate', 'growth_ops'] },
  { id: 'people', label: 'People & wellness', blurb: 'HR, education, health, sport', vectors: ['hr_talent', 'education', 'healthcare', 'sports_wellness'] }
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