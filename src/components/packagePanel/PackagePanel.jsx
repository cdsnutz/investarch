import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, PackageOpen } from 'lucide-react';
import { buildPdf } from '@/lib/pdfBuilder';
import JSZip from 'jszip';

const STAGES = [
  'Genesis pod: dossier loaded',
  'Legal pod: hardening language',
  'Spec pod: drafting PRD and specifications',
  'Capital pod: mapping the funding directory',
  'Scoring pod: auditing investment readiness',
  'Packaging pod: rendering the ZIP'
];

const CONTENTS = [
  '01_Investment_Dossier.pdf',
  '02_Product_Requirements_Document.pdf',
  '03_Technical_Specifications.pdf',
  '04_Funding_and_Capital_Directory.pdf',
  '05_Investment_Readiness_Audit.pdf',
  '06_Legal_Framework.pdf'
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

export default function PackagePanel({ project, funding }) {
  const [building, setBuilding] = useState(false);
  const [stage, setStage] = useState(0);
  const [pkg, setPkg] = useState(null);
  const [error, setError] = useState('');

  const assembleZip = (data) => {
    const docs = [
      { name: '01_Investment_Dossier.pdf', args: { title: 'Investment Dossier', subtitle: `${project.company_name || ''}${project.url ? ` | ${project.url}` : ''}`, sections: dossierSections(project), footer: project.company_name || 'InvestArch' } },
      { name: '02_Product_Requirements_Document.pdf', args: { title: data.prd.title || 'Product Requirements Document', subtitle: project.company_name, sections: data.prd.sections, footer: project.company_name || 'InvestArch' } },
      { name: '03_Technical_Specifications.pdf', args: { title: data.spec.title || 'Technical Specification', subtitle: project.company_name, sections: data.spec.sections, footer: project.company_name || 'InvestArch' } },
      { name: '04_Funding_and_Capital_Directory.pdf', args: { title: 'Funding and Capital Directory', subtitle: project.company_name, sections: fundingSections(funding), footer: project.company_name || 'InvestArch' } },
      {
        name: '05_Investment_Readiness_Audit.pdf',
        args: {
          title: 'Investment Readiness Audit',
          subtitle: project.company_name,
          footer: project.company_name || 'InvestArch',
          sections: [
            { heading: 'Investment Readiness Score', body: `Total IRS: ${data.irs.total}/100. Scored across four dimensions of 25 points: market size (TAM/SAM/SOM), defensibility moat, scalability vector, and legal hardness. Scoring is truthful: a low score is the map of what to fix.` },
            ...data.irs.dimensions.map((d) => ({ heading: `${d.dimension}: ${d.score}/${d.max}`, body: d.note })),
            ...data.irs.enhancements.map((e) => ({ heading: `Enhancement: ${e.title}`, body: e.action }))
          ]
        }
      },
      { name: '06_Legal_Framework.pdf', args: { title: data.legal.title || 'Legal Framework', subtitle: project.company_name, sections: data.legal.sections, footer: project.company_name || 'InvestArch' } }
    ];
    const zip = new JSZip();
    docs.forEach((d) => zip.file(d.name, buildPdf(d.args)));
    return zip.generateAsync({ type: 'blob' });
  };

  const triggerDownload = (blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug(project.company_name)}_Investment_Readiness_Package.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const build = async () => {
    setBuilding(true);
    setError('');
    setStage(0);
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 10000);
    try {
      const res = await base44.functions.invoke('generateReadinessPackage', { projectId: project.id });
      const data = res.data;
      setPkg(data);
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

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <PackageOpen className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Investment Readiness Zip-Package</h3>
      </div>
      <p className="text-sm text-muted-foreground">One archive, six institutional documents: the investment dossier, a formal PRD, the technical specification, the funding and capital directory, the investment readiness audit with enhancement moves, and the legal framework in hardened institutional language.</p>
      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
        {CONTENTS.map((c) => <li key={c} className="flex gap-2"><span className="size-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" /><span className="font-mono text-xs">{c}</span></li>)}
      </ul>
      {pkg?.irs && (
        <div className="rounded-lg bg-muted p-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Investment Readiness Score</span>
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
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3">
        <Button onClick={build} disabled={building}>
          {building ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : null}
          {building ? 'Building package' : pkg ? 'Rebuild and download' : 'Build and download ZIP'}
        </Button>
        {pkg && !building && (
          <Button variant="outline" onClick={redownload}>Download again</Button>
        )}
      </div>
      {building && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{STAGES[stage]}</span>
          {' '}| Four specialist pipelines are running; this takes one to two minutes.
        </p>
      )}
    </div>
  );
}