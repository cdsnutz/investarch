// The automation's worker: a company that just landed in InvestArch from HubSpot gets a full
// research dossier built for it, on the same engine the New Analysis form uses.
//
// Called only by the "HubSpot Company Dossier" workflow. A company is read once — an existing
// dossier for the same website is left alone, so a re-sync never bills a second build.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { clean } from '../../shared/serp.ts';
import { runDossierAnalysis, saveDossier } from '../../shared/dossierAnalysis.ts';

const bareDomain = (value: unknown) =>
  clean(value).replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/^www\./i, '');

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error: any) => (error?.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const companyId = clean(body?.company_id);
    const intensity = clean(body?.intensity) === 'deep' ? 'deep' : 'quick';
    if (!companyId) return Response.json({ error: 'company_id is required' }, { status: 400 });

    const company = await base44.asServiceRole.entities.HubspotCompany
      .get(companyId)
      .catch((error: any) => (error?.status === 404 ? null : Promise.reject(error)));
    if (!company) return Response.json({ error: 'Not found' }, { status: 404 });

    const name = clean(company.company_name) || clean(company.company);
    const domain = bareDomain(company.domain);
    if (!domain) {
      console.log(`[buildCompanyDossier] no website on ${name || companyId} — skipped`);
      return Response.json({ skipped: true, reason: 'The HubSpot record has no website, and a dossier needs a site to read.', company: name });
    }

    const url = `https://${domain}`;
    const { items: onFile } = await base44.asServiceRole.entities.Project.filter({ url }, { limit: 1 });
    const prior = onFile?.[0];
    if (prior?.id) {
      if (!prior.dossier_origin) await base44.asServiceRole.entities.Project.update(prior.id, { dossier_origin: 'hubspot' }).catch(() => {});
      return Response.json({ skipped: true, reason: 'A dossier already exists for this website.', project_id: prior.id, status: prior.status, company: name, url });
    }

    const project = await base44.asServiceRole.entities.Project.create({
      url,
      company_name: name,
      status: 'analyzing',
      dossier_origin: 'hubspot'
    });

    try {
      const dossier = await runDossierAnalysis(base44, { input: url, companyName: name, intensity });
      await saveDossier(base44, project.id, dossier, name);

      await base44.asServiceRole.entities.HubspotCompany.update(companyId, { dossier_project_id: project.id }).catch((error: any) => {
        console.log('[buildCompanyDossier] could not link dossier to company', error?.message);
      });
      await base44.asServiceRole.entities.ActivityEvent.create({
        action: 'hubspot_dossier_built',
        detail: `${dossier?.company_name || name} · dossier opened from HubSpot`,
        timestamp: new Date().toISOString()
      }).catch(() => {});

      console.log(`[buildCompanyDossier] built ${project.id} for ${dossier?.company_name || name}`);
      return Response.json({
        ok: true,
        project_id: project.id,
        company: dossier?.company_name || name,
        url,
        competitors: (dossier?.competitors || []).length,
        funding_sources: (dossier?.funding_sources || []).length
      });
    } catch (error: any) {
      await base44.asServiceRole.entities.Project.update(project.id, { status: 'failed' }).catch(() => {});
      throw error;
    }
  } catch (error: any) {
    console.error('[buildCompanyDossier] failed', error?.message);
    return Response.json({ error: error?.message || 'The dossier build failed' }, { status: 500 });
  }
}