import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
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
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-6xl mx-auto space-y-10">
      <div className="border-t-2 border-foreground/80 pt-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl tracking-tight">Command Center</h1>
          <p className="text-sm text-muted-foreground mt-2">Portfolio dossiers, autonomous market signals, and hunted IP seeds in one view.</p>
        </div>
        <Button asChild className="bg-bottle hover:bg-bottle/90 text-bottle-foreground shrink-0">
          <Link to="/new">New Analysis</Link>
        </Button>
      </div>

      <StatStrip />

      <div className="grid gap-4 lg:grid-cols-2">
        <SignalFeed />
        <SeedFeed />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl tracking-tight">Dossiers</h2>
          <Link to="/new" className="text-xs text-bottle hover:underline">New analysis</Link>
        </div>

        {projects === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading…</div>
        ) : projects.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <h3 className="font-heading text-xl tracking-tight">No dossiers yet</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-6">Enter a company URL to generate your first investment dossier.</p>
            <Button asChild className="mx-auto bg-bottle hover:bg-bottle/90 text-bottle-foreground">
              <Link to="/new">Start an analysis</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`}>
                <Card className="p-5 rounded-md hover:border-foreground/30 transition h-full">
                  <div className="min-w-0">
                    <div className="font-heading text-lg tracking-tight truncate">{p.company_name || 'Untitled analysis'}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{p.industry || p.url}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant={p.status === 'complete' ? 'secondary' : 'outline'} className={p.status === 'complete' ? 'bg-bottle/10 text-bottle border-transparent' : ''}>
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