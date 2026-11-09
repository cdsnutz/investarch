import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Panel from '@/components/command/Panel';
import { buildConvictionTrend } from '@/lib/convictionTrend';

const FIELDS = ['title', 'buyer_leads', 'yield_date', 'created_date', 'source_seed_ids', 'source_channel'];

export default function ConvictionTrendPanel({ refreshKey }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    Promise.allSettled([
      base44.entities.IpSeed.filter({}, { sort: '-created_date', limit: 300, fields: FIELDS }),
      base44.entities.BuyerResearch.filter({}, { sort: '-researched_date', limit: 400 })
    ]).then(([seeds, research]) => {
      setData(buildConvictionTrend({
        seeds: seeds.status === 'fulfilled' ? seeds.value.items : [],
        research: research.status === 'fulfilled' ? research.value.items : []
      }));
    });
  }, [refreshKey]);

  const trend = useMemo(() => data || { points: [], totals: {} }, [data]);
  const { points, totals } = trend;
  const up = totals.change > 0;

  return (
    <Panel
      code="C"
      title="Conviction Trend"
      action={<span className="text-xs text-muted-foreground">{data ? `avg ${totals.overall}/100` : 'loading…'}</span>}
    >
      {!data ? (
        <p className="text-xs text-muted-foreground">Scoring every seed against its buyer research…</p>
      ) : points.length === 0 ? (
        <p className="text-xs text-muted-foreground">No seeds scored yet. Run a hunt in the IP Factory to start the trend.</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 mb-4 text-center">
            <div className="border border-border px-2 py-2">
              <div className="font-mono text-base tabular-nums">{totals.latest}</div>
              <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Latest cohort</div>
            </div>
            <div className="border border-border px-2 py-2">
              <div className={`font-mono text-base tabular-nums ${up ? 'text-bottle' : totals.change < 0 ? 'text-destructive' : ''}`}>
                {totals.change > 0 ? `+${totals.change}` : totals.change}
              </div>
              <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Vs first cohort</div>
            </div>
            <div className="border border-border px-2 py-2">
              <div className="font-mono text-base tabular-nums">{totals.running}</div>
              <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Running avg</div>
            </div>
            <div className="border border-border px-2 py-2">
              <div className="font-mono text-base tabular-nums">{totals.high}/{totals.seeds}</div>
              <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">High conviction</div>
            </div>
          </div>

          <div className="h-[230px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
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
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  ticks={[0, 25, 50, 75, 100]}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, border: '1px solid hsl(var(--border))', background: 'white', borderRadius: 4 }}
                  labelStyle={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))' }}
                  formatter={(value, name) => [`${value}/100`, name === 'avg' ? 'Cohort average' : 'Running average']}
                  labelFormatter={(label, rows) => {
                    const point = rows?.[0]?.payload;
                    return point ? `${label} · ${point.seeds} seed${point.seeds === 1 ? '' : 's'}, ${point.verified} with verified buyers` : label;
                  }}
                />
                <Line type="monotone" dataKey="avg" stroke="hsl(var(--bottle))" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 3 }} />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  activeDot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-4 mt-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-bottle" /> Cohort average</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t border-dashed border-muted-foreground" /> Running average</span>
          </div>

          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Seeds grouped by the week they were yielded and scored on the buyer research on file, so a rising cohort average means new seeds are arriving with better evidence. {totals.graded} of {totals.seeds} seeds carry at least one researched buyer; unresearched seeds score zero and pull their cohort down.
          </p>
        </>
      )}
    </Panel>
  );
}