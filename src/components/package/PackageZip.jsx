import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Package, Download, RefreshCw, FileCheck2 } from 'lucide-react';
import makePdf from '@/lib/packagePdf';
import JSZip from 'jszip';

const STAGES = [
  'Drafting the Product Requirements Document',
  'Architecting the technical specification',
  'Hardening the legal framework',
  'Auditing investment readiness',
  'Storing documents'
];

const KIND_TITLES = {
  prd: 'Product Requirements Document',
  tech_spec: 'Technical Specifications',
  irs_audit: 'Investment Readiness Audit',
  legal_framework: 'Legal Framework'
};

const slugify = (s) => (s || 'company').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'company';

export default function PackageZip({ project, competitors, funding }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState('');
  const [zipping, setZipping] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await base44.entities.PackageDocument.filter({ project_id: project.id }, { limit: 10 });
        if (active) setDocs(res.items || []);
      } catch { /* ignore */ }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [project.id]);

  useEffect(() => {
    if (!generating) return;
    const t = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 6000);
    return () => clearInterval(t);
  }, [generating]);

  const byKind = Object.fromEntries(docs.map((d) => [d.kind, d]));
  const missing = ['prd', 'tech_spec', 'irs_audit', 'legal_framework'].filter((k) => !byKind[k]);

  const generate = async () => {
    setGenerating(true);
    setError('');
    setStage(0);
    try {
      await base44.functions.invoke('buildPackageDocs', { projectId: project.id });
      const res = await base44.entities.PackageDocument.filter({ project_id: project.id }, { limit: 10 });
      setDocs(res.items || []);
    } catch (e) {
      setError(e?.response?.data?.error || 'Generation failed. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const buildDossierSections = () => {
    const sections = [
      { heading: 'Executive Summary', body: project.executive_summary || '' },
      { heading: 'Value Proposition', body: project.value_proposition || '' },
      { heading: 'Market Analysis', body: project.market_analysis || '' },
      { heading: 'Strategic Edge', body: project.strategic_edge || '' },
      { heading: 'Investor Narrative', body: project.investor_narrative || '' }
    ];
    (project.plan_points || []).forEach((p) => {
      sections.push({ heading: `${p.index}. ${p.title}`, body: `${p.content}\n- Plan point score: ${p.score}/10` });
    });
    if (project.financial_forecast) {
      const years = (project.forecast_years || []).map((y) => `- ${y.year}: revenue $${Number(y.revenue).toLocaleString()}, expenses $${Number(y.expenses).toLocaleString()}, EBITDA $${Number(y.ebitda).toLocaleString()}, growth ${y.growth_rate}%`).join('\n');
      sections.push({ heading: 'Financial Forecast', body: `${project.financial_forecast}\n\n${years}` });
    }
    return sections;
  };

  const buildFundingSections = () => {
    if (funding.length === 0) {
      return [{ heading: 'No aligned sources mapped', body: 'Run the base analysis to map grants, loans, venture firms and angels aligned with this business.' }];
    }
    const TYPE_LABEL = { grant: 'Grant', vc: 'Venture Capital', angel: 'Angel Group', loan: 'Loan Program' };
    return funding.map((f) => ({
      heading: f.name,
      body: [
        `- Type: ${TYPE_LABEL[f.type] || f.type}`,
        f.stage && `- Stage: ${f.stage}`,
        f.focus_area && `- Focus: ${f.focus_area}`,
        f.alignment_rationale && `- Alignment: ${f.alignment_rationale}`,
        f.contact_info && `- Contact: ${f.contact_info}`,
        f.application_draft && `\nApplication / Pitch Draft:\n${f.application_draft}`,
        f.outreach_subject && `\nOutreach Subject: ${f.outreach_subject}`,
        f.outreach_email && `\nOutreach Email:\n${f.outreach_email}`
      ].filter(Boolean).join('\n')
    }));
  };

  const buildAuditSections = (doc) => {
    const a = doc.audit || {};
    const sections = [
      { heading: `Investment Readiness Score: ${a.overall}/100`, body: 'Each dimension is scored out of 25. Scores are audited against the dossier, not awarded generously.' },
      ...(a.dimensions || []).map((d) => ({ heading: `${d.name}: ${d.score}/${d.max}`, body: d.note || '' })),
      { heading: 'Enhancement Ideas', body: (a.enhancement_ideas || []).map((e) => `- ${e.title} (est. +${e.score_impact} pts): ${e.detail}`).join('\n') }
    ];
    return sections;
  };

  const downloadZip = async () => {
    setZipping(true);
    try {
      const zip = new JSZip();
      const files = [
        ['01_Investment_Dossier.pdf', { title: 'Investment Dossier', subtitle: project.company_name, sections: buildDossierSections() }],
        ['02_Product_Requirements_Document.pdf', { title: byKind.prd?.title || 'Product Requirements Document', subtitle: project.company_name, sections: byKind.prd?.sections || [] }],
        ['03_Technical_Specifications.pdf', { title: byKind.tech_spec?.title || 'Technical Specifications', subtitle: project.company_name, sections: byKind.tech_spec?.sections || [] }],
        ['04_Funding_and_Capital_Directory.pdf', { title: 'Funding and Capital Directory', subtitle: project.company_name, sections: buildFundingSections() }],
        ['05_Investment_Readiness_Audit.pdf', { title: byKind.irs_audit?.title || 'Investment Readiness Audit', subtitle: project.company_name, sections: byKind.irs_audit ? buildAuditSections(byKind.irs_audit) : [] }],
        ['06_Legal_Framework.pdf', { title: byKind.legal_framework?.title || 'Legal Framework', subtitle: project.company_name, sections: byKind.legal_framework?.sections || [] }]
      ];
      for (const [name, spec] of files) {
        if (!spec.sections || spec.sections.length === 0) continue;
        zip.file(name, makePdf(spec).output('arraybuffer'));
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slugify(project.company_name)}_Investment_Readiness_Package.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipping(false);
    }
  };

  const hasDocs = missing.length === 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="size-11 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Package className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold">Investment Readiness Zip-Package</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Assembles six institutional-grade PDFs: investment dossier, PRD, technical specifications, funding directory, readiness audit, and the Black's Law hardened legal framework.
            </p>
          </div>
        </div>

        {generating && (
          <div className="mt-5 rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2.5 text-sm font-medium">
              <Loader2 className="size-4 animate-spin" /> {STAGES[stage]}…
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-1/3 bg-slate-900 rounded-full animate-[pulse_2s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {loading ? (
          <div className="mt-5 h-10 w-40 rounded-md bg-muted animate-pulse" />
        ) : (
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={generate} disabled={generating}>
              {generating ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <RefreshCw className="size-4 mr-1.5" />}
              {docs.length === 0 ? 'Generate package documents' : 'Regenerate package documents'}
            </Button>
            <Button variant="outline" onClick={downloadZip} disabled={!hasDocs || zipping || generating}>
              {zipping ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Download className="size-4 mr-1.5" />}
              Download ZIP
            </Button>
          </div>
        )}

        {!loading && !hasDocs && docs.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">Missing: {missing.map((k) => KIND_TITLES[k]).join(', ')}. Regenerate to complete the set.</p>
        )}
      </div>

      {hasDocs && !loading && (
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            '01_Investment_Dossier.pdf',
            `02_${KIND_TITLES.prd}.pdf`,
            `03_${KIND_TITLES.tech_spec}.pdf`,
            '04_Funding_and_Capital_Directory.pdf',
            `05_${KIND_TITLES.irs_audit}.pdf`,
            `06_${KIND_TITLES.legal_framework}.pdf`
          ].map((name) => (
            <div key={name} className="flex items-center gap-2.5 rounded-lg border bg-card px-4 py-3 text-sm">
              <FileCheck2 className="size-4 text-emerald-600 shrink-0" />
              <span className="truncate">{name}</span>
            </div>
          ))}
          {byKind.irs_audit?.audit?.overall != null && (
            <div className="sm:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm font-medium">
              Investment Readiness Score: {byKind.irs_audit.audit.overall}/100
            </div>
          )}
        </div>
      )}
    </div>
  );
}