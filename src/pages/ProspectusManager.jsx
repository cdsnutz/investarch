import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { downloadFile, slugify } from '@/lib/exporter';
import { Pencil, Download } from 'lucide-react';

export default function ProspectusManager() {
  const [items, setItems] = useState(null);
  const [seedTitles, setSeedTitles] = useState({});
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState({ prospectus: '', offer_terms: '' });
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    base44.entities.IpProspectus.filter({}, { sort: '-created_date', limit: 50 })
      .then((p) => setItems(p.items)).catch(() => setItems([]));
    base44.entities.IpSeed.filter({}, { fields: ['id', 'title'], limit: 500 })
      .then((p) => setSeedTitles(Object.fromEntries(p.items.map((s) => [s.id, s.title])))).catch(() => {});
  }, []);

  const startEdit = (p) => {
    setEditId(p.id);
    setDraft({ prospectus: p.prospectus || '', offer_terms: p.offer_terms || '' });
  };
  const save = async (p) => {
    setItems((it) => it.map((x) => (x.id === p.id ? { ...x, ...draft } : x)));
    setEditId(null);
    await base44.entities.IpProspectus.update(p.id, draft);
  };
  const exportOne = (p) => {
    const title = seedTitles[p.seed_id] || 'prospectus';
    downloadFile(`${slugify(title)}-prospectus.txt`, `PROSPECTUS\n\n${p.prospectus || ''}\n\nOFFER (${p.offer_type || 'n/a'}):\n${p.offer_terms || ''}`, 'text/plain');
  };

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Prospectus Manager"
        subtitle="View, edit, and export the generated prospectuses for your investment projects."
      />

      {items == null ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-md" />)}</div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-md">
          <h3 className="font-heading text-xl tracking-tight">No prospectuses yet</h3>
          <p className="text-sm text-muted-foreground mt-2">Prospectuses generated for your IP seeds appear here.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((p) => {
            const title = seedTitles[p.seed_id] || 'Untitled asset';
            return (
              <Card key={p.id} className="p-5 rounded-md space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-heading text-lg tracking-tight">{title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{p.offer_type || 'unpriced'}</Badge>
                      <span className="text-xs text-muted-foreground">{(p.targets || []).map((t) => t.name).join(', ')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => (editId === p.id ? setEditId(null) : startEdit(p))}>
                      <Pencil className="size-3.5" /> {editId === p.id ? 'Cancel' : 'Edit'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportOne(p)}><Download className="size-3.5" /> Export</Button>
                  </div>
                </div>

                {editId === p.id ? (
                  <div className="space-y-3">
                    <Textarea rows={8} value={draft.prospectus} onChange={(e) => setDraft((d) => ({ ...d, prospectus: e.target.value }))} />
                    <Textarea rows={3} placeholder="Offer terms" value={draft.offer_terms} onChange={(e) => setDraft((d) => ({ ...d, offer_terms: e.target.value }))} />
                    <Button size="sm" className="bg-bottle hover:bg-bottle/90 text-bottle-foreground" onClick={() => save(p)}>Save</Button>
                  </div>
                ) : (
                  <>
                    <p className={`text-sm whitespace-pre-line ${expanded === p.id ? '' : 'line-clamp-3'}`}>{p.prospectus}</p>
                    <div className="flex gap-4">
                      <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="text-xs text-bottle hover:underline">
                        {expanded === p.id ? 'Show less' : 'Read full prospectus'}
                      </button>
                    </div>
                    {expanded === p.id && p.offer_terms && (
                      <div className="rounded border border-border bg-secondary/40 p-3 text-sm whitespace-pre-line">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Offer terms</div>
                        {p.offer_terms}
                      </div>
                    )}
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}