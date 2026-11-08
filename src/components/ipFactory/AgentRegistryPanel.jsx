import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Bot, Plus, Rocket, Pause, Copy } from 'lucide-react';
import { buildAgentDeployGuide } from '@/lib/agentDeploy';

const EMPTY = { agentName: '', kind: 'external_agent', parentAgent: '', seedId: 'none', deployTarget: 'ip_factory', notes: '' };

const statusTone = {
  registered: 'bg-slate-100 text-slate-700',
  deployed: 'bg-emerald-50 text-emerald-700',
  paused: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-700'
};

export default function AgentRegistryPanel({ onChanged }) {
  const [agents, setAgents] = useState(null);
  const [seeds, setSeeds] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [instructions, setInstructions] = useState(null);

  const load = useCallback(async () => {
    const [agentPage, seedPage] = await Promise.all([
      base44.entities.AgentDeployment.filter({}, { sort: '-created_date', limit: 100 }),
      base44.entities.IpSeed.filter({}, { sort: '-created_date', limit: 200, fields: ['title', 'repo_name'] })
    ]);
    setAgents(agentPage.items || []);
    setSeeds(seedPage.items || []);
  }, []);

  useEffect(() => { load().catch(() => setAgents([])); }, [load]);

  const register = async () => {
    setBusy('register');
    setError('');
    try {
      const res = await base44.functions.invoke('agentOps', {
        action: 'register',
        ...form,
        seedId: form.seedId === 'none' ? '' : form.seedId
      });
      setInstructions(res.data?.deploy_instructions || null);
      setOpen(false);
      setForm(EMPTY);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Could not register the agent.');
    } finally {
      setBusy('');
    }
  };

  const act = async (agent, action) => {
    setBusy(`${action}-${agent.id}`);
    setError('');
    try {
      const res = await base44.functions.invoke('agentOps', { action, agentId: agent.id });
      if (res.data?.deploy_instructions) setInstructions(res.data.deploy_instructions);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'That action failed.');
    } finally {
      setBusy('');
    }
  };

  const copyOrders = async (agent) => {
    await navigator.clipboard.writeText(buildAgentDeployGuide({
      agentName: agent.agent_name,
      seedTitle: agent.seed_title,
      repoName: agent.repo_name,
      parentAgent: agent.parent_agent
    }));
  };

  const list = agents || [];
  const deployed = list.filter((a) => a.status === 'deployed').length;
  const rated = list.filter((a) => (a.runs || 0) > 0);
  const fleetRate = rated.length
    ? Math.round(rated.reduce((sum, a) => sum + (a.success_rate || 0), 0) / rated.length)
    : null;

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-6 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-heading flex items-center gap-2"><Bot className="size-4 text-bottle" /> Agent registry</h2>
          <p className="text-xs text-muted-foreground mt-1">Coding agents and in-app agents in one ledger, with the runs each one reports.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="w-full sm:w-auto">
          <Plus className="size-3.5 mr-1.5" /> Register agent
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="rounded-lg border px-2 py-2">
          <div className="text-base font-semibold tabular-nums">{list.length}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Tracked</div>
        </div>
        <div className="rounded-lg border px-2 py-2">
          <div className="text-base font-semibold tabular-nums text-emerald-600">{deployed}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Deployed</div>
        </div>
        <div className="rounded-lg border px-2 py-2">
          <div className="text-base font-semibold tabular-nums">{fleetRate === null ? '—' : `${fleetRate}%`}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Reported success</div>
        </div>
      </div>

      {error && <p className="text-xs text-destructive mb-3">{error}</p>}

      {agents === null ? (
        <p className="text-sm text-muted-foreground py-4">Loading the registry…</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No agents registered yet. Register one, or let an agent register itself through the deploy orders.</p>
      ) : (
        <div className="space-y-3">
          {list.map((agent) => (
            <div key={agent.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-sm break-words">{agent.agent_name}</span>
                <Badge variant="secondary" className={`text-[10px] ${statusTone[agent.status] || 'bg-slate-100'}`}>{agent.status}</Badge>
                <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">
                  {agent.kind === 'in_app_agent' ? 'in-app' : 'external'}
                </Badge>
                {agent.parent_agent && <span className="text-[11px] text-muted-foreground">under {agent.parent_agent}</span>}
              </div>
              {agent.seed_title && <p className="text-xs text-muted-foreground mt-1 break-words">Asset: {agent.seed_title}</p>}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                <span>{agent.runs || 0} runs</span>
                <span className="text-emerald-600">{agent.successes || 0} passed</span>
                <span className="text-red-600">{agent.failures || 0} failed</span>
                <span>{(agent.runs || 0) > 0 ? `${agent.success_rate || 0}% success` : 'no runs reported'}</span>
                {agent.last_run && <span>last {new Date(agent.last_run).toLocaleDateString()}</span>}
              </div>
              {agent.last_note && <p className="text-[11px] text-muted-foreground mt-1 break-words">{agent.last_note}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => act(agent, 'deploy')} disabled={!!busy}>
                  {busy === `deploy-${agent.id}` ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Rocket className="size-3.5 mr-1.5" />} Deploy
                </Button>
                <Button size="sm" variant="outline" onClick={() => act(agent, 'pause')} disabled={!!busy || agent.status === 'paused'}>
                  {busy === `pause-${agent.id}` ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Pause className="size-3.5 mr-1.5" />} Pause
                </Button>
                <Button size="sm" variant="ghost" onClick={() => copyOrders(agent)}>
                  <Copy className="size-3.5 mr-1.5" /> Copy deploy orders
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register an agent</DialogTitle>
            <DialogDescription>Track who is building which asset, and who deployed whom.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="agent-name">Agent name</Label>
              <Input id="agent-name" value={form.agentName} onChange={(e) => setForm({ ...form, agentName: e.target.value })} placeholder="schema-migrator" />
            </div>
            <div className="space-y-1.5">
              <Label>Kind</Label>
              <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="external_agent">External coding agent</SelectItem>
                  <SelectItem value="in_app_agent">Base44 in-app agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="parent-agent">Deployed by (parent agent)</Label>
              <Input id="parent-agent" value={form.parentAgent} onChange={(e) => setForm({ ...form, parentAgent: e.target.value })} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label>Asset</Label>
              <Select value={form.seedId} onValueChange={(v) => setForm({ ...form, seedId: v })}>
                <SelectTrigger><SelectValue placeholder="No asset" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No asset</SelectItem>
                  {seeds.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Deploy target</Label>
              <Select value={form.deployTarget} onValueChange={(v) => setForm({ ...form, deployTarget: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ip_factory">IP Factory</SelectItem>
                  <SelectItem value="external">External host</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={register} disabled={busy === 'register' || !form.agentName.trim()} className="w-full">
              {busy === 'register' ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Plus className="size-4 mr-2" />}
              Register and issue deploy orders
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!instructions} onOpenChange={(v) => !v && setInstructions(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deploy orders</DialogTitle>
            <DialogDescription>Hand this to the agent as-is.</DialogDescription>
          </DialogHeader>
          <pre className="text-xs whitespace-pre-wrap break-words rounded-lg border bg-muted/40 p-3">{instructions}</pre>
          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(instructions || '')}>
            <Copy className="size-3.5 mr-1.5" /> Copy
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}