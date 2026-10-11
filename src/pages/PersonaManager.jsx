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

const EMPTY = { persona_name: '', role_title: '', niche: '', platform: '', positioning: '', audience_estimate: '', status: 'designed', disclosure: 'Disclosed AI persona' };

function PersonaForm({ initial, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = (e) => { e.preventDefault(); onSubmit(form); };
  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
      <div><Label>Persona name</Label><Input required className="mt-1" value={form.persona_name} onChange={(e) => set('persona_name', e.target.value)} /></div>
      <div><Label>Role title</Label><Input className="mt-1" value={form.role_title || ''} onChange={(e) => set('role_title', e.target.value)} /></div>
      <div><Label>Niche</Label><Input required className="mt-1" value={form.niche} onChange={(e) => set('niche', e.target.value)} /></div>
      <div><Label>Platform</Label><Input className="mt-1" value={form.platform || ''} onChange={(e) => set('platform', e.target.value)} /></div>
      <div className="sm:col-span-2"><Label>Positioning</Label><Textarea rows={2} className="mt-1" value={form.positioning || ''} onChange={(e) => set('positioning', e.target.value)} /></div>
      <div>
        <Label>Audience estimate</Label>
        <Input type="number" className="mt-1" value={form.audience_estimate ?? ''} onChange={(e) => set('audience_estimate', e.target.value ? Number(e.target.value) : '')} />
      </div>
      <div>
        <Label>Status</Label>
        <select value={form.status || 'designed'} onChange={(e) => set('status', e.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-white px-3 text-sm">
          {['designed', 'launched', 'scaled'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2 flex gap-2">
        <Button type="submit" size="sm" disabled={saving} className="bg-bottle hover:bg-bottle/90 text-bottle-foreground">{saving ? 'Saving…' : 'Save persona'}</Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export default function PersonaManager() {
  const [personas, setPersonas] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.SyntheticPersona.filter({}, { sort: '-created_date', limit: 50 })
      .then((p) => setPersonas(p.items)).catch(() => setPersonas([]));
  }, []);

  const create = async (form) => {
    setSaving(true);
    try {
      const rec = await base44.entities.SyntheticPersona.create({ ...form, designed_date: new Date().toISOString().slice(0, 10) });
      setPersonas((p) => [rec, ...(p || [])]);
      setCreating(false);
    } finally { setSaving(false); }
  };
  const update = async (id, form) => {
    setSaving(true);
    try {
      await base44.entities.SyntheticPersona.update(id, form);
      setPersonas((p) => p.map((x) => (x.id === id ? { ...x, ...form } : x)));
      setEditingId(null);
    } finally { setSaving(false); }
  };
  const remove = async (id) => {
    setPersonas((p) => p.filter((x) => x.id !== id));
    await base44.entities.SyntheticPersona.delete(id);
  };

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Persona Manager"
        subtitle="Traits and persuasion positioning for the synthetic agent pods used during dossier generation."
      >
        <Button size="sm" className="bg-bottle hover:bg-bottle/90 text-bottle-foreground" onClick={() => { setCreating(true); setEditingId(null); }}>
          <Plus className="size-4" /> New persona
        </Button>
      </PageHeader>

      {creating && (
        <Card className="p-5 rounded-md">
          <PersonaForm initial={EMPTY} onSubmit={create} onCancel={() => setCreating(false)} saving={saving} />
        </Card>
      )}

      {personas == null ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-md" />)}</div>
      ) : personas.length === 0 && !creating ? (
        <Card className="p-12 text-center border-dashed rounded-md">
          <h3 className="font-heading text-xl tracking-tight">No personas yet</h3>
          <p className="text-sm text-muted-foreground mt-2">Define the agent pods' personality traits and persuasion tactics here.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {personas.map((p) => (
            <Card key={p.id} className="p-5 rounded-md space-y-3">
              {editingId === p.id ? (
                <PersonaForm initial={p} onSubmit={(f) => update(p.id, f)} onCancel={() => setEditingId(null)} saving={saving} />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-heading text-lg tracking-tight">{p.persona_name}</div>
                      <div className="text-xs text-muted-foreground">{p.role_title || '—'} · {p.niche}</div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize shrink-0">{p.status}</Badge>
                  </div>
                  {p.positioning && <p className="text-sm line-clamp-2">{p.positioning}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{p.platform || '—'}{p.audience_estimate ? ` · ~${Number(p.audience_estimate).toLocaleString()} audience` : ''}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditingId(p.id)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => remove(p.id)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}