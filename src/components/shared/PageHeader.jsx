export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="border-t-2 border-foreground/80 pt-6 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="font-heading text-3xl md:text-4xl tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}