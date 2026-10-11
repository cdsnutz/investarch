import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { copyText } from '@/lib/exporter';
import { Copy, Check } from 'lucide-react';

const TYPES = ['all', 'grant', 'vc', 'angel', 'loan'];

function CopyBlock({ label, text }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  return (
    <div className="rounded border border-border bg-secondary/40 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <button
          onClick={() => copyText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
          className="text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      {label === 'Outreach subject' ? <p className="text-sm">{text}</p> : <p className="text-sm whitespace-pre-line line-clamp-6">{text}</p>}
    </div>
  );
}

export default function InvestorMatchmaker() {
  const [sources, setSources] = useState(null);
  const [type, setType] = useState('all');
  const [projectNames, setProjectNames] = useState({});
  const [open, setOpen] = useState(null);

  useEffect(() => {
    base44.entities.FundingSource.filter(type === 'all' ? {} : { type }, { sort: '-created_date', limit: 50 })
      .then((p) => setSources(p.items)).catch(() => setSources([]));
  }, [type]);

  useEffect(() => {
    base44.entities.Project.filter({}, { fields: ['id', 'company_name'], limit: 500 })
      .then((p) => setProjectNames(Object.fromEntries(p.items.map((r) => [r.id, r.company_name])))).catch(() => {});
  }, []);

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Investor Matchmaker"
        subtitle="Investors matched to your business plans, with fit rationale and high-conviction outreach strategies."
      />

      <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 rounded-md border border-input bg-white px-3 text-sm capitalize">
        {TYPES.map((t) => <option key={t} value={t}>{t === 'all' ? 'All investor types' : t}</option>)}
      </select>

      {sources == null ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-md" />)}</div>
      ) : sources.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-md">
          <h3 className="font-heading text-xl tracking-tight">No matches yet</h3>
          <p className="text-sm text-muted-foreground mt-2">Run funding drafts on a dossier to generate investor matches.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sources.map((s) => (
            <Card key={s.id} className="p-5 rounded-md space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading text-lg tracking-tight">{s.name}</span>
                    <Badge variant="outline" className="text-xs capitalize">{s.type || 'investor'}</Badge>
                    {s.stage && <span className="text-xs text-muted-foreground">{s.stage}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {projectNames[s.project_id] ? `Matched to ${projectNames[s.project_id]}` : 'Standalone match'}{s.focus_area ? ` · ${s.focus_area}` : ''}
                  </div>
                </div>
              </div>
              {s.alignment_rationale && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Fit rationale</div>
                  <p className="text-sm">{s.alignment_rationale}</p>
                </div>
              )}
              {(s.outreach_email || s.application_draft) && (
                <button onClick={() => setOpen(open === s.id ? null : s.id)} className="text-xs text-bottle hover:underline">
                  {open === s.id ? 'Hide outreach' : 'View outreach strategy'}
                </button>
              )}
              {open === s.id && (
                <div className="space-y-2">
                  {s.outreach_subject && <CopyBlock label="Outreach subject" text={s.outreach_subject} />}
                  {s.outreach_email && <CopyBlock label="Outreach email" text={s.outreach_email} />}
                  {s.application_draft && <CopyBlock label="Application draft" text={s.application_draft} />}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}