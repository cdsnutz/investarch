import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, Plus } from 'lucide-react';

const EMPTY = { constant_name: '', axiom_text: '', solves_for: '', efficiency_note: '' };

function AxiomForm({ initial, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = (e) => { e.preventDefault(); onSubmit(form); };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div><Label>Value proposition name</Label><Input required className="mt-1" value={form.constant_name} onChange={(e) => set('constant_name', e.target.value)} /></div>
      <div>
        <Label>Strategic pillar / axiom</Label>
        <Textarea required rows={3} className="mt-1" placeholder="The fundamental value proposition or pillar the AI should process…" value={form.axiom_text} onChange={(e) => set('axiom_text', e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><Label>Solves for</Label><Input required className="mt-1" value={form.solves_for} onChange={(e) => set('solves_for', e.target.value)} /></div>
        <div><Label>Efficiency note (optional)</Label><Input className="mt-1" value={form.efficiency_note || ''} onChange={(e) => set('efficiency_note', e.target.value)} /></div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving} className="bg-bottle hover:bg-bottle/90 text-bottle-foreground">{saving ? 'Saving…' : 'Save axiom'}</Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export default function StrategyBlueprint() {
  const [axioms, setAxioms] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.LogicConstant.filter({}, { sort: '-created_date', limit: 50 })
      .then((p) => setAxioms(p.items)).catch(() => setAxioms([]));
  }, []);

  const create = async (form) => {
    setSaving(true);
    try {
      const rec = await base44.entities.LogicConstant.create({
        ...form,
        version: '1.0',
        defined_date: new Date().toISOString().slice(0, 10)
      });
      setAxioms((a) => [rec, ...(a || [])]);
      setCreating(false);
    } finally { setSaving(false); }
  };
  const update = async (id, form) => {
    setSaving(true);
    try {
      await base44.entities.LogicConstant.update(id, form);
      setAxioms((a) => a.map((x) => (x.id === id ? { ...x, ...form } : x)));
      setEditingId(null);
    } finally { setSaving(false); }
  };
  const remove = async (id) => {
    setAxioms((a) => a.filter((x) => x.id !== id));
    await base44.entities.LogicConstant.delete(id);
  };

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-4xl mx-auto space-y-10">
      <PageHeader
        title="Strategy Blueprint"
        subtitle="Store your fundamental value propositions and strategic pillars for the engine to process in future runs."
      >
        <Button size="sm" className="bg-bottle hover:bg-bottle/90 text-bottle-foreground" onClick={() => { setCreating(true); setEditingId(null); }}>
          <Plus className="size-4" /> New axiom
        </Button>
      </PageHeader>

      {creating && (
        <Card className="p-5 rounded-md">
          <AxiomForm initial={EMPTY} onSubmit={create} onCancel={() => setCreating(false)} saving={saving} />
        </Card>
      )}

      {axioms == null ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-md" />)}</div>
      ) : axioms.length === 0 && !creating ? (
        <Card className="p-12 text-center border-dashed rounded-md">
          <h3 className="font-heading text-xl tracking-tight">Blueprint is empty</h3>
          <p className="text-sm text-muted-foreground mt-2">Add your first value proposition or strategic pillar.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {axioms.map((a) => (
            <Card key={a.id} className="p-5 rounded-md space-y-3">
              {editingId === a.id ? (
                <AxiomForm initial={a} onSubmit={(f) => update(a.id, f)} onCancel={() => setEditingId(null)} saving={saving} />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading text-lg tracking-tight">{a.constant_name}</span>
                        <Badge variant="outline" className="text-xs">v{a.version}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Solves for: {a.solves_for}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditingId(a.id)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => remove(a.id)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-line">{a.axiom_text}</p>
                  {a.efficiency_note && <p className="text-xs text-muted-foreground">{a.efficiency_note}</p>}
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}