import { Badge } from '@/components/ui/badge';

const STYLES = {
  High: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Watch: 'bg-amber-50 text-amber-900 border-amber-200',
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
  Unresearched: 'bg-muted text-muted-foreground border-transparent'
};

export default function ConvictionBadge({ entry }) {
  const label = entry?.label || 'Unresearched';
  const score = Number(entry?.score) || 0;

  return (
    <Badge
      variant="secondary"
      className={`tabular-nums ${STYLES[label] || STYLES.Unresearched}`}
      title={entry?.why || 'Scored from research depth and evidence grading only.'}
    >
      Conviction {score} · {label}
    </Badge>
  );
}