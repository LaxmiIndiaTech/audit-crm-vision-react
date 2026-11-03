import React from 'react';
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface ScorePoint {
  code: string;
  section: string;
  marks_carry: number;
  marks_obtained: number;
  percentage: number;
  total_receipts: number;
  scored_receipts: number;
  average_score: number;
  visitorComment?: string;
  lastReply?: string;
}

interface ScorecardTableProps {
  points: ScorePoint[];
  loading: boolean;
  selectedBranchId: string;
  totalCarry: number;
  totalObtain: number;
  totalPercent: number;
  onRowClick: (code: string) => void;
}

export const ScorecardTable: React.FC<ScorecardTableProps> = ({
  points,
  loading,
  selectedBranchId,
  totalCarry,
  totalObtain,
  totalPercent,
  onRowClick,
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Section</TableHead>
            <TableHead>CHECK LIST</TableHead>
            <TableHead className="text-right">Carry</TableHead>
            <TableHead className="text-right">Obtain</TableHead>
            <TableHead className="text-right">% Score</TableHead>
            <TableHead className="text-right">Total Receipts</TableHead>
            <TableHead className="text-right">Scored Receipts</TableHead>
            <TableHead className="text-right">Avg Score</TableHead>
            <TableHead className="text-center">Visitor Comment</TableHead>
            <TableHead className="text-center">Last Reply</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center py-4">
                Loading inspection data...
              </TableCell>
            </TableRow>
          ) : points.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center py-4 text-muted-foreground">
                {selectedBranchId ? 'No inspection data available for selected date' : 'Select a branch and date to view inspection data'}
              </TableCell>
            </TableRow>
          ) : (
            points.map((p) => (
              <TableRow key={p.code}>
                <TableCell className="font-medium whitespace-nowrap">{p.code}</TableCell>
                <TableCell className="min-w-[240px]">{p.section}</TableCell>
                <TableCell className="text-right">{p.marks_carry}</TableCell>
                <TableCell className="text-right">{p.marks_obtained}</TableCell>
                <TableCell className="text-right">{p.percentage}%</TableCell>
                <TableCell className="text-right">{p.total_receipts.toLocaleString()}</TableCell>
                <TableCell className="text-right">{p.scored_receipts.toLocaleString()}</TableCell>
                <TableCell className="text-right">{p.average_score.toFixed(2)}</TableCell>
                <TableCell className="text-xs min-w-[140px] whitespace-pre-line">
                  {p.visitorComment || <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-xs min-w-[140px] whitespace-pre-line">
                  {p.lastReply || <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onRowClick(p.code)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
          <TableRow className="font-semibold bg-muted/40">
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell className="text-right">{totalCarry}</TableCell>
            <TableCell className="text-right">{totalObtain}</TableCell>
            <TableCell className="text-right">{totalPercent}%</TableCell>
            <TableCell colSpan={5}></TableCell>
            <TableCell className="text-right">—</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
