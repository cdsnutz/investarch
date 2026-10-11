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
import { Plus, Trash2 } from 'lucide-react';

const EMPTY = { target_competitor: '', domain: '', technical_debt: '', churn_analysis: '', customer_complaints: '', kill_feature: '' };

function EntryForm({ onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(EMPTY);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = (e) => { e.preventDefault(); onSubmit(form); };
  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
      <div><Label>Target competitor</Label><Input required className="mt-1" value={form.target_competitor} onChange={(e) => set('target_competitor', e.target.value)} /></div>
      <div><Label>Domain</Label><Input className="mt-1" value={form.domain} onChange={(e) => set('domain', e.target.value)} /></div>
      <div className="sm:col-span-2"><Label>Technical debt observed</Label><Textarea rows={2} className="mt-1" value={form.technical_debt} onChange={(e) => set('technical_debt', e.target.value)} /></div>
      <div className="sm:col-span-2"><Label>Customer complaints / churn signals</Label><Textarea rows={2} className="mt-1" value={form.customer_complaints} onChange={(e) => set('customer_complaints', e.target.value)} /></div>
      <div className="sm:col-span-2"><Label>Kill feature (leverageable weakness)</Label><Input required className="mt-1" value={form.kill_feature} onChange={(e) => set('kill_feature', e.target.value)} /></div>
      <div className="sm:col-span-2 flex gap-2">
        <Button type="submit" size="sm" disabled={saving} className="bg-bottle hover:bg-bottle/90 text-bottle-foreground">{saving ? 'Logging…' : 'Log weakness'}</Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export default function DisruptionLog() {
  const [entries, setEntries] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    base44.entities.DisruptionPlan.filter({}, { sort: '-created_date', limit: 50 })
      .then((p) => setEntries(p.items)).catch(() => setEntries([]));
  }, []);

  const create = async (form) => {
    setSaving(true);
    try {
      const rec = await base44.entities.DisruptionPlan.create({ ...form, generated_date: new Date().toISOString().slice(0, 10) });
      setEntries((e) => [rec, ...(e || [])]);
      setCreating(false);
    } finally { setSaving(false); }
  };
  const remove = async (id) => {
    setEntries((e) => e.filter((x) => x.id !== id));
    await base44.entities.DisruptionPlan.delete(id);
  };

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-4xl mx-auto space-y-10">
      <PageHeader
        title="Disruption Log"
        subtitle="Competitor weaknesses and technical debt items logged for leverage in future investment pitches."
      >
        <Button size="sm" className="bg-bottle hover:bg-bottle/90 text-bottle-foreground" onClick={() => setCreating(true)}><Plus className="size-4" /> Log weakness</Button>
      </PageHeader>

      {creating && (
        <Card className="p-5 rounded-md"><EntryForm onSubmit={create} onCancel={() => setCreating(false)} saving={saving} /></Card>
      )}

      {entries == null ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-md" />)}</div>
      ) : entries.length === 0 && !creating ? (
        <Card className="p-12 text-center border-dashed rounded-md">
          <h3 className="font-heading text-xl tracking-tight">Log is empty</h3>
          <p className="text-sm text-muted-foreground mt-2">Discovered weaknesses, churn signals and technical debt appear here.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((d) => (
            <Card key={d.id} className="p-5 rounded-md space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading text-lg tracking-tight">{d.target_competitor}</span>
                    {d.domain && <Badge variant="outline" className="text-xs">{d.domain}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Kill feature: {d.kill_feature}</div>
                </div>
                <Button variant="ghost" size="icon" className="size-8 text-destructive shrink-0" onClick={() => remove(d.id)}><Trash2 className="size-3.5" /></Button>
              </div>
              <button onClick={() => setOpen(open === d.id ? null : d.id)} className="text-xs text-bottle hover:underline">
                {open === d.id ? 'Hide detail' : 'View detail'}
              </button>
              {open === d.id && (
                <div className="border-t border-border pt-3 space-y-2 text-sm">
                  {d.technical_debt && <p><span className="text-xs uppercase tracking-wide text-muted-foreground">Technical debt: </span>{d.technical_debt}</p>}
                  {d.churn_analysis && <p><span className="text-xs uppercase tracking-wide text-muted-foreground">Churn analysis: </span>{d.churn_analysis}</p>}
                  {d.customer_complaints && <p><span className="text-xs uppercase tracking-wide text-muted-foreground">Customer complaints: </span>{d.customer_complaints}</p>}
                  {d.obsolescence_path && <p><span className="text-xs uppercase tracking-wide text-muted-foreground">Obsolescence path: </span>{d.obsolescence_path}</p>}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}