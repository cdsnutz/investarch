import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { scrubDeep } from '@/lib/noSlop';
import { logActivity } from '@/lib/activity';

export const STAGES = ['intake', 'research', 'synthesis', 'render'];
// Full builds continue past render into the value engine: plan points, value scan, funding letters, competitive radar.
export const FULL_STAGES = [...STAGES, 'enrich'];
const idle = (list = STAGES) => Object.fromEntries(list.map((s) => [s, { state: 'pending', error: null }]));

// Runs the dossier pipeline stage by stage; a failed stage can be retried without redoing earlier ones.
export default function useDossierBuild() {
  const [stages, setStages] = useState(idle);
  const [stageList, setStageList] = useState(STAGES);
  const [running, setRunning] = useState(false);
  const ctx = useRef({});

  const set = (s, state, error = null) => setStages((p) => ({ ...p, [s]: { state, error } }));

  const steps = {
    intake: async () => {
      const c = ctx.current;
      if (c.project) {
        await base44.entities.Project.update(c.project.id, { status: 'analyzing' });
      } else {
        c.project = await base44.entities.Project.create({ url: c.input.url, company_name: c.input.companyName, status: 'analyzing' });
      }
    },
    research: async () => {
      const c = ctx.current;
      const res = await base44.functions.invoke('analyzeBusiness', { url: c.project.url, companyName: c.project.company_name || '', intensity: c.input.intensity });
      c.raw = res.data;
    },
    synthesis: async () => {
      const c = ctx.current;
      const d = scrubDeep(c.raw);
      const id = c.project.id;
      await base44.entities.Project.update(id, {
        company_name: d.company_name || c.project.company_name,
        industry: d.industry,
        value_proposition: d.value_proposition,
        executive_summary: d.executive_summary,
        market_analysis: d.market_analysis,
        strategic_edge: d.strategic_edge,
        financial_forecast: d.financial_forecast,
        investor_narrative: d.investor_narrative,
        forecast_years: d.forecast_years,
        key_milestones: d.key_milestones,
        ...(d.company_radar ? { competitive_radar: { dimensions: d.company_radar.scores.map((s) => s.dimension), company_scores: d.company_radar.scores, generated_date: new Date().toISOString() } } : {})
      });
      if (c.rebuild) {
        await base44.entities.Competitor.deleteMany({ project_id: id });
        await base44.entities.FundingSource.deleteMany({ project_id: id });
      }
      if (Array.isArray(d.competitors) && d.competitors.length) {
        await base44.entities.Competitor.bulkCreate(d.competitors.map((x) => ({ project_id: id, name: x.name, strengths: x.strengths, weaknesses: x.weaknesses, our_advantage: x.our_advantage, overall_score: x.overall_score, radar_scores: x.radar_scores || [] })));
      }
      if (Array.isArray(d.funding_sources) && d.funding_sources.length) {
        await base44.entities.FundingSource.bulkCreate(d.funding_sources.map((f) => ({ project_id: id, name: f.name, type: f.type, focus_area: f.focus_area, alignment_rationale: f.alignment_rationale, stage: f.stage, contact_info: f.contact_info })));
      }
    },
    render: async () => {
      await base44.entities.Project.update(ctx.current.project.id, { status: 'complete' });
    },
    enrich: async () => {
      const { id } = ctx.current.project;
      await base44.functions.invoke('buildPlanPoints', { projectId: id });
      await base44.functions.invoke('runValueScan', { projectId: id });
      await base44.functions.invoke('draftFundingLetters', { projectId: id });
      await base44.functions.invoke('scoreCompetition', { projectId: id });
    }
  };

  async function runFrom(start) {
    const list = ctx.current.list;
    setRunning(true);
    for (const s of list.slice(list.indexOf(start))) {
      set(s, 'running');
      try {
        await steps[s]();
        set(s, 'done');
      } catch (err) {
        set(s, 'failed', err?.response?.data?.error || err.message || 'Stage failed');
        // An enrichment failure must not flag an already-complete dossier as failed.
        if (ctx.current.project && s !== 'enrich') await base44.entities.Project.update(ctx.current.project.id, { status: 'failed' }).catch(() => {});
        logActivity('build_failed', `${s}: ${ctx.current.project?.company_name || ctx.current.project?.url || ''}`);
        setRunning(false);
        return null;
      }
    }
    logActivity('build_complete', ctx.current.project.company_name || ctx.current.project.url);
    setRunning(false);
    return ctx.current.project;
  }

  function start({ project, url, companyName = '', intensity = 'quick', full = false }) {
    const list = full ? FULL_STAGES : STAGES;
    ctx.current = { project: project || null, rebuild: !!project, list, input: { url, companyName, intensity } };
    setStageList(list);
    setStages(idle(list));
    logActivity('build_started', project?.company_name || url);
    return runFrom('intake');
  }

  const retry = (s) => { logActivity('build_retry', s); return runFrom(s); };

  return { stages, stageList, running, start, retry };
}