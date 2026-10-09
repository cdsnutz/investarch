import { useEffect, useState } from 'react';
import { Gauge, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlanList from './PlanList';
import ScanPanel from './ScanPanel';

const RUN_STAGES = [
  'Drafting the 20-point business plan',
  'Self-optimizing weak points',
  'Running the 100-point value scan',
  'Preparing grant applications and outreach'
];

export default function EngineTab({ project, running, onRun }) {
  const [stageIndex, setStageIndex] = useState(0);
  const hasEngine = project.scan_score != null;

  useEffect(() => {
    if (!running) { setStageIndex(0); return; }
    const t = setInterval(() => setStageIndex(i => (i + 1) % RUN_STAGES.length), 8000);
    return () => clearInterval(t);
  }, [running]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Value Engine</h3>
          <p className="text-xs text-muted-foreground mt-1">Builds the 20-point plan, optimizes it, scores it against 100 checks, and drafts funding applications.</p>
        </div>
        <Button size="sm" onClick={onRun} disabled={running} className="shrink-0">
          {running ? <Loader2 className="size-4 animate-spin" /> : <Gauge className="size-4" />}
          {running ? 'Running' : hasEngine ? 'Re-run engine' : 'Run engine'}
        </Button>
      </div>

      {running && (
        <div className="rounded-xl border border-border p-5 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin shrink-0" />{RUN_STAGES[stageIndex]}
        </div>
      )}

      {!hasEngine && !running && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <h4 className="font-medium">No value engine run yet</h4>
          <p className="text-sm text-muted-foreground mt-1">Run the engine to build the optimized plan, score it out of 100, and draft funding applications.</p>
        </div>
      )}

      {hasEngine && !running && (
        <>
          <ScanPanel scan={project.value_scan} />
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">20-Point Business Plan</h3>
              {project.plan_revisions > 0 && (
                <span className="text-xs text-muted-foreground">{project.plan_revisions} points rewritten during self-optimization</span>
              )}
            </div>
            <PlanList points={project.plan_points} />
          </div>
        </>
      )}
    </div>
  );
}