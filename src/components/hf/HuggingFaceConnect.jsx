import { Button } from '@/components/ui/button';

// Inline gate: renders nothing once the user's Hugging Face account is linked.
export default function HuggingFaceConnect({ hf }) {
  if (hf.checking || hf.connected) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
      <span>Hugging Face model access is not linked to your account.</span>
      <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={hf.connect}>
        Connect Hugging Face
      </Button>
    </div>
  );
}