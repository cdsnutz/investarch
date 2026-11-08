import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Panel from '@/components/command/Panel';
import { buildReadinessHistory } from '@/lib/readinessHistory';

const EMPTY = { projects: [], competitors: [], funding: [], archetypes: [] };

export default function ReadinessTrendPanel({ refreshKey }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      base44.entities.Project.filter({}, { sort: '-created_date', limit: 100, fields: ['company_name', 'industry', 'tags', 'scan_score', 'created_date'] }),
      base44.entities.Competitor.filter({}, { sort: '-created_date', limit: 200, fields: ['project_id', 'name', 'overall_score', 'created_date'] }),
      base44.entities.FundingSource.filter({}, { sort: '-created_date', limit: 200, fields: ['project_id', 'name', 'type', 'focus_area', 'outreach_status', 'created_date'] }),
      base44.entities.ArchetypeImprint.filter({}, { sort: '-created_date', limit: 40, fields: ['archetype_name', 'population_segment', 'imprint_thesis', 'channels', 'imprint_depth_pct', 'created_date'] })
    ]).then(([p, c, f, a]) => {
      setData({
        projects: p.status === 'fulfilled' ? p.value.items : [],
        competitors: c.status === 'fulfilled' ? c.value.items : [],
        funding: f.status === 'fulfilled' ? f.value.items : [],
        archetypes: a.status === 'fulfilled' ? a.value.items : []
      });
    });
  }, []);

  const points = useMemo(() => (data ? buildReadinessHistory(data) : []), [data]);

  const current = points[points.length - 1] || null;
  const opening = points[0] || null;
  const change = current && opening ? current.total - opening.total : 0;

  return (
    <Panel
      code="R"
      title="Funding Readiness Trend"
      action={<span className="text-xs text-muted-foreground">{current ? `total ${current.total}` : 'loading…'}</span>}
    >
      {!data ? (
        <p className="text-xs text-muted-foreground">Rebuilding the nexus over time…</p>
      ) : points.length === 0 ? (
        <p className="text-xs text-muted-foreground">No dossiers to score yet. Run an analysis to start the trend.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="border border-border px-2 py-2">
              <div className="font-mono text-base tabular-nums">{current.total}</div>
              <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Total now</div>
            </div>
            <div className="border border-border px-2 py-2">
              <div className={`font-mono text-base tabular-nums ${change > 0 ? 'text-bottle' : change < 0 ? 'text-destructive' : ''}`}>
                {change > 0 ? `+${change}` : change}
              </div>
              <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Since {opening.label}</div>
            </div>
            <div className="border border-border px-2 py-2">
              <div className="font-mono text-base tabular-nums">{current.dossiers}</div>
              <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Dossiers scored</div>
            </div>
          </div>

          <div className="h-[220px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="readinessFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--bottle))" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="hsl(var(--bottle))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  interval="preserveStartEnd"
                  minTickGap={12}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, border: '1px solid hsl(var(--border))', background: 'white', borderRadius: 4 }}
                  labelStyle={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))' }}
                  formatter={(value) => [`${value} readiness`, 'Total']}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--bottle))"
                  strokeWidth={2}
                  fill="url(#readinessFill)"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Each point re-scores the nexus from the dossiers, rivals, capital claims and archetypes that existed at that date, using the scan scores stored on the dossiers. Average readiness is {current.average} across {current.dossiers} dossier{current.dossiers === 1 ? '' : 's'}, with {current.capitalReady} in the capital-ready band.
          </p>
        </>
      )}
    </Panel>
  );
}