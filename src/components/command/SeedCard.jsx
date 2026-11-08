import { bandOf } from '@/lib/seedReadiness';

const STRATEGY_TONE = {
  build: 'text-bottle border-bottle/30',
  flip: 'text-amber-700 border-amber-600/30',
  hold: 'text-muted-foreground border-border'
};

export default function SeedCard({ seed, score, filings, hasProspectus }) {
  const band = bandOf(score);
  return (
    <article className="border border-border bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-heading text-[14px] leading-snug min-w-0 break-words">{seed.title}</h4>
        <span className="font-mono text-sm text-bottle shrink-0 tabular-nums">{score}</span>
      </div>
      <div className="mt-2 h-1 w-full bg-muted overflow-hidden">
        <div className="h-full bg-bottle" style={{ width: `${score}%` }} />
      </div>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        <span>asym {seed.asymmetric_score ?? '–'}</span>
        <span>·</span>
        <span>{filings} filing{filings === 1 ? '' : 's'}</span>
        <span>·</span>
        <span className={hasProspectus ? 'text-foreground' : ''}>{hasProspectus ? 'prospectus' : 'no buyer path'}</span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-2">
        <span className={`text-[10px] uppercase tracking-[0.12em] border px-1.5 py-0.5 ${STRATEGY_TONE[seed.strategy] || STRATEGY_TONE.hold}`}>
          {seed.strategy || 'hold'}
        </span>
        <span className="text-[10px] text-muted-foreground truncate">{band.blurb}</span>
      </div>
    </article>
  );
}