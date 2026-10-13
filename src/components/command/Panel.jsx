export default function Panel({ code, title, action, children }) {
  return (
    <section className="border border-border bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-mono text-muted-foreground">{code}</span>
          <h2 className="font-heading text-lg tracking-tight">{title}</h2>
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}