import { Badge } from '@/components/ui/badge';
import { ShieldAlert, TimerReset } from 'lucide-react';

const STATUS_LABEL = {
  predicted: 'Predicted',
  staked: 'Staked',
  foundation_building: 'Foundation building',
  operational: 'Operational'
};

const GRADE_STYLE = {
  strong: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  moderate: 'bg-amber-50 text-amber-800 border-amber-200',
  weak: 'bg-rose-50 text-rose-800 border-rose-200'
};

export default function VectorCard({ vector }) {
  const indicators = vector.leading_indicators || [];
  const assets = vector.staked_assets || [];

  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-medium">{vector.vector_name}</span>
        <Badge variant="secondary">{STATUS_LABEL[vector.status] || vector.status}</Badge>
        {vector.signal_grade && (
          <Badge variant="outline" className={GRADE_STYLE[vector.signal_grade] || ''}>
            {vector.signal_grade} evidence
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span>{vector.sector}</span>
        <span>Horizon {vector.horizon_months} mo</span>
        <span>Arrival {vector.arrival_probability}%</span>
        <span>Conviction {vector.conviction_score}/10</span>
        {vector.kill_date && (
          <span className="inline-flex items-center gap-1">
            <TimerReset className="size-3" /> Re-check {vector.kill_date}
          </span>
        )}
      </div>

      <p className="text-xs leading-relaxed">{vector.gold_rush_thesis}</p>

      {vector.why_now && (
        <p className="text-xs leading-relaxed">
          <span className="font-medium">Why now:</span> {vector.why_now}
        </p>
      )}

      {indicators.length > 0 && (
        <ul className="text-[11px] text-muted-foreground list-disc pl-4 space-y-0.5">
          {indicators.slice(0, 3).map((indicator, index) => (
            <li key={index}>{indicator}</li>
          ))}
        </ul>
      )}

      {vector.falsifier && (
        <p className="text-[11px] leading-relaxed rounded-md bg-muted/60 p-2 flex gap-1.5">
          <ShieldAlert className="size-3 mt-0.5 shrink-0 text-muted-foreground" />
          <span>
            <span className="font-medium">Falsifier:</span> {vector.falsifier}
          </span>
        </p>
      )}

      <div className="text-[10px] text-muted-foreground">
        {assets.length} asset{assets.length === 1 ? '' : 's'} staked for this vector
      </div>
    </div>
  );
}