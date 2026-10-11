import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, PackageOpen } from 'lucide-react';
import { buildPdf } from '@/lib/pdfBuilder';
import JSZip from 'jszip';

const STAGES = [
  'Genesis pod: siphoning the concept',
  'Build pod: engineering the codebase',
  'Legal Council pod: hardening the fortress',
  'Valuation pod: running DCF and comparables',
  'Credit-Sentry pod: computing leverage and DSCR',
  'Daydream pod: generating the IP portfolio',
  'Spec pod: drafting PRD and specifications',
  'Capital pod: building the funding matrix',
  'Scoring pod: auditing readiness and value unlocks',
  'Packaging pod: compiling the Sovereign ZIP'
];

const FOLDERS = [
  '/01_Corporate_Dossier/  (sovereign plan, value appraisal, governance framework)',
  '/02_Technical_Vault/  (codebase, full specification, onboarding guide, user manual)',
  '/03_Financial_Leverage/  (loan justification, formal bank application, capital directory)',
  '/04_Future_IP_Portfolio/  (three IP innovation mini-plans)',
  '/05_Audit/  (institutional readiness score)',
  '/06_IP_Factory_Daily_Yield/  (daily IP seeds, legal filings, liquidation prospectuses)'
];

const slug = (s) => (s || 'Company').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');

function dossierSections(project) {
  const s = [];
  const add = (heading, body) => { if (body) s.push({ heading, body }); };
  add('Executive Summary', project.executive_summary);
  add('Value Proposition', project.value_proposition);
  add('Market Analysis', project.market_analysis);
  add('Strategic Edge', project.strategic_edge);
  add('Financial Forecast', project.financial_forecast);
  if (project.key_milestones?.length > 0) add('Key Milestones', project.key_milestones.map((m, i) => `${i + 1}. ${m}`).join('\n'));
  add('Investor Narrative', project.investor_narrative);
  (project.plan_points || []).slice().sort((a, b) => (a.index || 0) - (b.index || 0)).forEach((p) => {
    const body = `${p.content || ''}${p.score != null ? `\n\nPoint score: ${p.score}/10${p.revision_note ? ` | Revision: ${p.revision_note}` : ''}` : ''}`;
    s.push({ heading: `${p.index}. ${p.title}`, body });
  });
  return s;
}

function fundingSections(funding) {
  const s = [];
  if (funding.length > 0) {
    s.push({ heading: 'Directory Overview', body: `${funding.length} capital sources matched to this entity's industry and stage. Each entry lists the source type, focus area, stage, alignment rationale, and contact route. Verification of contact details is required before outreach.` });
  }
  funding.forEach((f) => {
    const lines = [];
    if (f.type) lines.push(`Type: ${f.type}`);
    if (f.focus_area) lines.push(`Focus area: ${f.focus_area}`);
    if (f.stage) lines.push(`Stage: ${f.stage}`);
    if (f.alignment_rationale) lines.push(`Alignment: ${f.alignment_rationale}`);
    if (f.contact_info) lines.push(`Contact: ${f.contact_info}`);
    if (f.outreach_subject) lines.push(`\nOutreach subject: ${f.outreach_subject}`);
    if (f.outreach_email) lines.push(`\nOutreach draft:\n${f.outreach_email}`);
    if (f.application_draft) lines.push(`\nApplication draft:\n${f.application_draft}`);
    s.push({ heading: f.name, body: lines.join('\n') });
  });
  return s;
}

function ipYieldDocs(ipYield) {
  const docs = [];
  const seeds = (ipYield?.seeds || []).slice().sort((a, b) => (b.asymmetric_score || 0) - (a.asymmetric_score || 0));
  const filingsBySeed = {};
  (ipYield?.filings || []).forEach((f) => { (filingsBySeed[f.seed_id] = filingsBySeed[f.seed_id] || []).push(f); });
  const prospectusBySeed = {};
  (ipYield?.prospectuses || []).forEach((p) => { prospectusBySeed[p.seed_id] = p; });
  seeds.forEach((seed, i) => {
    const s = slug(seed.title);
    const bp = seed.blueprint || {};
    const planSections = [
      { heading: 'The Gap', body: seed.gap || '' },
      ...(seed.pain_signal ? [{ heading: 'Pain-Signal', body: `${seed.pain_signal}\n\nSource: ${seed.source_channel || 'unlisted'}` }] : []),
      { heading: 'The Solution', body: seed.solution || '' },
      { heading: 'Business Case', body: seed.mini_plan || '' },
      ...(bp.tech_stack?.length ? [{ heading: 'Tech Stack', body: bp.tech_stack.join('\n') }] : []),
      ...(bp.db_schema ? [{ heading: 'Database Schema', body: bp.db_schema }] : []),
      ...(bp.core_logic ? [{ heading: 'Core Logic', body: bp.core_logic }] : []),
      { heading: 'Wealth Strategy', body: `${(seed.strategy || 'hold').toUpperCase()}${seed.strategy_note ? ` | ${seed.strategy_note}` : ''}` }
    ];
    docs.push({ name: `06_IP_Factory_Daily_Yield/Daily_Seeds_${seed.yield_date || 'yield'}/Seed_${String(i + 1).padStart(2, '0')}_${s}_MiniPlan.pdf`, args: { title: `IP Seed ${String(i + 1).padStart(2, '0')}: ${seed.title}`, subtitle: `Asymmetric advantage ${seed.asymmetric_score ?? '-'}/10 | ${seed.yield_date || ''}`, sections: planSections, footer: 'InvestArch IP Factory' } });
    (filingsBySeed[seed.id] || []).forEach((f, j) => {
      const label = f.filing_type === 'patent' ? 'Patent_Application_Draft' : f.filing_type === 'trademark' ? 'Trademark_Filing_Packet' : 'Deed_of_Ownership';
      const sections = f.filing_type === 'patent'
        ? [{ heading: 'Abstract', body: f.abstract || '' }, { heading: 'Claims', body: f.claims || '' }, { heading: 'Detailed Description', body: f.detailed_description || '' }, { heading: 'Prior Art Note', body: f.prior_art_note || '' }]
        : f.filing_type === 'trademark'
          ? [{ heading: 'Brand Name', body: f.brand_name || '' }, { heading: 'Trademark Classes', body: f.trademark_classes || '' }, { heading: 'Logo Concepts', body: f.logo_concepts || '' }, { heading: 'Clearance Note', body: f.clearance_note || '' }]
          : [{ heading: 'Deed Text', body: f.deed_text || '' }];
      docs.push({ name: `06_IP_Factory_Daily_Yield/Legal_Filings/${String(i + 1).padStart(2, '0')}_${s}_${label}${j > 0 ? `_${j + 1}` : ''}.pdf`, args: { title: `${seed.title}: ${label.replace(/_/g, ' ')}`, subtitle: 'Draft legal work product for attorney review', sections, footer: 'InvestArch IP Registrar' } });
    });
    const prospectus = prospectusBySeed[seed.id];
    if (prospectus) {
      docs.push({ name: `06_IP_Factory_Daily_Yield/Liquidation_Prospectus/${String(i + 1).padStart(2, '0')}_${s}_Prospectus.pdf`, args: { title: `Liquidation Prospectus: ${seed.title}`, subtitle: `${prospectus.offer_type} offer | indicative`, sections: [{ heading: 'Target Acquirers and Licensees', body: (prospectus.targets || []).map((t, k) => `${k + 1}. ${t.name}: ${t.rationale}`).join('\n\n') }, { heading: 'Prospectus', body: prospectus.prospectus || '' }, { heading: 'Offer Terms', body: prospectus.offer_terms || '' }], footer: 'InvestArch IP Dealer' } });
    }
  });
  return docs;
}

export default function PackagePanel({ project, funding }) {
  const [building, setBuilding] = useState(false);
  const [stage, setStage] = useState(0);
  const [pkg, setPkg] = useState(null);
  const [error, setError] = useState('');

  const assembleZip = (data) => {
    const val = data.valuation || {};
    const lo = Math.min(val.dcf_low ?? Infinity, val.cca_low ?? Infinity);
    const hi = Math.max(val.dcf_high ?? 0, val.cca_high ?? 0);
    const fmt = (n) => (typeof n === 'number' && isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-');
    const credit = data.credit || {};
    const docs = [
      { name: '01_Corporate_Dossier/Executive_Sovereign_Plan.pdf', args: { title: 'Executive Sovereign Plan', subtitle: `${project.company_name || ''}${project.url ? ` | ${project.url}` : ''}`, sections: dossierSections(project), footer: project.company_name || 'InvestArch' } },
      {
        name: '01_Corporate_Dossier/Enterprise_Value_Appraisal.pdf',
        args: {
          title: 'Enterprise Value Appraisal',
          subtitle: project.company_name,
          footer: project.company_name || 'InvestArch',
          sections: [
            { heading: 'Valuation Summary', body: `Headline multiple: ${val.multiple ?? '-'}x. Modeled ranges, every figure grounded in stated assumptions: DCF ${fmt(val.dcf_low)} to ${fmt(val.dcf_high)} USD; Comparable Company Analysis ${fmt(val.cca_low)} to ${fmt(val.cca_high)} USD. Combined appraisal band: ${fmt(isFinite(lo) ? lo : 0)} to ${fmt(hi)} USD. All figures are modeled projections, not verified market data.` },
            ...(val.sections || [])
          ]
        }
      },
      { name: '01_Corporate_Dossier/Institutional_Governance_Framework.pdf', args: { title: 'Institutional Governance Framework', subtitle: project.company_name, sections: data.legal?.sections || [], footer: project.company_name || 'InvestArch' } },
      { name: '02_Technical_Vault/Full_Technical_Specification.pdf', args: { title: 'Full Technical Specification', subtitle: project.company_name, footer: project.company_name || 'InvestArch', sections: [...(data.prd?.sections || []), ...(data.spec?.sections || [])] } },
      { name: '02_Technical_Vault/Developer_Onboarding_Guide.pdf', args: { title: 'Developer Onboarding Guide', subtitle: project.company_name, footer: project.company_name || 'InvestArch', sections: [{ heading: 'Repository', body: `${data.codebase?.repo_name || ''}\n\nThe codebase is included in this archive under 02_Technical_Vault/Codebase/.` }, { heading: 'Onboarding Guide', body: data.codebase?.onboarding_guide || '' }] } },
      { name: '02_Technical_Vault/User_Manual.pdf', args: { title: 'User Manual', subtitle: project.company_name, footer: project.company_name || 'InvestArch', sections: [{ heading: 'How the Product Works', body: data.codebase?.user_manual || '' }] } },
      { name: '03_Financial_Leverage/Loan_Request_Justification.pdf', args: { title: 'Loan Request Justification', subtitle: project.company_name, footer: project.company_name || 'InvestArch', sections: [{ heading: 'Summary', body: `Maximum justifiable request: ${typeof credit.loan_request === 'number' ? credit.loan_request.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-'} USD, sized to a tightest-year Debt Service Coverage Ratio of ${credit.dscr ?? '-'} (minimum threshold 1.25). Collateral basis: ${credit.collateral_basis || ''}` }, ...(credit.calculation_sections || [])] } },
      { name: '03_Financial_Leverage/Formal_Bank_Application.pdf', args: { title: 'Formal Application for Commercial Financing', subtitle: project.company_name, footer: project.company_name || 'InvestArch', sections: credit.application_sections || [] } },
      { name: '03_Financial_Leverage/Funding_and_Capital_Directory.pdf', args: { title: 'Funding and Capital Directory', subtitle: project.company_name, sections: fundingSections(funding), footer: project.company_name || 'InvestArch' } },
      { name: '05_Audit/Investment_Readiness_Score.pdf', args: { title: 'Institutional Readiness Audit', subtitle: project.company_name, footer: project.company_name || 'InvestArch', sections: [
        { heading: 'Investment Readiness Score', body: `Total IRS: ${data.irs.total}/100. Scored across four dimensions of 25 points: market size (TAM/SAM/SOM), defensibility moat, scalability vector, and legal hardness. Scoring is truthful: a low score is the map of what to fix.` },
        ...data.irs.dimensions.map((d) => ({ heading: `${d.dimension}: ${d.score}/${d.max}`, body: d.note })),
        ...data.irs.enhancements.map((e) => ({ heading: `Enhancement: ${e.title}`, body: e.action })),
        { heading: 'Growth Blueprint: LTV/CAC Optimization', body: data.irs.growth_blueprint.filter((g) => g.lever === 'LTV/CAC Optimization').map((g) => `${g.title}. ${g.action}`).join('\n\n') },
        { heading: 'Growth Blueprint: Revenue Diversification', body: data.irs.growth_blueprint.filter((g) => g.lever === 'Revenue Diversification').map((g) => `${g.title}. ${g.action}`).join('\n\n') },
        { heading: 'Growth Blueprint: IP Fortressing', body: data.irs.growth_blueprint.filter((g) => g.lever === 'IP Fortressing').map((g) => `${g.title}. ${g.action}`).join('\n\n') }
      ] } }
    ];
    (data.daydream?.ideas || []).slice(0, 3).forEach((idea, i) => {
      docs.push({ name: `04_Future_IP_Portfolio/IP_Innovation_0${i + 1}_Plan.pdf`, args: { title: `IP Innovation 0${i + 1}: ${idea.name}`, subtitle: project.company_name, footer: project.company_name || 'InvestArch', sections: [{ heading: 'Thesis', body: idea.thesis }, ...(idea.sections || [])] } });
    });
    ipYieldDocs(data.ipYield).forEach((d) => docs.push(d));
    const zip = new JSZip();
    docs.forEach((d) => zip.file(d.name, buildPdf(d.args)));
    (data.codebase?.files || []).forEach((f) => zip.file(`02_Technical_Vault/Codebase/${f.path}`, f.content));
    return zip.generateAsync({ type: 'blob' });
  };

  const triggerDownload = (blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug(project.company_name)}_Sovereign_Enterprise_ZIP.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const build = async () => {
    setBuilding(true);
    setError('');
    setStage(0);
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 15000);
    try {
      const res = await base44.functions.invoke('generateReadinessPackage', { projectId: project.id });
      const data = res.data;
      setPkg(data);
      const cb = await base44.functions.invoke('buildCodebase', { projectId: project.id });
      data.codebase = cb.data;
      const [seedPage, filingPage, prospectusPage] = await Promise.all([
        base44.entities.IpSeed.filter({}, { sort: '-asymmetric_score', limit: 100 }),
        base44.entities.IpFiling.filter({}, { limit: 100 }),
        base44.entities.IpProspectus.filter({}, { limit: 100 })
      ]);
      data.ipYield = { seeds: seedPage.items || [], filings: filingPage.items || [], prospectuses: prospectusPage.items || [] };
      setPkg({ ...data });
      setStage(STAGES.length - 1);
      triggerDownload(await assembleZip(data));
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Package build failed.');
    } finally {
      clearInterval(timer);
      setBuilding(false);
    }
  };

  const redownload = async () => {
    if (pkg) triggerDownload(await assembleZip(pkg));
  };

  const val = pkg?.valuation;
  const valRange = val
    ? `${Math.min(val.dcf_low ?? Infinity, val.cca_low ?? Infinity).toLocaleString('en-US', { maximumFractionDigits: 0 })} to ${Math.max(val.dcf_high ?? 0, val.cca_high ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : '';
  const credit = pkg?.credit;

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <PackageOpen className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Sovereign Enterprise ZIP</h3>
      </div>
      <p className="text-sm text-muted-foreground">One sovereign archive: the corporate dossier, a full-stack codebase with its technical vault, the financial leverage kit (loan math plus a formal bank application built on Debt Service Coverage Ratio and collateral, not personal credit), a portfolio of future IP mini-plans, and the readiness audit with the growth blueprint.</p>
      <ul className="space-y-1.5 text-sm">
        {FOLDERS.map((c) => <li key={c} className="flex gap-2"><span className="size-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" /><span className="font-mono text-xs">{c}</span></li>)}
      </ul>
      {(val || credit) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {val && (
            <div className="rounded-lg bg-muted p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Enterprise Value Appraisal</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-semibold tabular-nums">{val.multiple}x</span>
                <span className="text-xs text-muted-foreground truncate">{valRange} USD (modeled)</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                <span className="rounded-md bg-background border px-2 py-0.5">DCF: {val.dcf_low?.toLocaleString('en-US', { maximumFractionDigits: 0 })} to {val.dcf_high?.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                <span className="rounded-md bg-background border px-2 py-0.5">CCA: {val.cca_low?.toLocaleString('en-US', { maximumFractionDigits: 0 })} to {val.cca_high?.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          )}
          {credit && (
            <div className="rounded-lg bg-muted p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Financial Leverage</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-semibold tabular-nums">{typeof credit.loan_request === 'number' ? `$${credit.loan_request.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '-'}</span>
                <span className="text-xs text-muted-foreground">max justifiable request | DSCR {credit.dscr}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{credit.collateral_basis}</p>
            </div>
          )}
          {pkg?.moat && (
            <div className="rounded-lg bg-muted p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Moat Strength and Exit Map</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-semibold tabular-nums">{pkg.moat.moat_score}</span>
                <span className="text-xs text-muted-foreground">/ 10 moat rating</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(pkg.exit?.acquirers || []).map((a) => (
                  <span key={a.name} className="text-xs rounded-md bg-background border px-2 py-0.5">{a.name}</span>
                ))}
              </div>
            </div>
          )}
          {pkg?.irs && (
            <div className="rounded-lg bg-muted p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Institutional Readiness Score</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-semibold tabular-nums">{pkg.irs.total}</span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {pkg.irs.dimensions.map((d) => (
                  <span key={d.dimension} className="text-xs rounded-md bg-background border px-2 py-0.5">{d.dimension}: {d.score}/{d.max}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3">
        <Button onClick={build} disabled={building}>
          {building ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : null}
          {building ? 'Compiling Sovereign ZIP' : pkg ? 'Rebuild and download' : 'Build Sovereign ZIP'}
        </Button>
        {pkg && !building && (
          <Button variant="outline" onClick={redownload}>Download again</Button>
        )}
      </div>
      {building && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{STAGES[stage]}</span>
          {' '}| Nine specialist pipelines are running; this takes two to four minutes.
        </p>
      )}
    </div>
  );
}