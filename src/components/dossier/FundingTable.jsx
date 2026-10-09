import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const TYPE_CLASS = {
  grant: "bg-emerald-100 text-emerald-700",
  vc: "bg-violet-100 text-violet-700",
  angel: "bg-amber-100 text-amber-700",
  loan: "bg-sky-100 text-sky-700"
};

export default function FundingTable({ sources }) {
  if (!sources?.length) return <p className="text-sm text-muted-foreground">No funding sources identified.</p>;
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[18%]">Source</TableHead>
            <TableHead className="w-[10%]">Type</TableHead>
            <TableHead>Focus</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead className="w-[28%]">Why It Fits</TableHead>
            <TableHead className="w-[16%]">Contact</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((s, i) => (
            <TableRow key={s.id || i}>
              <TableCell className="font-medium align-top">{s.name}</TableCell>
              <TableCell className="align-top">
                <Badge variant="secondary" className={TYPE_CLASS[s.type] || ""}>{s.type}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground align-top">{s.focus_area}</TableCell>
              <TableCell className="text-sm text-muted-foreground align-top">{s.stage}</TableCell>
              <TableCell className="text-sm align-top">{s.alignment_rationale}</TableCell>
              <TableCell className="text-sm text-muted-foreground align-top">{s.contact_info}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}