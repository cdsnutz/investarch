export default function Steps({ items }) {
  return (
    <ol className="space-y-3">
      {items.map((text, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-bottle/30 bg-bottle/5 font-mono text-[11px] text-bottle">
            {i + 1}
          </span>
          <span className="text-muted-foreground">{text}</span>
        </li>
      ))}
    </ol>
  );
}