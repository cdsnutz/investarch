import { Badge } from '@/components/ui/badge';

function Block({ title, children }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      <div className="text-sm leading-relaxed whitespace-pre-wrap">{children}</div>
    </div>
  );
}

const VERDICT_STYLE = {
  pass: 'bg-emerald-50 text-emerald-800',
  conditional: 'bg-amber-50 text-amber-800',
  blocked: 'bg-red-50 text-red-800'
};

export default function PlaybookSection({ seed }) {
  const leads = Array.isArray(seed.buyer_leads) ? seed.buyer_leads : [];
  const report = seed.hardening_report;
  const hasAny = seed.funding_playbook || seed.acquisition_playbook || leads.length
    || seed.marketing_plan || seed.research_brief || report;
  if (!hasAny) return null;

  return (
    <div className="space-y-4">
      {report && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hardening Bench</h4>
            <Badge variant="secondary" className={VERDICT_STYLE[report.verdict] || 'bg-slate-100'}>
              {report.verdict} {report.score != null ? `${report.score}/100` : ''}
            </Badge>
            {report.date && <span className="text-[11px] text-muted-foreground">{String(report.date).slice(0, 10)}</span>}
          </div>
          {report.summary && <p className="text-sm leading-relaxed">{report.summary}</p>}
          <div className="space-y-2">
            {(report.pods || []).map((pod, i) => (
              <div key={i} className="rounded-md bg-muted/40 p-2.5 space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Pod: {pod.pod}</div>
                {(pod.findings || []).map((f, k) => <p key={`f${k}`} className="text-xs leading-relaxed">Finding — {f}</p>)}
                {(pod.fixes || []).map((f, k) => <p key={`x${k}`} className="text-xs leading-relaxed text-emerald-800">Fix — {f}</p>)}
              </div>
            ))}
          </div>
        </div>
      )}

      {seed.funding_playbook && <Block title="Funding Playbook">{seed.funding_playbook}</Block>}
      {seed.acquisition_playbook && <Block title="Acquisition Playbook">{seed.acquisition_playbook}</Block>}

      {leads.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Named Buyer Leads</h4>
          <div className="space-y-2">
            {leads.map((lead, i) => (
              <div key={i} className="rounded-md border p-2.5 space-y-1">
                <div className="text-sm font-medium">{lead.company}</div>
                {lead.why_fit && <p className="text-xs leading-relaxed text-muted-foreground">{lead.why_fit}</p>}
                {lead.contact_role && <p className="text-xs"><span className="text-muted-foreground">Reach: </span>{lead.contact_role}</p>}
                {lead.approach && <p className="text-xs"><span className="text-muted-foreground">Opening move: </span>{lead.approach}</p>}
                {lead.evidence_to_lead_with && <p className="text-xs"><span className="text-muted-foreground">Lead with: </span>{lead.evidence_to_lead_with}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {seed.marketing_plan && <Block title="Marketing Plan">{seed.marketing_plan}</Block>}
      {seed.research_brief && <Block title="Research Brief">{seed.research_brief}</Block>}
    </div>
  );
}