import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUARTERS = [
  { label: 'Q1', months: [1, 2, 3] },
  { label: 'Q2', months: [4, 5, 6] },
  { label: 'Q3', months: [7, 8, 9] },
  { label: 'Q4', months: [10, 11, 12] }
];
const CYCLE = { planned: 'in_progress', in_progress: 'done', done: 'planned' };

export default function ExecutionTimeline() {
  const [projects, setProjects] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newMonth, setNewMonth] = useState('1');

  useEffect(() => {
    base44.entities.Project.filter({}, { sort: '-created_date', limit: 50, fields: ['company_name', 'status', 'created_date'] })
      .then((p) => setProjects(p.items)).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setProject(null);
    setMilestones(null);
    base44.entities.Project.get(projectId).then(setProject).catch(() => setProject(null));
    base44.entities.TimelineMilestone.filter({ project_id: projectId }, { sort: 'month' })
      .then((p) => setMilestones(p.items)).catch(() => setMilestones([]));
  }, [projectId]);

  const generate = async () => {
    const ms = project.key_milestones || [];
    if (ms.length === 0) return;
    const records = ms.map((title, i) => ({
      project_id: projectId,
      title,
      month: 1 + Math.round((i * 11) / Math.max(ms.length - 1, 1)),
      status: 'planned'
    }));
    const created = await base44.entities.TimelineMilestone.bulkCreate(records);
    setMilestones(created);
  };

  const addMilestone = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const rec = await base44.entities.TimelineMilestone.create({
      project_id: projectId, title: newTitle.trim(), month: Number(newMonth) || 1, status: 'planned'
    });
    setMilestones((m) => [...(m || []), rec].sort((a, b) => a.month - b.month));
    setNewTitle('');
  };

  const cycleStatus = async (m) => {
    const status = CYCLE[m.status || 'planned'];
    setMilestones((all) => all.map((x) => (x.id === m.id ? { ...x, status } : x)));
    await base44.entities.TimelineMilestone.update(m.id, { status });
  };
  const removeMilestone = async (id) => {
    setMilestones((all) => all.filter((x) => x.id !== id));
    await base44.entities.TimelineMilestone.delete(id);
  };

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <PageHeader
        title="Execution Timeline"
        subtitle="Convert generated dossiers into actionable 12-month execution timelines and milestone trackers for stakeholder review."
      />

      {projects == null ? (
        <Skeleton className="h-10 w-full" />
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-md">
          <h3 className="font-heading text-xl tracking-tight">No dossiers yet</h3>
          <p className="text-sm text-muted-foreground mt-2">Generate a dossier to build an execution timeline from it.</p>
        </Card>
      ) : (
        <>
          <select
            value={projectId || ''}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="">Select a dossier…</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.company_name || 'Untitled'} ({p.status})</option>)}
          </select>

          {projectId && project == null && <Skeleton className="h-64 rounded-md" />}

          {project && (
            <>
              {milestones != null && milestones.length === 0 && (
                <Card className="p-8 text-center rounded-md space-y-3">
                  <CalendarClock className="size-6 mx-auto text-muted-foreground" />
                  {(project.key_milestones || []).length > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground">{project.key_milestones.length} milestones found in the dossier. Spread them across a 12-month timeline?</p>
                      <Button size="sm" className="bg-bottle hover:bg-bottle/90 text-bottle-foreground" onClick={generate}>Build 12-month timeline</Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">This dossier has no key milestones. Add them manually below.</p>
                  )}
                </Card>
              )}

              {milestones == null ? (
                <Skeleton className="h-48 rounded-md" />
              ) : milestones.length > 0 && (
                <div className="grid md:grid-cols-4 gap-4">
                  {QUARTERS.map((q) => (
                    <Card key={q.label} className="p-4 rounded-md space-y-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{q.label} · months {q.months[0]}–{q.months[2]}</div>
                      {q.months.map((m) => {
                        const ms = milestones.filter((x) => x.month === m);
                        if (ms.length === 0) return null;
                        return (
                          <div key={m} className="space-y-2">
                            <div className="text-xs font-medium text-bottle">Month {m}</div>
                            {ms.map((x) => (
                              <div key={x.id} className="rounded border border-border bg-white p-2.5 space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-xs font-medium">{x.title}</span>
                                  <button onClick={() => removeMilestone(x.id)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="size-3" /></button>
                                </div>
                                <button onClick={() => cycleStatus(x)} className="text-left">
                                  <Badge variant="outline" className={cn('text-[10px]', x.status === 'done' ? 'bg-bottle text-bottle-foreground border-transparent' : x.status === 'in_progress' ? 'bg-bottle/10 text-bottle border-transparent' : '')}>
                                    {x.status}
                                  </Badge>
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </Card>
                  ))}
                </div>
              )}

              <form onSubmit={addMilestone} className="flex flex-col sm:flex-row gap-2 items-end">
                <div className="flex-1 w-full"><Label>Add milestone</Label><Input className="mt-1" placeholder="Milestone title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} /></div>
                <div className="w-24"><Label>Month</Label>
                  <select value={newMonth} onChange={(e) => setNewMonth(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-white px-2 text-sm">
                    {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                </div>
                <Button type="submit" size="sm" variant="outline"><Plus className="size-4" /> Add</Button>
              </form>
            </>
          )}
        </>
      )}
    </div>
  );
}