import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Link2, ListChecks, Send, Unplug } from 'lucide-react';
import ClickupTaskList from '@/components/clickup/ClickupTaskList';

const CONNECTOR_ID = '6af154ec9a5a3ffb25a1b756';

export default function ClickupSyncPanel({ onPushed }) {
  const [signedIn, setSignedIn] = useState(null);
  const [sync, setSync] = useState({ connected: false, account: null, list: null, tasks: [] });
  const [lists, setLists] = useState([]);
  const [choice, setChoice] = useState('');
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('clickupSync', { action: 'status' });
      setSync({
        connected: Boolean(res.data?.connected),
        account: res.data?.account || null,
        list: res.data?.list || null,
        tasks: res.data?.tasks || []
      });
    } catch {
      setSync({ connected: false, account: null, list: null, tasks: [] });
    }
  }, []);

  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      setSignedIn(authed);
      if (authed) load();
    });
  }, [load]);

  const connect = async () => {
    setError('');
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, '_blank');
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          load();
        }
      }, 600);
    } catch (problem) {
      setError(problem?.message || 'ClickUp could not be opened.');
    }
  };

  const disconnect = async () => {
    setBusy('disconnect');
    setError('');
    try {
      await base44.connectors.disconnectAppUser(CONNECTOR_ID);
      setLists([]);
      await load();
    } catch (problem) {
      setError(problem?.message || 'ClickUp could not be disconnected.');
    } finally {
      setBusy('');
    }
  };

  const loadLists = async () => {
    setBusy('lists');
    setError('');
    try {
      const res = await base44.functions.invoke('clickupSync', { action: 'lists' });
      const rows = res.data?.lists || [];
      setLists(rows);
      if (!rows.length) setError('No lists were returned for this ClickUp account.');
    } catch (problem) {
      setError(problem?.response?.data?.error || problem?.message || 'Your ClickUp lists could not be read.');
    } finally {
      setBusy('');
    }
  };

  const saveList = async () => {
    const picked = lists.find((list) => list.id === choice);
    if (!picked) return;
    setBusy('save');
    setError('');
    try {
      await base44.functions.invoke('clickupSync', { action: 'save', list_id: picked.id, list_name: picked.name });
      setLists([]);
      setChoice('');
      await load();
      setNote(`Build tasks will be written to ${picked.name}.`);
    } catch (problem) {
      setError(problem?.response?.data?.error || problem?.message || 'That list could not be saved.');
    } finally {
      setBusy('');
    }
  };

  const push = async () => {
    setBusy('push');
    setError('');
    setNote('Reading your forged MVPs…');
    try {
      const { items } = await base44.entities.MvpForge.list({ sort: '-forged_date', limit: 12 });
      if (!items?.length) {
        setNote('No forged MVPs yet. Generate one, then push its build status.');
        return;
      }
      setNote(`Writing ${items.length} MVP task${items.length === 1 ? '' : 's'} to ClickUp…`);
      const res = await base44.functions.invoke('clickupSync', {
        action: 'push',
        mvp_ids: items.map((mvp) => mvp.id)
      });
      const pushed = res.data?.pushed || [];
      const failed = res.data?.failed || [];
      setSync((prev) => ({ ...prev, tasks: res.data?.tasks || prev.tasks }));
      setNote(
        `${pushed.length} of ${items.length} task${items.length === 1 ? '' : 's'} in ClickUp` +
          (failed.length ? ` · ${failed.length} rejected: ${failed.slice(0, 2).map((row) => row.reason).join(', ')}` : '')
      );
      onPushed?.();
    } catch (problem) {
      setNote('');
      setError(problem?.response?.data?.error || problem?.message || 'The push to ClickUp failed.');
    } finally {
      setBusy('');
    }
  };

  if (signedIn === false) {
    return (
      <section className="rounded-xl border bg-card p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-heading flex items-center gap-2">
          <ListChecks className="size-4 text-bottle" /> ClickUp build tracking
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Sign in to connect your own ClickUp account.</p>
        <Button className="mt-3" onClick={() => base44.auth.redirectToLogin()}>Sign in</Button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-6 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-heading flex items-center gap-2">
            <ListChecks className="size-4 text-bottle" /> ClickUp build tracking
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Each generated MVP becomes one task in the ClickUp list you choose, carrying its promise, wedge, screen
            count, acceptance criteria and forge score, so deployment milestones sit in your existing workflow.
          </p>
          <p className="text-[11px] mt-2">
            {sync.connected ? (
              <span className="text-emerald-700">
                Connected{sync.account ? ` as ${sync.account}` : ''} · {sync.list ? `writing to ${sync.list.name}` : 'no list chosen yet'}
              </span>
            ) : (
              <span className="text-muted-foreground">Not connected yet. ClickUp is read and written with your own account.</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {sync.connected ? (
            <>
              <Button variant="outline" onClick={disconnect} disabled={busy === 'disconnect'}>
                {busy === 'disconnect' ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Unplug className="size-4 mr-2" />}
                Disconnect
              </Button>
              <Button onClick={push} disabled={!sync.list || busy === 'push'}>
                {busy === 'push' ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
                Push build status
              </Button>
            </>
          ) : (
            <Button onClick={connect} disabled={signedIn === null}>
              <Link2 className="size-4 mr-2" /> Connect ClickUp
            </Button>
          )}
        </div>
      </div>

      {sync.connected && !sync.list && (
        <div className="mt-4 rounded-lg border bg-muted/30 p-3 space-y-2">
          {lists.length === 0 ? (
            <Button variant="outline" size="sm" onClick={loadLists} disabled={busy === 'lists'}>
              {busy === 'lists' ? <Loader2 className="size-4 mr-2 animate-spin" /> : <ListChecks className="size-4 mr-2" />}
              Load my ClickUp lists
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Select value={choice} onValueChange={setChoice}>
                <SelectTrigger className="w-full sm:w-80 bg-card">
                  <SelectValue placeholder="Choose the list for build tasks" />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={saveList} disabled={!choice || busy === 'save'}>
                {busy === 'save' && <Loader2 className="size-4 mr-2 animate-spin" />}
                Use this list
              </Button>
            </div>
          )}
        </div>
      )}

      {note && <p className="text-xs mt-3 text-muted-foreground">{note}</p>}
      {error && <p className="text-xs mt-3 text-destructive">{error}</p>}
      <ClickupTaskList tasks={sync.tasks} />
    </section>
  );
}