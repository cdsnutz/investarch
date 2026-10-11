import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function RunButton({ label, fn, onLoad }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    try {
      await base44.functions.invoke(fn, {});
      await onLoad();
    } catch (e) {
      toast({ title: `${label} run failed`, description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }, [fn, label, onLoad, toast]);

  return (
    <Button size="sm" variant="outline" onClick={run} disabled={busy}>
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
      {busy ? 'Running…' : label}
    </Button>
  );
}