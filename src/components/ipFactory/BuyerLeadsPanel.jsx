import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import moment from 'moment';

const CATEGORY_STYLE = {
  incumbent: 'bg-slate-100 text-slate-800',
  platform: 'bg-blue-50 text-blue-800',
  reseller: 'bg-purple-50 text-purple-800',
  acquirer: 'bg-emerald-50 text-emerald-800',
  services: 'bg-amber-50 text-amber-800',
  research: 'bg-cyan-50 text-cyan-800'
};

function Pitch({ lead }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(`Subject: ${lead.subject}\n\n${lead.pitch}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="rounded-md bg-muted/50 p-3 space-y-2">
      <div className="text-xs font-semibold">{lead.subject}</div>
      <p className="text-xs leading-relaxed whitespace-pre-wrap">{lead.pitch}</p>
      <Button size="sm" variant="outline" onClick={copy}>
        {copied ? <Check className="size-3.5 mr-1.5" /> : <Copy className="size-3.5 mr-1.5" />}
        {copied ? 'Copied' : 'Copy email'}
      </Button>
    </div>
  );
}

function IntelLine({ intel }) {
  if (!intel) return null;
  const details = [
    intel.industry,
    intel.employees ? `${Number(intel.employees).toLocaleString('en-US')} staff` : '',
    [intel.city, intel.country].filter(Boolean).join(', '),
    intel.domain,
    intel.lifecycle_stage
  ].filter(Boolean);
  const moved = intel.last_activity || intel.synced_date;
  return (
    <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
      <Building2 className="size-3 mt-0.5 shrink-0" />
      <span>
        HubSpot{details.length ? ` · ${details.join(' · ')}` : ''}
        {moved ? <span className="text-muted-foreground/70"> · updated {moment(moved).fromNow()}</span> : null}
      </span>
    </div>
  );
}

export default function BuyerLeadsPanel({ leads }) {
  const [open, setOpen] = useState(-1);
  const [intel, setIntel] = useState({});

  const keys = Array.from(new Set(
    (Array.isArray(leads) ? leads : []).map((lead) => String(lead?.company || '').trim().toLowerCase()).filter(Boolean)
  ));
  const keySeed = keys.join('|');

  useEffect(() => {
    if (!keys.length) { setIntel({}); return; }
    let live = true;
    base44.entities.HubspotCompany.filter({ company: { $in: keys } }, { limit: keys.length })
      .then((page) => {
        const map = {};
        (page.items || []).forEach((row) => { map[row.company] = row; });
        if (live) setIntel(map);
      })
      .catch(() => { if (live) setIntel({}); });
    return () => { live = false; };
  }, [keySeed]);

  if (!Array.isArray(leads) || !leads.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Named Buyer Leads</h4>
        <Badge variant="secondary" className="bg-slate-100">{leads.length}</Badge>
      </div>
      <div className="space-y-2">
        {leads.map((lead, i) => (
          <div key={`${lead.company}-${i}`} className="rounded-md border p-2.5 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{lead.company}</span>
              {lead.category && (
                <Badge variant="secondary" className={CATEGORY_STYLE[lead.category] || 'bg-slate-100'}>{lead.category}</Badge>
              )}
            </div>
            <IntelLine intel={intel[String(lead.company || '').trim().toLowerCase()]} />
            {lead.why_fit && <p className="text-xs leading-relaxed text-muted-foreground">{lead.why_fit}</p>}
            {lead.contact_role && <p className="text-xs"><span className="text-muted-foreground">Reach: </span>{lead.contact_role}</p>}
            {lead.approach && <p className="text-xs"><span className="text-muted-foreground">Opening move: </span>{lead.approach}</p>}
            {lead.evidence_to_lead_with && <p className="text-xs"><span className="text-muted-foreground">Lead with: </span>{lead.evidence_to_lead_with}</p>}
            {lead.pitch && (
              <>
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? -1 : i)}
                  aria-expanded={open === i}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:underline"
                >
                  {open === i ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  {open === i ? 'Hide pitch' : 'Show pitch'}
                </button>
                {open === i && <Pitch lead={lead} />}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}