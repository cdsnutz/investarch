import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Crosshair, Globe } from 'lucide-react';

const STAGES = [
  'Researching digital footprint & market…',
  'Mapping competitors & strategic edge…',
  'Identifying aligned funding sources…',
  'Modeling financial forecasts…',
  'Synthesizing investor narrative…',
  'Running critique loop for generic filler…'
];

export default function NewAnalysis() {
  const [url, setUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [intensity, setIntensity] = useState('quick');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) { setStage(''); return; }
    let i = 0;
    setStage(STAGES[0]);
    const t = setInterval(() => { i = (i + 1) % STAGES.length; setStage(STAGES[i]); }, 2800);
    return () => clearInterval(t);
  }, [loading]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    let project = null;
    try {
      project = await base44.entities.Project.create({ url: url.trim(), company_name: companyName.trim(), status: 'analyzing' });
      const res = await base44.functions.invoke('analyzeBusiness', { url: url.trim(), companyName: companyName.trim(), intensity });
      const d = res.data;
      await base44.entities.Project.update(project.id, {
        company_name: d.company_name || companyName.trim(),
        industry: d.industry,
        value_proposition: d.value_proposition,
        executive_summary: d.executive_summary,
        market_analysis: d.market_analysis,
        strategic_edge: d.strategic_edge,
        financial_forecast: d.financial_forecast,
        investor_narrative: d.investor_narrative,
        forecast_years: d.forecast_years,
        key_milestones: d.key_milestones,
        ...(d.company_radar ? { competitive_radar: { dimensions: d.company_radar.scores.map((s) => s.dimension), company_scores: d.company_radar.scores, generated_date: new Date().toISOString() } } : {}),
        status: 'complete'
      });
      if (Array.isArray(d.competitors) && d.competitors.length) {
        await base44.entities.Competitor.bulkCreate(d.competitors.map((c) => ({ project_id: project.id, name: c.name, strengths: c.strengths, weaknesses: c.weaknesses, our_advantage: c.our_advantage, overall_score: c.overall_score, radar_scores: c.radar_scores || [] })));
      }
      if (Array.isArray(d.funding_sources) && d.funding_sources.length) {
        await base44.entities.FundingSource.bulkCreate(d.funding_sources.map((f) => ({ project_id: project.id, name: f.name, type: f.type, focus_area: f.focus_area, alignment_rationale: f.alignment_rationale, stage: f.stage, contact_info: f.contact_info })));
      }
      navigate(`/projects/${project.id}`);
    } catch (err) {
      if (project) await base44.entities.Project.update(project.id, { status: 'failed' }).catch(() => {});
      toast({ title: 'Analysis failed', description: err.message || 'Something went wrong.', variant: 'destructive' });
      setLoading(false);
    }
  }

  return (
    <div className="p-6 md:p-12 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">New Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter a company URL or describe your raw idea. The engine distills the concept, researches the market, maps competitors, identifies funding sources, models forecasts, and writes the dossier.</p>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-white p-10 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="size-14 rounded-full border-2 border-slate-200" />
            <Loader2 className="size-14 animate-spin text-emerald-500 absolute inset-0" />
          </div>
          <div className="font-medium">Building your dossier</div>
          <div className="text-sm text-muted-foreground mt-1.5 h-5 transition-all">{stage}</div>
          <p className="text-xs text-muted-foreground/70 mt-4">This runs a multi-stage research and synthesis pipeline — usually 30–60 seconds.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 md:p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="url">Company URL or business idea</Label>
            <div className="relative">
              <Globe className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input id="url" required placeholder="https://example.com or your raw idea" value={url} onChange={(e) => setUrl(e.target.value)} className="pl-9" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Company name <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="name" placeholder="Acme Corp" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Research intensity</Label>
            <div className="grid grid-cols-2 rounded-md border border-input overflow-hidden">
              {[
                { value: 'quick', label: 'Quick Scan', sub: 'Lower credit cost' },
                { value: 'deep', label: 'Deep Research', sub: 'Premium models, critique loop' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setIntensity(opt.value)}
                  className={`px-4 py-3 text-center transition ${intensity === opt.value ? 'bg-bottle text-bottle-foreground' : 'bg-white text-muted-foreground hover:bg-secondary/60'}`}
                >
                  <span className="block text-sm font-medium">{opt.label}</span>
                  <span className="block text-xs opacity-70 mt-0.5">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg">
            <Crosshair className="size-4 mr-2" /> Generate dossier
          </Button>
        </form>
      )}
    </div>
  );
}