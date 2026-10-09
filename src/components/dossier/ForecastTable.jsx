import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function ForecastTable({ years }) {
  if (!years?.length) return <p className="text-sm text-muted-foreground">No forecast data.</p>;
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Year</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Expenses</TableHead>
            <TableHead className="text-right">EBITDA</TableHead>
            <TableHead className="text-right">Growth</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {years.map((y, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{y.year}</TableCell>
              <TableCell className="text-right tabular-nums">{currency.format(y.revenue || 0)}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">{currency.format(y.expenses || 0)}</TableCell>
              <TableCell className="text-right tabular-nums">{currency.format(y.ebitda || 0)}</TableCell>
              <TableCell className="text-right tabular-nums">{y.growth_rate != null ? `${y.growth_rate}%` : '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}