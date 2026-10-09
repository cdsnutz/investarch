import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer, ExternalLink, Loader2, Target, TrendingUp, Building2 } from 'lucide-react';
import CompetitorTable from '@/components/dossier/CompetitorTable';
import FundingTable from '@/components/dossier/FundingTable';
import ForecastTable from '@/components/dossier/ForecastTable';

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{children}</div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [funding, setFunding] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const p = await base44.entities.Project.get(id);
        if (!active) return;
        setProject(p);
        const [comp, fund] = await Promise.all([
          base44.entities.Competitor.filter({ project_id: id }, { limit: 50 }),
          base44.entities.FundingSource.filter({ project_id: id }, { limit: 50 })
        ]);
        if (!active) return;
        setCompetitors(comp.items || []);
        setFunding(fund.items || []);
      } catch { /* ignore */ }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 md:p-12 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="h-72 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }
  if (!project) {
    return <div className="p-12 text-center text-muted-foreground">Dossier not found. <Link to="/" className="underline text-slate-900">Back to dossiers</Link></div>;
  }
  if (project.status === 'analyzing') {
    return <div className="p-12 flex flex-col items-center gap-3 text-muted-foreground"><Loader2 className="size-6 animate-spin" />Analysis in progress…</div>;
  }

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto print:max-w-none print:p-0">
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/"><ArrowLeft className="size-4 mr-1.5" /> Dossiers</Link>
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="size-4 mr-1.5" /> Print
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">{project.company_name || 'Untitled analysis'}</h1>
        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
          {project.industry && <Badge variant="secondary" className="bg-slate-100">{project.industry}</Badge>}
          {project.url && (
            <a href={project.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-slate-900">
              <ExternalLink className="size-3.5" /> {project.url}
            </a>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="print:hidden">
        <TabsList className="w-full justify-start overflow-x-auto mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="competitive">Competitive</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="funding">Funding</TabsTrigger>
          <TabsTrigger value="narrative">Narrative</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <Section title="Executive Command">{project.executive_summary}</Section>
          {project.value_proposition && <Section title="Value Proposition">{project.value_proposition}</Section>}
          {project.strategic_edge && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
              <div className="flex items-center gap-2 mb-2"><Target className="size-4 text-emerald-600" /><h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Strategic Edge</h3></div>
              <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{project.strategic_edge}</div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          <Section title="Market Analysis">{project.market_analysis}</Section>
        </TabsContent>

        <TabsContent value="competitive" className="space-y-6">
          <div className="flex items-center gap-2 mb-1"><Building2 className="size-4 text-muted-foreground" /><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Competitive Landscape</h3></div>
          <CompetitorTable competitors={competitors} />
        </TabsContent>

        <TabsContent value="financials" className="space-y-6">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="size-4 text-muted-foreground" /><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Financial Blueprint</h3></div>
          <ForecastTable years={project.forecast_years} />
          <Section title="Forecast Rationale">{project.financial_forecast}</Section>
          {project.key_milestones?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Key Milestones</h3>
              <ul className="space-y-2">
                {project.key_milestones.map((m, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                    <span className="size-1.5 rounded-full bg-emerald-500 mt-2.5 shrink-0" />{m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="funding" className="space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Aligned Funding Sources</h3>
          <FundingTable sources={funding} />
        </TabsContent>

        <TabsContent value="narrative" className="space-y-6">
          <Section title="Investor Narrative">{project.investor_narrative}</Section>
        </TabsContent>
      </Tabs>

      {/* Print-only: all sections stacked */}
      <div className="hidden print:block space-y-6">
        <h2>Executive Summary</h2><p>{project.executive_summary}</p>
        <h2>Market Analysis</h2><p>{project.market_analysis}</p>
        <h2>Strategic Edge</h2><p>{project.strategic_edge}</p>
        <h2>Financial Forecast</h2><p>{project.financial_forecast}</p>
        <h2>Investor Narrative</h2><p>{project.investor_narrative}</p>
      </div>
    </div>
  );
}