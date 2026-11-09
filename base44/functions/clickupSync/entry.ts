import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const CONNECTOR_ID = '6af154ec9a5a3ffb25a1b756';
const API = 'https://api.clickup.com/api/v2';
const MAX_LISTS = 150;

// Narrow ClickUp client: every call rides the signed-in person's own connection.
function client(accessToken: string) {
  return async (path: string, init?: any) => {
    const response = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: accessToken,
        'Content-Type': 'application/json',
        ...(init?.headers || {})
      },
      signal: AbortSignal.timeout(12000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.err || data?.ECODE || `ClickUp ${response.status}`);
    }
    return data;
  };
}

function taskBody(mvp: any) {
  const lines = [
    mvp.headline ? `**Promise.** ${mvp.headline}` : '',
    mvp.promise || '',
    '',
    `- Category: ${mvp.category || 'not set'}`,
    `- Core loop: ${mvp.core_loop || 'not set'}`,
    `- Wedge: ${mvp.wedge || 'not set'}`,
    `- Pricing: ${mvp.pricing || 'not set'}`,
    `- Screens: ${(mvp.screens || []).length}`,
    `- Acceptance criteria: ${(mvp.acceptance_criteria || []).length}`,
    `- Parity features: ${(mvp.parity_features || []).length}`,
    `- Forge score: ${mvp.score ?? 'n/a'}/100`,
    mvp.forged_date ? `- Forged: ${String(mvp.forged_date).slice(0, 10)}` : '',
    mvp.seed_id ? `- Seed id: ${mvp.seed_id}` : '',
    '',
    'Build status tracked from InvestArch. Deployment milestones live on this task.'
  ];
  return lines.filter((line) => line !== '').join('\n');
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error: any) => (error?.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'status');

    const savedTasks = async () => {
      const { items } = await base44.entities.ClickupTask.list({ sort: '-pushed_date', limit: 40 });
      return items || [];
    };

    let accessToken = null;
    if (action !== 'save') {
      try {
        const connection = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
        accessToken = connection?.accessToken || null;
      } catch (error: any) {
        accessToken = null;
      }
    }

    if (action === 'status') {
      const listId = user?.clickup_list_id || null;
      if (!accessToken) {
        return Response.json({ connected: false, list: listId ? { id: listId, name: user?.clickup_list_name || listId } : null, tasks: await savedTasks() });
      }
      const api = client(accessToken);
      let account = null;
      try {
        const me = await api('/user');
        account = me?.user?.username || me?.user?.email || null;
      } catch (error: any) {
        console.error('[clickupSync] connection rejected', error?.message);
        return Response.json({ connected: false, list: null, tasks: await savedTasks() });
      }
      return Response.json({
        connected: true,
        account,
        list: listId ? { id: listId, name: user?.clickup_list_name || listId } : null,
        tasks: await savedTasks()
      });
    }

    if (!accessToken) return Response.json({ error: 'ClickUp is not connected' }, { status: 400 });
    const api = client(accessToken);

    if (action === 'lists') {
      const teams = await api('/team');
      const lists: any[] = [];
      for (const team of (teams?.teams || []).slice(0, 2)) {
        const spaces = await api(`/team/${team.id}/space?archived=false`);
        const spaceBatch = (spaces?.spaces || []).slice(0, 8);
        const results = await Promise.allSettled(spaceBatch.map(async (space: any) => {
          const found: any[] = [];
          const [loose, folders] = await Promise.all([
            api(`/space/${space.id}/list?archived=false`).catch(() => ({ lists: [] })),
            api(`/space/${space.id}/folder?archived=false`).catch(() => ({ folders: [] }))
          ]);
          (loose?.lists || []).forEach((list: any) => found.push({ id: list.id, name: `${space.name} / ${list.name}` }));
          const folderBatch = (folders?.folders || []).slice(0, 6);
          const inner = await Promise.allSettled(folderBatch.map(async (folder: any) => {
            const rows = await api(`/folder/${folder.id}/list?archived=false`).catch(() => ({ lists: [] }));
            return (rows?.lists || []).map((list: any) => ({ id: list.id, name: `${space.name} / ${folder.name} / ${list.name}` }));
          }));
          inner.forEach((result) => { if (result.status === 'fulfilled') found.push(...result.value); });
          return found;
        }));
        results.forEach((result) => { if (result.status === 'fulfilled') lists.push(...result.value); });
        if (lists.length >= MAX_LISTS) break;
      }
      const unique = Array.from(new Map(lists.map((list) => [list.id, list])).values()).slice(0, MAX_LISTS);
      unique.sort((a, b) => a.name.localeCompare(b.name));
      return Response.json({ lists: unique });
    }

    if (action === 'save') {
      const listId = String(body?.list_id || '').trim();
      const listName = String(body?.list_name || '').trim().slice(0, 160);
      if (!listId) return Response.json({ error: 'list_id is required' }, { status: 400 });
      await base44.auth.updateMe({ clickup_list_id: listId, clickup_list_name: listName || listId });
      return Response.json({ list: { id: listId, name: listName || listId } });
    }

    if (action === 'push') {
      const listId = user?.clickup_list_id;
      if (!listId) return Response.json({ error: 'Choose a ClickUp list first' }, { status: 400 });

      const ids = (Array.isArray(body?.mvp_ids) ? body.mvp_ids : [])
        .map((id: any) => String(id || '').trim())
        .filter(Boolean)
        .slice(0, 12);
      if (!ids.length) return Response.json({ error: 'mvp_ids is required' }, { status: 400 });

      const { items } = await base44.entities.MvpForge.filter({ id: { $in: ids } }, { limit: 12 });
      if (!items?.length) return Response.json({ error: 'No forged MVPs found' }, { status: 404 });

      const existing = await base44.entities.ClickupTask.filter(
        { mvp_id: { $in: items.map((mvp: any) => mvp.id) } },
        { limit: 20 }
      );
      const byMvp = new Map<string, any>((existing?.items || []).map((row: any) => [row.mvp_id, row]));

      const pushed: any[] = [];
      const failed: any[] = [];

      const write = async (mvp: any) => {
        const name = `MVP build · ${String(mvp.seed_title || 'Untitled seed').slice(0, 120)}`;
        const description = taskBody(mvp);
        const prior = byMvp.get(mvp.id);
        try {
          const task = prior?.task_id
            ? await api(`/task/${prior.task_id}`, { method: 'PUT', body: JSON.stringify({ name, description }) })
            : await api(`/list/${listId}/task`, { method: 'POST', body: JSON.stringify({ name, description }) });
          const payload = {
            mvp_id: mvp.id,
            seed_id: mvp.seed_id || '',
            seed_title: mvp.seed_title || '',
            task_id: String(task?.id || ''),
            task_name: name,
            list_id: String(listId),
            task_url: task?.url || '',
            status: task?.status?.status || 'pushed',
            pushed_date: new Date().toISOString()
          };
          if (prior?.id) {
            await base44.entities.ClickupTask.update(prior.id, payload);
          } else {
            await base44.entities.ClickupTask.create(payload);
          }
          pushed.push({ name, task_id: payload.task_id, url: payload.task_url, action: prior?.task_id ? 'updated' : 'created' });
        } catch (error: any) {
          console.error('[clickupSync] task failed', name, error?.message);
          failed.push({ name, reason: error?.message || 'ClickUp rejected the task' });
        }
      };

      for (let index = 0; index < items.length; index += 4) {
        await Promise.allSettled(items.slice(index, index + 4).map(write));
      }

      console.log(`[clickupSync] pushed ${pushed.length} · failed ${failed.length} · list ${listId}`);
      return Response.json({ pushed, failed, tasks: await savedTasks() });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[clickupSync] failed', error?.message);
    return Response.json({ error: error?.message || 'ClickUp sync failed' }, { status: 500 });
  }
}