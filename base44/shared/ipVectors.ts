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
  },
  {
    id: 'knowledge_work',
    label: 'Knowledge work & internal search',
    brief: 'Internal search across docs and messages, meeting memory and decision trails, knowledge capture that survives staff turnover, structured notes for regulated roles.',
    channels: ['r/KnowledgeManagement and r/Notion threads', 'enterprise search and wiki migration complaints', 'r/consulting and r/accounting note-taking threads', 'productivity-tool cancellation surveys']
  },
  {
    id: 'support_ops',
    label: 'Customer support operations',
    brief: 'Helpdesk routing, answer deflection, quality review of AI-drafted replies, escalation policy, staffing forecasts, multilingual coverage.',
    channels: ['r/CustomerSuccess and r/sysadmin helpdesk threads', 'Zendesk and Intercom app-marketplace reviews', 'support-leader salary and staffing surveys', 'churn postmortems that name slow support']
  },
  {
    id: 'sales_ops',
    label: 'Revenue & sales operations',
    brief: 'Pipeline hygiene, quote and CPQ configuration, territory and commission math, deal-desk approvals, forecast accuracy, sales-asset versioning.',
    channels: ['r/sales and r/salesforce threads', 'CRM admin and consultant complaint boards', 'RevOps salary and benchmark surveys', 'commission-dispute threads in SaaS communities']
  },
  {
    id: 'crm_lifecycle',
    label: 'Marketing technology & lifecycle',
    brief: 'CRM data quality and dedupe, lifecycle messaging orchestration, consent and preference tracking, campaign build and QA, marketing-to-billing handoff.',
    channels: ['r/marketing and r/MarketingAutomation threads', 'HubSpot and Marketo integration complaints', 'GDPR and consent-enforcement guidance', 'martech replacement threads in r/SaaS']
  },
  {
    id: 'adtech_measurement',
    label: 'Advertising & measurement',
    brief: 'Campaign build at volume, creative production and localisation, incrementality and attribution, spend pacing, retail-media and clean-room reporting.',
    channels: ['r/PPC and r/adops threads', 'ad-platform policy and deprecation notices', 'agencies posting about reporting pain', 'MMM and incrementality experiment write-ups']
  },
  {
    id: 'compliance_ops',
    label: 'Compliance, privacy & audit readiness',
    brief: 'SOC 2 and ISO evidence collection, vendor risk and questionnaire response, data-subject requests, policy attestation, audit finding remediation.',
    channels: ['r/cybersecurity GRC threads', 'Vanta and Drata customer complaint threads', 'state privacy-law effective-date trackers', 'auditor and vCISO practice forums']
  },
  {
    id: 'open_source_ops',
    label: 'Open-source maintenance & supply chain',
    brief: 'Maintainer funding and sustainability, dependency and licence health, security-patch propagation, fork and vendor-abandonment risk, contribution operations.',
    channels: ['GitHub issue backlogs on critical libraries', 'Open Source Pledge and funding discussions', 'OSV and CISA supply-chain advisories', 'r/opensource maintainer burnout threads']
  },
  {
    id: 'semiconductors',
    label: 'Semiconductors & chip supply',
    brief: 'Design flow and verification, EDA tool sprawl, fab yield analysis, packaging and test, allocation and allocation disputes, export-control screening.',
    channels: ['r/chipdesign and r/FPGA threads', 'SEMI and SIA capacity reports', 'BIS export-control rule updates', 'tape-out postmortems in engineering blogs']
  },
  {
    id: 'hardware_iot',
    label: 'Hardware & connected devices',
    brief: 'Device fleets and firmware updates, provisioning at scale, field-failure analytics, certification and labelling, returns and refurbishment, embedded supply planning.',
    channels: ['r/embedded and r/IOT threads', 'device-cloud vendor outage postmortems', 'FCC and CE certification guidance', 'hardware-founder failure retrospectives']
  },
  {
    id: 'gamedev',
    label: 'Games & interactive entertainment',
    brief: 'Studio production and milestone tracking, live-ops and economy tuning, player support at scale, UGC moderation, storefront and platform compliance, playtest operations.',
    channels: ['r/gamedev and r/gamedev postmortems', 'Steam and console storefront policy changes', 'GDC survey and talk write-ups', 'live-service shutdown and sunset threads']
  },
  {
    id: 'banking_credit',
    label: 'Banking, lending & credit',
    brief: 'Core banking and deposits, loan origination and servicing, credit unions and community banks, mortgage pipelines, collections and workout, regulatory reporting.',
    channels: ['r/Banking and r/creditunions threads', 'FDIC and OCC consent orders', 'core-vendor migration complaints', 'loan-officer and servicing forums']
  },
  {
    id: 'capital_markets',
    label: 'Capital markets & asset management',
    brief: 'Order and portfolio operations, fund administration, investor reporting and capital calls, diligence data rooms, valuation and NAV workflows, research compliance.',
    channels: ['r/FinancialCareers and r/quant threads', 'SEC and FINRA rulemaking notices', 'fund-admin and transfer-agent complaints', 'allocator due-diligence questionnaires']
  },
  {
    id: 'payments_infra',
    label: 'Payments infrastructure',
    brief: 'Merchant acquiring and onboarding, payouts and reconciliation, cross-border and FX, chargeback and dispute operations, platform and marketplace money movement.',
    channels: ['r/payments and r/fintech threads', 'card-network rule and interchange updates', 'processor outage postmortems', 'merchant complaint boards on reserve holds']
  },
  {
    id: 'accounting_tax',
    label: 'Accounting, tax & audit',
    brief: 'Bookkeeping and month-end close, tax preparation and multi-state filing, audit workpapers, multi-entity consolidation, expense and revenue recognition.',
    channels: ['r/Accounting threads on close and busy season', 'IRS and state tax-notice guidance', 'firm-management software complaints', 'CPA society practice surveys']
  },
  {
    id: 'crypto_onchain',
    label: 'Onchain finance & digital assets',
    brief: 'Custody and key management, onchain accounting and tax, token and staking compliance, node and validator operations, on/off ramps, treasury for digital-asset businesses.',
    channels: ['r/ethdev and r/CryptoTechnology threads', 'IRS digital-asset guidance and enforcement', 'protocol governance and upgrade forums', 'exchange and custodian incident postmortems']
  },
  {
    id: 'pharma_lifesci',
    label: 'Pharmaceutical & life-science operations',
    brief: 'Clinical-trial operations and site coordination, regulatory submissions, pharmacovigilance case handling, medical and regulatory affairs, commercial compliance.',
    channels: ['r/clinicalresearch and r/biotech threads', 'FDA guidance and warning letters', 'site and CRO start-up complaints', 'DIA and RAPS practitioner forums']
  },
  {
    id: 'biotech_lab',
    label: 'Laboratory & research science',
    brief: 'Lab informatics and LIMS, sequencing and assay pipelines, sample and reagent inventory, instrument scheduling, reproducibility and protocol records.',
    channels: ['r/labrats and r/bioinformatics threads', 'LIMS migration complaint threads', 'NIH and NSF data-sharing mandates', 'core-facility director forums']
  },
  {
    id: 'medical_devices',
    label: 'Medical devices & diagnostics',
    brief: 'Device quality systems and design controls, software-as-a-medical-device, post-market surveillance, UDI and labelling, sterility and recall handling, diagnostic reporting.',
    channels: ['r/MedicalDevices and r/regulatoryaffairs threads', 'FDA 510(k) and MDR guidance updates', 'notified-body backlog reporting', 'quality-engineer practice forums']
  },
  {
    id: 'pharmacy_ops',
    label: 'Pharmacy & medication operations',
    brief: 'Dispensing workflow, benefit checks and prior authorisation at the counter, specialty pharmacy fulfilment, 340B and inventory, adherence outreach, compounding records.',
    channels: ['r/pharmacy and r/TalesFromThePharmacy threads', 'state board of pharmacy rule changes', 'PBM reimbursement dispute threads', 'specialty-pharmacy accreditation guidance']
  },
  {
    id: 'behavioral_health',
    label: 'Behavioral & mental health practice',
    brief: 'Therapy practice operations, intake and authorisation, group-practice billing, care coordination, telehealth compliance, outcome measurement.',
    channels: ['r/therapists and r/psychotherapy threads', 'payer authorization and clawback complaints', 'state licensure and telehealth rule changes', 'group-practice owner forums']
  },
  {
    id: 'senior_care',
    label: 'Senior & home care',
    brief: 'Home-care scheduling and electronic visit verification, assisted-living operations, caregiver compliance and training, family communication, payer and waiver billing.',
    channels: ['r/cna and r/HomeHealth threads', 'CMS EVV and waiver guidance', 'state survey deficiency reports', 'caregiver-agency owner forums']
  },
  {
    id: 'veterinary_pet',
    label: 'Veterinary & animal care',
    brief: 'Clinic practice management, animal records and lab ordering, boarding and grooming operations, prescription and pharmacy handling, pet-insurance claims.',
    channels: ['r/VetTech and r/veterinary threads', 'practice-management vendor complaint threads', 'AVMA and state board guidance', 'clinic-owner forums on staffing and pricing']
  },
  {
    id: 'clinical_specialties',
    label: 'Clinical specialties & chair-side care',
    brief: 'Dental, vision, dermatology and orthopaedic practice operations, imaging and chair scheduling, treatment planning and estimates, insurance verification, specialty referral loops.',
    channels: ['r/Dentistry, r/optometry and r/dermatology threads', 'specialty-society coding updates', 'practice-management software reviews', 'front-office staffing complaint threads']
  },
  {
    id: 'public_health',
    label: 'Public health & epidemiology',
    brief: 'Health-department casework and contact tracing, immunisation registries, outbreak reporting, syndromic surveillance, laboratory-result exchange, population dashboards.',
    channels: ['NACCHO and ASTHO member materials', 'CDC data-interoperability guidance', 'state and county health-department job threads', 'epidemiology conference abstracts']
  },
  {
    id: 'k12_schools',
    label: 'K-12 school districts',
    brief: 'District operations and rostering, IEP and 504 compliance, substitute and transport logistics, parent communication, assessment reporting, Title funding documentation.',
    channels: ['r/Teachers and r/k12sysadmin threads', 'state education department reporting mandates', 'district RFP and board-meeting minutes', 'SIS and LMS procurement complaints']
  },
  {
    id: 'early_childhood',
    label: 'Early childhood & childcare',
    brief: 'Enrolment and tuition billing, ratio and licensing compliance, subsidy claims and attendance, parent updates and billing, staff credentialing.',
    channels: ['r/ECEProfessionals and r/childcare threads', 'state licensing inspection reports', 'childcare-management app reviews', 'provider-association member surveys']
  },
  {
    id: 'workforce_training',
    label: 'Workforce training & credentialing',
    brief: 'Apprenticeship and certification tracking, skills assessment, employer-funded reskilling, continuing education records, placement and outcome reporting.',
    channels: ['r/instructionaldesign and r/humanresources threads', 'state licensing and CE requirement changes', 'workforce-board RFP documents', 'training-vendor and LMS complaint threads']
  },
  {
    id: 'research_academia',
    label: 'Research administration & academia',
    brief: 'Grant administration and effort reporting, IRB and protocol compliance, core-facility scheduling, scholarly output tracking, conflict-of-interest disclosure.',
    channels: ['r/AskAcademia and r/GradSchool threads', 'NIH and NSF policy notices', 'research-administrator listservs', 'university audit and OIG findings']
  },
  {
    id: 'libraries_archives',
    label: 'Libraries & archives',
    brief: 'Catalogue and lending systems, interlibrary loan, digital preservation, records-retention schedules, patron privacy, special-collection access.',
    channels: ['r/librarians and r/Archivists threads', 'state library association reports', 'ILMS migration complaints', 'records-management compliance guidance']
  },
  {
    id: 'museums_culture',
    label: 'Museums & cultural institutions',
    brief: 'Collections and provenance records, exhibition planning and loans, membership and ticketing, rights and image licensing, donor and patron records.',
    channels: ['r/MuseumPros threads', 'AAM and ICOM guidance updates', 'collections-management vendor complaints', 'institution annual and provenance reports']
  },
  {
    id: 'membership_associations',
    label: 'Membership bodies & associations',
    brief: 'Dues and renewals, chapter and volunteer operations, HOAs and clubs, event and benefit administration, governance and voting, member-record hygiene.',
    channels: ['r/associations and r/HOA threads', 'ASAE member surveys', 'AMS and HOA-software review complaints', 'nonprofit and chapter-leader forums']
  },
  {
    id: 'restaurants',
    label: 'Restaurants & food service',
    brief: 'Kitchen and menu operations, recipe and plate costing, delivery-channel reconciliation, labour scheduling, allergy and temp compliance, multi-unit reporting.',
    channels: ['r/restaurateur and r/KitchenConfidential threads', 'POS and delivery-integration complaint threads', 'state health-inspection results', 'restaurant-owner cost threads']
  },
  {
    id: 'food_distribution',
    label: 'Food distribution & cold chain',
    brief: 'Distributor ordering and EDI, lot traceability and recalls, cold-chain monitoring, commissary and central-kitchen production, broker and deduction management.',
    channels: ['r/foodindustry and r/supplychain threads', 'FDA FSMA 204 traceability guidance', 'broadline-distributor portal complaints', 'recall and withdrawal announcements']
  },
  {
    id: 'wholesale_distribution',
    label: 'Wholesale & B2B distribution',
    brief: 'B2B ordering and vendor portals, EDI and price-file exchange, rebate and contract pricing, vendor-managed inventory, quote-to-cash for complex orders.',
    channels: ['r/supplychain and r/warehouses threads', 'ERP and EDI integration complaint boards', 'NAW and distributor association reports', 'sales-rep and branch-manager forums']
  },
  {
    id: 'cpg_brands',
    label: 'Consumer packaged goods',
    brief: 'Product development and packaging, trade promotion and deduction disputes, retail compliance and chargebacks, co-manufacturer coordination, distributor depletion data.',
    channels: ['r/CPG and r/FulfillmentByAmazon brand threads', 'retailer vendor-portal complaint threads', 'trade-promotion deduction threads', 'category-manager practitioner forums']
  },
  {
    id: 'apparel_textiles',
    label: 'Apparel & textiles',
    brief: 'Tech packs and product lifecycle data, size and fit intelligence, factory allocation and sampling, returns and resale, textile compliance and origin records.',
    channels: ['r/fashion and r/sewing industry threads', 'factory-audit and compliance reporting', 'returns and sizing complaint threads', 'sourcing-agency practitioner forums']
  },
  {
    id: 'events_venues',
    label: 'Events, venues & exhibitions',
    brief: 'Venue booking and operations, exhibitor and floorplan management, credentialing and access control, show settlement, speaker and session logistics.',
    channels: ['r/eventprofs and r/CommercialRealEstate venue threads', 'venue-management software complaint boards', 'exhibitor and organiser post-show threads', 'IAEE and MPI member surveys']
  },
  {
    id: 'local_services',
    label: 'Local & personal services',
    brief: 'Cleaning, landscaping, pest, repair and salon operators: quoting, dispatch, recurring billing, reviews and reputation, staff and route utilisation.',
    channels: ['r/sweatystartup and r/smallbusiness threads', 'field-service app one-star reviews', 'local-services franchisee forums', 'Google Business review complaint patterns']
  },
  {
    id: 'chemicals_materials',
    label: 'Chemicals & advanced materials',
    brief: 'Formulation and batch records, SDS and hazard communication, materials testing and characterisation, plant quality, REACH and TSCA compliance.',
    channels: ['r/chemistry and r/ChemicalEngineering threads', 'EPA TSCA and ECHA REACH updates', 'plant quality-engineer forums', 'materials-science conference proceedings']
  },
  {
    id: 'mining_metals',
    label: 'Mining & metals',
    brief: 'Exploration and drill data, mine planning and grade control, haulage and assay tracking, permitting and rehabilitation, metal accounting and offtake.',
    channels: ['r/mining and r/geology threads', 'NI 43-101 and JORC disclosure filings', 'regulator rehabilitation directives', 'mine-site maintenance practitioner forums']
  },
  {
    id: 'oil_gas',
    label: 'Oil, gas & midstream',
    brief: 'Upstream production data and field maintenance, midstream nominations and measurement, joint-interest billing, emissions and flaring reporting, land and lease records.',
    channels: ['r/oil and r/energy threads', 'state railroad-commission and FERC filings', 'measurement and allocation dispute threads', 'field-operator automation forums']
  },
  {
    id: 'water_utilities',
    label: 'Water & wastewater utilities',
    brief: 'Treatment and distribution operations, metering and billing, leak and non-revenue-water tracking, regulatory sampling, asset condition and capital planning.',
    channels: ['AWWA and WEF member reporting', 'state primacy agency violation notices', 'utility billing-software complaints', 'r/Wastewater and operator certification threads']
  },
  {
    id: 'waste_recycling',
    label: 'Waste, recycling & circularity',
    brief: 'Collection routing, weighbridge and tonnage data, contamination and recycling-rate measurement, hauler contracts, extended-producer-responsibility reporting.',
    channels: ['r/recycling and r/WasteManagement threads', 'state EPR and landfill-diversion rules', 'municipal waste contract documents', 'hauler operations forums']
  },
  {
    id: 'nuclear_power',
    label: 'Nuclear & radiological operations',
    brief: 'Licensing and configuration control, outage planning, radiation-dose records, radioactive-waste tracking, procedure compliance, decommissioning documentation.',
    channels: ['NRC inspection and event notices', 'r/nuclear and operator-licence study threads', 'INPO and industry operating-experience reports', 'utility outage-engineering forums']
  },
  {
    id: 'environment_climate',
    label: 'Environment, climate & ESG data',
    brief: 'Carbon accounting and scope 3 collection, climate-risk disclosure, offset and REC MRV, environmental permitting, supplier sustainability questionnaires.',
    channels: ['ISSB, CSRD and SEC climate-rule guidance', 'r/sustainability and ESG-reporting threads', 'assurance-provider methodology notes', 'MRV registry and methodology consultations']
  },
  {
    id: 'conservation_land',
    label: 'Conservation & land management',
    brief: 'Land and easement records, wildlife and habitat monitoring, prescribed-burn and restoration operations, stewardship reporting, public-access and permitting.',
    channels: ['r/ecology and r/landmanagement threads', 'USFWS and state wildlife agency notices', 'land-trust stewardship reports', 'conservation-GIS practitioner forums']
  },
  {
    id: 'fisheries_aquaculture',
    label: 'Fisheries & aquaculture',
    brief: 'Quota and catch reporting, electronic monitoring, pen and feed operations, cold-chain handling, certification audits, vessel and licence records.',
    channels: ['NOAA fisheries bulletins and quota notices', 'r/aquaculture and r/commercialfishing threads', 'MSC and ASC audit findings', 'seafood-supply compliance threads']
  },
  {
    id: 'forestry_timber',
    label: 'Forestry & timber',
    brief: 'Timber cruising and inventory, harvest planning and log accounting, chain-of-custody certification, mill intake and grading, fire-risk and road records.',
    channels: ['r/forestry and r/logging threads', 'FSC and SFI certification updates', 'state forestry commission notices', 'mill and landowner association forums']
  },
  {
    id: 'facilities_management',
    label: 'Facilities & building operations',
    brief: 'CMMS and work orders, building systems and energy, vendor and SLA management, space and moves, inspection and compliance logs.',
    channels: ['r/facilitiesmanagement and r/maintenance threads', 'CMMS and BMS vendor complaint boards', 'IFMA member surveys', 'building-code and inspection updates']
  },
  {
    id: 'geospatial_survey',
    label: 'Geospatial, survey & mapping',
    brief: 'Survey and GIS data capture, drone and LiDAR processing, cadastral and boundary records, utility locate and as-built data, map publication and licensing.',
    channels: ['r/gis and r/Surveying threads', 'state licensing board and datum updates', 'drone and LiDAR processing complaints', 'municipal GIS user-group forums']
  },
  {
    id: 'architecture_engineering',
    label: 'Architecture & engineering design',
    brief: 'BIM and design coordination, permit and code review, structural calculation records, submittal and RFI review, specification management, design-fee tracking.',
    channels: ['r/architecture and r/StructuralEngineering threads', 'ICC code-change cycles', 'BIM-software migration complaints', 'AIA and ACEC member surveys']
  },
  {
    id: 'aviation',
    label: 'Aviation & aerospace operations',
    brief: 'Airline ops and crew scheduling, MRO and parts traceability, ground handling, airworthiness and maintenance records, drone and AAM operations.',
    channels: ['r/aviation and r/aviationmaintenance threads', 'FAA airworthiness directives', 'airline-irregular-operations postmortems', 'MRO and lessor practitioner forums']
  },
  {
    id: 'maritime_ports',
    label: 'Maritime & ports',
    brief: 'Vessel and port-call operations, chartering and demurrage, container and terminal flow, crew and STCW compliance, bunker and voyage accounting.',
    channels: ['r/maritime and r/logistics shipping threads', 'IMO and port-state-control notices', 'terminal and carrier EDI complaint threads', 'chartering and ship-management forums']
  },
  {
    id: 'rail_transit',
    label: 'Rail & public transit',
    brief: 'Transit agency operations, track and asset inspection, fare systems and reconciliation, freight car accounting, service disruption communication, accessibility compliance.',
    channels: ['APTA and FTA program guidance', 'r/transit and r/trains threads', 'agency board and capital-plan documents', 'rail signalling and maintenance forums']
  },
  {
    id: 'automotive_retail',
    label: 'Automotive retail & aftermarket',
    brief: 'Dealership DMS and F&I, service-bay scheduling, parts catalogues and fitment, trade-in valuation, warranty claims, independent-shop operations.',
    channels: ['r/askcarsales and r/MechanicAdvice threads', 'DMS and parts-catalogue vendor complaints', 'OEM warranty-policy updates', 'independent-shop owner forums']
  },
  {
    id: 'film_production',
    label: 'Film, TV & production',
    brief: 'Production scheduling and budgeting, crew and equipment booking, VFX and post pipelines, rights and clearances, residuals and payroll, location and permit records.',
    channels: ['r/FilmIndustryLA and r/vfx threads', 'guild and union agreement updates', 'production-accounting complaint threads', 'post-house pipeline postmortems']
  },
  {
    id: 'music_audio',
    label: 'Music & audio',
    brief: 'Rights and royalty splits, catalogue metadata, distribution and DSP reporting, studio and live-event operations, sync licensing, fan and ticketing data.',
    channels: ['r/WeAreTheMusicMakers and r/musicbusiness threads', 'DSP and PRO payout policy changes', 'royalty-statement dispute threads', 'audio-engineering practitioner forums']
  },
  {
    id: 'news_publishing',
    label: 'News & publishing',
    brief: 'Newsroom planning and archives, wire and syndication management, subscriber and ad operations, fact-check workflow, community and comment moderation.',
    channels: ['r/Journalism and r/editors threads', 'publisher platform policy changes', 'local-news business-model postmortems', 'press-association member surveys']
  },
  {
    id: 'pr_comms',
    label: 'PR & corporate communications',
    brief: 'Media-list and outreach operations, coverage measurement, crisis-response workflow, spokesperson and message approval, agency retainer reporting.',
    channels: ['r/PublicRelations and r/communications threads', 'media-database accuracy complaint threads', 'agency-account-team workflow threads', 'comms-measurement standard updates']
  },
  {
    id: 'social_services',
    label: 'Social services & human services',
    brief: 'Case management and caseload tracking, eligibility and benefit determinations, child-welfare and foster records, provider billing, outcome reporting.',
    channels: ['r/socialwork and r/CaseManagement threads', 'HHS and state agency policy letters', 'caseworker workload reporting', 'county human-services RFP documents']
  },
  {
    id: 'public_safety_ops',
    label: 'Public safety & emergency response',
    brief: 'Dispatch and records management, evidence and chain-of-custody, fire inspection and prevention, EMS billing, incident reporting and mutual aid.',
    channels: ['r/ProtectAndServe and r/Firefighting threads', 'state POST and NFPA standards updates', 'city council public-safety budget documents', 'records-management vendor complaints']
  },
  {
    id: 'housing_authorities',
    label: 'Housing & public housing',
    brief: 'Voucher and waitlist administration, inspection and recertification, tenant accounting, capital-fund reporting, homeless-services coordination.',
    channels: ['HUD notices and REAC inspection guidance', 'r/section8 and housing-authority staff threads', 'PHADA and NAHRO member materials', 'authority board-meeting minutes']
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
  { id: 'frontier', label: 'Frontier tech', blurb: 'Agents, dev tools, compute, robotics, spatial, chips', vectors: ['agentic_ai', 'dev_experience', 'dataai', 'devinfra', 'security', 'frontier_compute', 'robotics_embodied', 'spatial_xr', 'semiconductors', 'hardware_iot'] },
  { id: 'viral', label: 'Viral & consumer', blurb: 'Consumer breakouts, creators, growth', vectors: ['viral_consumer', 'creator_economy', 'growth_ops', 'dev_experience'] },
  { id: 'software', label: 'Software & data', blurb: 'Dev infra, security, applied AI, business tooling, games', vectors: ['devinfra', 'security', 'dataai', 'dev_experience', 'agentic_ai', 'frontier_compute', 'knowledge_work', 'support_ops', 'sales_ops', 'crm_lifecycle', 'adtech_measurement', 'compliance_ops', 'open_source_ops', 'semiconductors', 'hardware_iot', 'gamedev'] },
  { id: 'regulated', label: 'Regulated & money', blurb: 'Finance, insurance, legal, payments, tax', vectors: ['fintech', 'insuretech', 'legal', 'healthcare', 'banking_credit', 'capital_markets', 'payments_infra', 'accounting_tax', 'crypto_onchain'] },
  { id: 'physical', label: 'Physical economy', blurb: 'Logistics, industry, energy, food, construction, trades, fleets, telecom', vectors: ['logistics', 'industrial', 'energy', 'agrifood', 'construction', 'trades_smb', 'mobility_auto', 'telecom_network', 'chemicals_materials', 'mining_metals', 'oil_gas', 'water_utilities', 'waste_recycling', 'nuclear_power', 'environment_climate', 'conservation_land', 'fisheries_aquaculture', 'forestry_timber', 'geospatial_survey', 'facilities_management', 'architecture_engineering'] },
  { id: 'public', label: 'Public & institutional', blurb: 'Government, education, nonprofits, defense, civic', vectors: ['govtech', 'education', 'nonprofits', 'defense_space', 'social_services', 'public_safety_ops', 'housing_authorities', 'libraries_archives', 'museums_culture', 'membership_associations', 'research_academia', 'public_health', 'k12_schools'] },
  { id: 'commerce', label: 'Commerce & property', blurb: 'Retail, marketplaces, media, travel, real estate, food, local', vectors: ['commerce_retail', 'marketplaces', 'media_rights', 'travel_hospitality', 'proptech_realestate', 'growth_ops', 'restaurants', 'food_distribution', 'wholesale_distribution', 'cpg_brands', 'apparel_textiles', 'events_venues', 'local_services'] },
  { id: 'people', label: 'People & wellness', blurb: 'HR, education, health, care, sport', vectors: ['hr_talent', 'education', 'healthcare', 'sports_wellness', 'workforce_training', 'early_childhood', 'senior_care', 'behavioral_health', 'clinical_specialties'] },
  { id: 'health', label: 'Health & life sciences', blurb: 'Clinical, pharma, labs, devices, pharmacy, care', vectors: ['healthcare', 'pharma_lifesci', 'biotech_lab', 'medical_devices', 'pharmacy_ops', 'behavioral_health', 'senior_care', 'clinical_specialties', 'public_health', 'veterinary_pet', 'sports_wellness'] },
  { id: 'money', label: 'Money & legal', blurb: 'Banking, capital markets, payments, tax, digital assets', vectors: ['fintech', 'insuretech', 'banking_credit', 'capital_markets', 'payments_infra', 'accounting_tax', 'crypto_onchain', 'legal'] },
  { id: 'industry', label: 'Industry & resources', blurb: 'Plant, energy, chemicals, mining, water, waste, climate', vectors: ['industrial', 'energy', 'oil_gas', 'chemicals_materials', 'mining_metals', 'water_utilities', 'waste_recycling', 'nuclear_power', 'environment_climate', 'conservation_land', 'fisheries_aquaculture', 'forestry_timber'] },
  { id: 'mobility', label: 'Transport & mobility', blurb: 'Fleets, freight, aviation, maritime, rail, dealer', vectors: ['mobility_auto', 'logistics', 'aviation', 'maritime_ports', 'rail_transit', 'automotive_retail', 'telecom_network'] },
  { id: 'culture', label: 'Media & culture', blurb: 'Film, music, news, games, museums, events, sport', vectors: ['media_rights', 'film_production', 'music_audio', 'news_publishing', 'pr_comms', 'gamedev', 'museums_culture', 'events_venues', 'sports_wellness', 'creator_economy'] },
  { id: 'build', label: 'Built environment', blurb: 'Construction, design, survey, facilities, property, local', vectors: ['construction', 'trades_smb', 'architecture_engineering', 'geospatial_survey', 'facilities_management', 'proptech_realestate', 'local_services'] }
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