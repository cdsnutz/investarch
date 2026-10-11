import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Crosshair, ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import moment from 'moment';
import StatStrip from '@/components/dashboard/StatStrip';
import SignalFeed from '@/components/dashboard/SignalFeed';
import SeedFeed from '@/components/dashboard/SeedFeed';

export default function Dashboard() {
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    base44.entities.Project.filter({}, { sort: '-created_date', limit: 50, fields: ['company_name', 'industry', 'status', 'url', 'created_date', 'scan_score'] })
      .then((page) => setProjects(page.items))
      .catch(() => setProjects([]));
  }, []);

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Command Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Portfolio dossiers, autonomous market signals, and hunted IP seeds in one view.</p>
        </div>
        <Button asChild>
          <Link to="/new"><Plus className="size-4 mr-1.5" /> New Analysis</Link>
        </Button>
      </div>

      <StatStrip />

      <div className="grid gap-4 lg:grid-cols-2">
        <SignalFeed />
        <SeedFeed />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dossiers</h2>
          <Link to="/new" className="text-xs text-muted-foreground hover:text-slate-900 inline-flex items-center gap-1">
            New <ArrowUpRight className="size-3" />
          </Link>
        </div>

        {projects === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading…</div>
        ) : projects.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <div className="mx-auto size-12 rounded-xl bg-slate-950 flex items-center justify-center mb-4">
              <Crosshair className="size-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-medium">No dossiers yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Enter a company URL to generate your first investment dossier.</p>
            <Button asChild className="mx-auto">
              <Link to="/new"><Plus className="size-4 mr-1.5" /> Start an analysis</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="group">
                <Card className="p-5 hover:border-slate-300 hover:shadow-sm transition h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium tracking-tight truncate">{p.company_name || 'Untitled analysis'}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">{p.industry || p.url}</div>
                    </div>
                    <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-slate-900 transition shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant={p.status === 'complete' ? 'secondary' : 'outline'} className={p.status === 'complete' ? 'bg-emerald-100 text-emerald-700' : ''}>
                      {p.status}
                    </Badge>
                    {p.scan_score != null && <Badge variant="outline">Scan {p.scan_score}/100</Badge>}
                    <span className="text-xs text-muted-foreground">{moment(p.created_date).format('MMM D, YYYY')}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}