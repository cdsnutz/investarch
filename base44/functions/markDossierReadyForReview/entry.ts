import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Moves a finished dossier (status "complete") into the review queue. Called by the
// "Dossier Ready For Review" workflow the moment a build completes.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { project_id } = await req.json().catch(() => ({}));
    if (!project_id) return Response.json({ error: 'project_id is required' }, { status: 400 });

    const project = await base44.asServiceRole.entities.Project.get(project_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!project) return Response.json({ error: 'Not found' }, { status: 404 });
    if (project.status !== 'complete') {
      return Response.json({ ok: false, skipped: true, status: project.status });
    }

    await base44.asServiceRole.entities.Project.update(project_id, { status: 'ready_for_review' });
    await base44.asServiceRole.entities.ActivityEvent.create({
      action: 'status_ready_for_review',
      detail: project.company_name || project.url || '',
      timestamp: new Date().toISOString()
    });

    return Response.json({ ok: true, project_id, status: 'ready_for_review' });
  } catch (error) {
    console.error('markDossierReadyForReview failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}