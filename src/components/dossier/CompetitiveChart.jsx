import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const COMPETITOR_COLORS = ['#94a3b8', '#64748b', '#cbd5e1', '#475569'];

export default function CompetitiveChart({ project, competitors, onScore, scoring }) {
  const companyName = project.company_name || 'Target company';
  const radar = project.competitive_radar;
  const hasData = radar?.company_scores?.length > 0 && competitors.some((c) => c.radar_scores?.length > 0);

  if (!hasData) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <h3 className="font-medium">Competitive radar</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Score the company and its competitors across five competitive dimensions to visualize how it stacks up.</p>
        <Button size="sm" onClick={onScore} disabled={scoring}>
          {scoring && <Loader2 className="size-4 mr-1.5 animate-spin" />}
          {scoring ? 'Scoring competition…' : 'Score competition'}
        </Button>
      </div>
    );
  }

  const toMap = (arr) => Object.fromEntries((arr || []).map((s) => [s.dimension, s.score]));
  const companyMap = toMap(radar.company_scores);
  const charted = competitors.filter((c) => c.radar_scores?.length > 0).slice(0, 4);
  const rows = radar.dimensions.map((d) => {
    const row = { dimension: d, [companyName]: companyMap[d] };
    charted.forEach((c) => { row[c.name] = toMap(c.radar_scores)[d]; });
    return row;
  });

  const avg = (arr) => {
    const scores = (arr || []).map((s) => s.score || 0);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  };
  const ranking = [
    { name: companyName, score: avg(radar.company_scores), own: true },
    ...charted.map((c) => ({ name: c.name, score: avg(c.radar_scores) }))
  ].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={rows} outerRadius="72%">
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: '#64748b' }} />
            <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
            <Radar name={companyName} dataKey={companyName} stroke="#059669" fill="#059669" fillOpacity={0.22} strokeWidth={2} />
            {charted.map((c, i) => (
              <Radar key={c.id} name={c.name} dataKey={c.name} stroke={COMPETITOR_COLORS[i % COMPETITOR_COLORS.length]} fill={COMPETITOR_COLORS[i % COMPETITOR_COLORS.length]} fillOpacity={0.06} />
            ))}
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-xl border bg-card p-4 space-y-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Average score across dimensions (0 to 10)</h4>
        {ranking.map((r) => (
          <div key={r.name} className="flex items-center gap-3">
            <span className={`text-sm w-32 sm:w-44 shrink-0 truncate ${r.own ? 'font-medium' : 'text-muted-foreground'}`}>{r.name}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${r.own ? 'bg-emerald-500' : 'bg-slate-300'}`} style={{ width: `${(r.score / 10) * 100}%` }} />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{r.score.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}