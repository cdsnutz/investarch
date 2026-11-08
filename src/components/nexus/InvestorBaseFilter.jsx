import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function InvestorBaseFilter({ options, baseTotal, value, onChange, focus }) {
  const quiet = options.filter((option) => !option.seeds).length;

  return (
    <div className="rounded-md border border-border bg-white p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Investor-base axis</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Filter to an investor you already track to see which seeds already name them.</p>
        </div>
        <Select value={value || 'all'} onValueChange={(next) => onChange(next === 'all' ? null : next)}>
          <SelectTrigger className="h-9 w-full sm:w-72">
            <SelectValue placeholder="All investor bases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All investor bases</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.key} value={option.key}>
                {option.label}{option.seeds ? ` · ${option.seeds}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {focus && (
        <div className="mt-3 rounded-md border border-border bg-paper p-3">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h4 className="font-heading text-base tracking-tight">{focus.label}</h4>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">in your investor base</span>
          </div>
          {focus.count === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">No seed names this investor yet. The nightly sweep adds written buyer leads to twelve seeds a night, and this list fills as they land.</p>
          ) : (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                {focus.count} {focus.count === 1 ? 'seed names' : 'seeds name'} them · combined asymmetry {focus.combinedAsym}
                {focus.count === 1 ? ' — only one, so there is no combined round to argue yet.' : ` — one round can be argued across all ${focus.count}.`}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {focus.seeds.map((seed) => (
                  <span key={seed.id} className="rounded border border-border bg-white px-1.5 py-0.5 text-[10px]">{seed.title} · {seed.asym}</span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {quiet > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">{quiet} of your {baseTotal} tracked investors name no seed yet.</p>
      )}
    </div>
  );
}