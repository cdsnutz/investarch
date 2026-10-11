import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { downloadFile, toCsv, slugify } from '@/lib/exporter';
import { X, Download } from 'lucide-react';
import moment from 'moment';

function TagRow({ tags, draft, onDraft, onAdd, onRemove }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {(tags || []).map((t) => (
        <Badge key={t} variant="outline" className="text-xs gap-1">
          {t}
          <button onClick={() => onRemove(t)} className="text-muted-foreground hover:text-foreground"><X className="size-3" /></button>
        </Badge>
      ))}
      <input
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) onAdd(draft.trim()); }}
        placeholder="Add tag"
        className="h-6 w-24 rounded border border-input bg-transparent px-2 text-xs"
      />
    </div>
  );
}

export default function StrategyVault() {
  const [tab, setTab] = useState('dossiers');
  const [dossiers, setDossiers] = useState(null);
  const [narratives, setNarratives] = useState(null);
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    base44.entities.Project.filter({ status: 'complete' }, { sort: '-created_date', limit: 50 })
      .then((p) => setDossiers(p.items)).catch(() => setDossiers([]));
    base44.entities.NarrativeVector.list({ sort: '-created_date', limit: 50 })
      .then((n) => setNarratives(n.items)).catch(() => setNarratives([]));
  }, []);

  const addTag = async (p, tag) => {
    const tags = [...new Set([...(p.tags || []), tag])];
    setDossiers((d) => d.map((x) => (x.id === p.id ? { ...x, tags } : x)));
    setDrafts((d) => ({ ...d, [p.id]: '' }));
    await base44.entities.Project.update(p.id, { tags });
  };
  const removeTag = async (p, tag) => {
    const tags = (p.tags || []).filter((t) => t !== tag);
    setDossiers((d) => d.map((x) => (x.id === p.id ? { ...x, tags } : x)));
    await base44.entities.Project.update(p.id, { tags });
  };
  const exportOne = (p) => downloadFile(`${slugify(p.company_name)}-dossier.json`, JSON.stringify(p, null, 2));
  const exportAll = () => downloadFile('strategy-vault.csv', toCsv((dossiers || []).map((p) => ({
    company: p.company_name || '',
    industry: p.industry || '',
    scan_score: p.scan_score ?? '',
    plan_revisions: p.plan_revisions ?? 0,
    tags: (p.tags || []).join('; '),
    created: p.created_date
  }))), 'text/csv');

  const tabBtn = (key, label) => (
    <button
      onClick={() => setTab(key)}
      className={`px-1 pb-2 text-sm border-b-2 transition ${tab === key ? 'border-foreground text-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Strategy Vault"
        subtitle="A centralized library of past successful dossiers and high-conversion market narratives, tagged and exportable."
      >
        <Button variant="outline" size="sm" onClick={exportAll}>Export dossiers (CSV)</Button>
      </PageHeader>

      <div className="flex gap-6 border-b border-border">
        {tabBtn('dossiers', 'Dossiers')}
        {tabBtn('narratives', 'Market Narratives')}
      </div>

      {tab === 'dossiers' && (
        dossiers == null ? (
          <div className="grid md:grid-cols-2 gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-md" />)}</div>
        ) : dossiers.length === 0 ? (
          <Card className="p-12 text-center border-dashed rounded-md">
            <h3 className="font-heading text-xl tracking-tight">Vault is empty</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-6">Completed dossiers are archived here automatically.</p>
            <Button asChild className="mx-auto bg-bottle hover:bg-bottle/90 text-bottle-foreground"><Link to="/new">Run an analysis</Link></Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {dossiers.map((p) => (
              <Card key={p.id} className="p-5 rounded-md flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/projects/${p.id}`} className="font-heading text-lg tracking-tight hover:underline">{p.company_name || 'Untitled'}</Link>
                  <div className="text-right shrink-0">
                    <div className="font-heading text-2xl tabular-nums leading-none">{p.scan_score ?? '—'}</div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">Scan score</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{p.industry || p.url} · {moment(p.created_date).format('MMM D, YYYY')}</div>
                <TagRow
                  tags={p.tags}
                  draft={drafts[p.id] || ''}
                  onDraft={(v) => setDrafts((d) => ({ ...d, [p.id]: v }))}
                  onAdd={(t) => addTag(p, t)}
                  onRemove={(t) => removeTag(p, t)}
                />
                <Button variant="outline" size="sm" className="self-start" onClick={() => exportOne(p)}><Download className="size-3.5" /> Export JSON</Button>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === 'narratives' && (
        narratives == null ? (
          <div className="grid md:grid-cols-2 gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-md" />)}</div>
        ) : narratives.length === 0 ? (
          <Card className="p-12 text-center border-dashed rounded-md">
            <h3 className="font-heading text-xl tracking-tight">No narratives yet</h3>
            <p className="text-sm text-muted-foreground mt-2">High-conversion narratives from the engine appear here.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {narratives.map((n) => (
              <Card key={n.id} className="p-5 rounded-md space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-heading text-lg tracking-tight">{n.narrative_name}</div>
                  <Badge variant={n.status === 'locked' ? 'secondary' : 'outline'} className="text-xs shrink-0">{n.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{n.target_market}</div>
                <p className="text-sm line-clamp-3">{n.narrative_thesis}</p>
                <div className="text-xs text-muted-foreground">Adoption forecast: {n.adoption_forecast_pct ?? '—'}% · {moment(n.seeded_date || n.created_date).format('MMM D, YYYY')}</div>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}