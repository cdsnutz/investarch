import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function GoldMvpResult({ result }) {
  if (!result) return null;
  const { shipped, failures, forged, reused, waiting, filename } = result;

  return (
    <div className="mt-3 space-y-2">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="size-3.5" />
          {shipped} app{shipped === 1 ? '' : 's'} exported
        </div>
        <p className="text-[11px] text-emerald-900 mt-1">
          {forged} teardown{forged === 1 ? '' : 's'} forged, {reused} reused, every app audited before packaging.
          {filename ? ` File: ${filename}` : ''}
        </p>
        {waiting > 0 && (
          <p className="text-[11px] text-emerald-900/80 mt-1">
            {waiting} seed{waiting === 1 ? '' : 's'} still await{" "}
            {waiting === 1 ? 'its teardown' : 'their teardowns'}. Press the button again for the next ten.
          </p>
        )}
      </div>
      {failures.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-destructive">
            <AlertTriangle className="size-3.5" />
            {failures.length} seed{failures.length === 1 ? '' : 's'} held back
          </div>
          <ul className="mt-2 space-y-1">
            {failures.slice(0, 6).map((failure, index) => (
              <li key={index} className="text-[11px] text-foreground/80 break-words">
                <span className="font-medium">{failure.seed}</span>: {failure.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}