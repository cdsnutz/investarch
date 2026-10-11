import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, Pencil } from 'lucide-react';

const SECTIONS = [
  { key: 'executive_summary', label: 'Executive Summary' },
  { key: 'value_proposition', label: 'Value Proposition' },
  { key: 'market_analysis', label: 'Market Analysis' },
  { key: 'strategic_edge', label: 'Strategic Edge' },
  { key: 'financial_forecast', label: 'Financial Forecast' },
  { key: 'investor_narrative', label: 'Investor Narrative' }
];

export default function DossierWorkshop() {
  const [projects, setProjects] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [project, setProject] = useState(null);
  const [editKey, setEditKey] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [guidance, setGuidance] = useState('');
  const [regenKey, setRegenKey] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Project.filter({}, { sort: '-created_date', limit: 50, fields: ['company_name', 'status', 'created_date'] })
      .then((p) => setProjects(p.items)).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setProject(null);
    base44.entities.Project.get(projectId).then(setProject).catch(() => setProject(null));
  }, [projectId]);

  const saveEdit = async (key) => {
    setSaving(true);
    try {
      await base44.entities.Project.update(projectId, { [key]: editDraft });
      setProject((p) => ({ ...p, [key]: editDraft }));
      setEditKey(null);
    } finally { setSaving(false); }
  };

  const regenerate = async (key) => {
    setRegenKey(key);
    try {
      const res = await base44.functions.invoke('refineDossierSection', { projectId, section: key, guidance });
      setProject((p) => ({ ...p, [key]: res.data.text }));
      setGuidance('');
    } finally { setRegenKey(null); }
  };

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-4xl mx-auto space-y-10">
      <PageHeader
        title="Dossier Workshop"
        subtitle="Manually refine any dossier section, regenerate it with a framing directive, or tighten the psychological angle."
      />

      {projects == null ? (
        <Skeleton className="h-10 w-full" />
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-md">
          <h3 className="font-heading text-xl tracking-tight">No dossiers to refine</h3>
          <p className="text-sm text-muted-foreground mt-2">Generate a dossier first, then refine it here.</p>
        </Card>
      ) : (
        <>
          <select
            value={projectId || ''}
            onChange={(e) => { setProjectId(e.target.value); setEditKey(null); }}
            className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="">Select a dossier…</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.company_name || 'Untitled'} ({p.status})</option>)}
          </select>

          {projectId && project == null && <Skeleton className="h-64 w-full rounded-md" />}

          {project && SECTIONS.map((s) => (
            <Card key={s.key} className="p-5 rounded-md space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-heading text-lg tracking-tight">{s.label}</h3>
                <Button variant="outline" size="sm" onClick={() => { setEditKey(editKey === s.key ? null : s.key); setEditDraft(project[s.key] || ''); }}>
                  <Pencil className="size-3.5" /> {editKey === s.key ? 'Cancel' : 'Edit'}
                </Button>
              </div>

              {editKey === s.key ? (
                <div className="space-y-2">
                  <Textarea rows={8} value={editDraft} onChange={(e) => setEditDraft(e.target.value)} />
                  <Button size="sm" disabled={saving} className="bg-bottle hover:bg-bottle/90 text-bottle-foreground" onClick={() => saveEdit(s.key)}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-line">{project[s.key] || 'Not generated yet.'}</p>
              )}

              <div className="border-t border-border pt-3 space-y-2">
                <Label>Regenerate with a framing directive</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="e.g. reframe for risk-averse institutional LPs"
                    value={guidance}
                    onChange={(e) => setGuidance(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={regenKey != null}
                    onClick={() => regenerate(s.key)}
                  >
                    {regenKey === s.key ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                    Regenerate
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}