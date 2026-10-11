import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function HegemonyProjection({ epoch }) {
  if (!epoch) {
    return <p className="text-sm text-muted-foreground">No epoch projected yet. Run the Omni-Cortex after the Hive pods complete a cycle.</p>;
  }
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '-');
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold tracking-tight">{epoch.epoch_name}</h3>
        <span className="text-[10px] uppercase tracking-wide rounded-md bg-violet-500/10 border border-violet-500/30 text-violet-600 px-2 py-0.5">Epoch Projection</span>
        <span className="text-xs text-muted-foreground ml-auto">Projected {epoch.projection_date}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-semibold tabular-nums">{epoch.total_absorption_pct ?? '-'}</span>
        <span className="text-lg text-muted-foreground">% target-sector absorption at epoch end</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Narratives', value: epoch.narrative_count },
          { label: 'Hybrid Assets', value: epoch.hybrid_count },
          { label: 'Personas', value: epoch.persona_count },
          { label: 'Reg. Levers', value: epoch.lever_count }
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-muted p-3">
            <div className="text-lg font-semibold tabular-nums">{fmt(s.value)}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      {(epoch.years || []).length > 0 && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={epoch.years} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
              <Tooltip formatter={(v) => [`${v}%`, 'Absorption']} labelStyle={{ fontWeight: 600 }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="absorption_pct" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {epoch.verdict && (
        <p className="text-sm border-t border-border pt-4 leading-relaxed"><span className="font-semibold">Verdict:</span> {epoch.verdict}</p>
      )}
      {(epoch.years || []).length > 0 && (
        <div className="space-y-1.5">
          {epoch.years.map((y, i) => (
            <div key={i} className="flex gap-3 text-xs">
              <span className="font-semibold tabular-nums shrink-0 w-10">{y.year}</span>
              <span className="text-muted-foreground">{y.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}