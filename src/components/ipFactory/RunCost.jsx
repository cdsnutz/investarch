import React from 'react';
import { Coins } from 'lucide-react';
import {
  HUNT_MODEL_CALLS,
  HUNT_WEB_SEARCH_CALLS,
  HUNT_CREDITS_FROM
} from '@/lib/huntCost';

export default function RunCost({ running, lastRun }) {
  if (lastRun) {
    const calls = lastRun.model_calls ?? HUNT_MODEL_CALLS;
    const credits = lastRun.credits_estimate ?? calls;
    return (
      <div className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        <Coins className="size-3.5 text-bottle" />
        <span className="text-foreground font-medium">{lastRun.seeds_created ?? 0} seeds</span>
        <span>from {calls} model calls · about {credits} integration credits</span>
        {lastRun.web_search_calls ? <span>· {lastRun.web_search_calls} with live web search</span> : null}
      </div>
    );
  }

  return (
    <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
      <Coins className="size-3.5" />
      {running
        ? `Spending credits now — ${HUNT_MODEL_CALLS} model calls, ${HUNT_WEB_SEARCH_CALLS} with live web search.`
        : `One run fires ${HUNT_MODEL_CALLS} model calls (${HUNT_WEB_SEARCH_CALLS} with live web search): from ${HUNT_CREDITS_FROM} integration credits at the default model, more if a call bills above one.`}
    </p>
  );
}