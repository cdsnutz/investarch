import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function CompetitorTable({ competitors }) {
  if (!competitors?.length) return <p className="text-sm text-muted-foreground">No competitors mapped.</p>;
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[18%]">Competitor</TableHead>
            <TableHead>Strengths</TableHead>
            <TableHead>Weaknesses</TableHead>
            <TableHead className="w-[26%]">Our Edge</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {competitors.map((c, i) => (
            <TableRow key={c.id || i}>
              <TableCell className="font-medium align-top">{c.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground align-top">{c.strengths}</TableCell>
              <TableCell className="text-sm text-muted-foreground align-top">{c.weaknesses}</TableCell>
              <TableCell className="text-sm align-top">{c.our_advantage}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}