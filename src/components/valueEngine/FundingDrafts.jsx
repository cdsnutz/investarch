import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

function CopyBlock({ label, text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <button onClick={copy} className="text-xs inline-flex items-center gap-1 text-slate-600 hover:text-slate-900">
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3">{text}</div>
    </div>
  );
}

export default function FundingDrafts({ sources }) {
  const drafted = sources.filter(s => s.application_draft || s.outreach_email);
  if (!drafted.length) {
    return <p className="text-sm text-muted-foreground">Run the value engine to draft applications and outreach for these sources.</p>;
  }
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Drafted Applications and Outreach</h3>
      {drafted.map((s) => (
        <div key={s.id} className="rounded-xl border border-border p-5 space-y-4">
          <div className="font-medium tracking-tight">{s.name}</div>
          {s.outreach_subject && <div className="text-sm font-medium">Subject: {s.outreach_subject}</div>}
          {s.application_draft && <CopyBlock label="Application draft" text={s.application_draft} />}
          {s.outreach_email && <CopyBlock label="Outreach email" text={s.outreach_email} />}
        </div>
      ))}
    </div>
  );
}