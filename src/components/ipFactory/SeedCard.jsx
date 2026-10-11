import { Badge } from '@/components/ui/badge';
import { Wrench, Scale, Handshake, Hammer } from 'lucide-react';

const STRATEGY_STYLE = {
  hold: 'bg-slate-100 text-slate-700',
  flip: 'bg-amber-100 text-amber-800',
  build: 'bg-emerald-100 text-emerald-800'
};

export default function SeedCard({ seed, filings, prospectus, onOpen }) {
  return (
    <button onClick={onOpen} className="text-left rounded-xl border bg-card p-5 hover:border-slate-400 transition flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug">{seed.title}</h3>
        <Badge variant="secondary" className="shrink-0 bg-slate-100">Asym {seed.asymmetric_score}/10</Badge>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3">{seed.gap}</p>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <Badge className={STRATEGY_STYLE[seed.strategy] || STRATEGY_STYLE.hold}>{seed.strategy}</Badge>
        {seed.status === 'built' && (
          <span className="inline-flex items-center gap-1 text-muted-foreground"><Wrench className="size-3" /> codebase</span>
        )}
        {(filings || []).length > 0 && (
          <span className="inline-flex items-center gap-1 text-muted-foreground"><Scale className="size-3" /> {(filings || []).length} filing{(filings || []).length > 1 ? 's' : ''}</span>
        )}
        {prospectus && (
          <span className="inline-flex items-center gap-1 text-muted-foreground"><Handshake className="size-3" /> prospectus</span>
        )}
      </div>
      <div className="mt-auto text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
        <Hammer className="size-3 shrink-0" />
        <span className="truncate">{seed.source_channel || seed.pain_signal || 'Market signal'}</span>
      </div>
    </button>
  );
}