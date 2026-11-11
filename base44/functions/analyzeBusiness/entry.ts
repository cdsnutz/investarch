import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { runDossierAnalysis } from '../../shared/dossierAnalysis.ts';

// The New Analysis form's endpoint. The build itself lives in shared/dossierAnalysis.ts so the
// HubSpot automation produces the identical dossier.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const input = (body?.url || '').trim();
    if (!input) return Response.json({ error: 'A company URL or business idea is required.' }, { status: 400 });

    const dossier = await runDossierAnalysis(base44, {
      input,
      companyName: (body?.companyName || '').trim(),
      intensity: body?.intensity === 'quick' ? 'quick' : 'deep'
    });

    return Response.json(dossier);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}