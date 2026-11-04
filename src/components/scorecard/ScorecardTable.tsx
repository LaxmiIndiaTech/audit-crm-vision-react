import React from 'react';
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  const isPerformancePoint = (code: string) => /^[H-M]/i.test(code);
  const hasPerformancePoints = points.some((p) => isPerformancePoint(p.code));

  const processPoints = points.filter((p) => !isPerformancePoint(p.code));
  const performancePoints = points.filter((p) => isPerformancePoint(p.code));

  const processCarry = processPoints.reduce((sum, p) => sum + p.marks_carry, 0);
  const processObtain = processPoints.reduce((sum, p) => sum + p.marks_obtained, 0);
  const processPercent = processCarry > 0 ? Math.round((processObtain / processCarry) * 100) : 0;

  const perfCarry = performancePoints.reduce((sum, p) => sum + p.marks_carry, 0);
  const perfObtain = performancePoints.reduce((sum, p) => sum + p.marks_obtained, 0);
  const perfPercent = perfCarry > 0 ? Math.round((perfObtain / perfCarry) * 100) : 0;

  const renderPointRow = (p: ScorePoint) => (
    <TableRow key={p.code} className="hover:bg-muted/30">
      <TableCell className="font-semibold whitespace-nowrap">
        <span className="px-2 py-0.5 rounded bg-muted text-xs font-mono">{p.code}</span>
      </TableCell>
      <TableCell className="min-w-[240px] text-sm">{p.section}</TableCell>
      <TableCell className="text-right font-medium">{p.marks_carry}</TableCell>
      <TableCell className="text-right font-bold text-primary">{p.marks_obtained}</TableCell>
      <TableCell className="text-right">
        <span
          className={`font-semibold ${
            p.percentage >= 80
              ? 'text-emerald-600 dark:text-emerald-400'
              : p.percentage >= 50
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {p.percentage}%
        </span>
      </TableCell>
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
  );

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-16">Code</TableHead>
            <TableHead>Checklist Item</TableHead>
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
              <TableCell colSpan={11} className="text-center py-6 text-muted-foreground">
                Loading inspection data...
              </TableCell>
            </TableRow>
          ) : points.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center py-6 text-muted-foreground">
                {selectedBranchId
                  ? 'No inspection data available for selected date'
                  : 'Select a branch and date to view inspection data'}
              </TableCell>
            </TableRow>
          ) : hasPerformancePoints ? (
            <>
              {/* Part I Header */}
              <TableRow className="bg-blue-50/70 dark:bg-blue-950/40 border-t border-b border-blue-200 dark:border-blue-900">
                <TableCell colSpan={11} className="py-2.5 font-bold text-blue-900 dark:text-blue-300">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 font-semibold text-xs">
                      PART I
                    </Badge>
                    <span>PROCESS WISE INSPECTION (A – G)</span>
                    <span className="text-xs font-normal text-muted-foreground ml-auto">
                      Carry Marks: 40 | Sections A to G
                    </span>
                  </div>
                </TableCell>
              </TableRow>

              {processPoints.map(renderPointRow)}

              {/* Part I Subtotal */}
              <TableRow className="font-semibold bg-blue-50/40 dark:bg-blue-950/20 border-t border-b border-blue-200/60 dark:border-blue-900/40">
                <TableCell colSpan={2} className="text-foreground">
                  Sub Total (Part I: Process)
                </TableCell>
                <TableCell className="text-right font-bold">{processCarry}</TableCell>
                <TableCell className="text-right font-bold text-blue-700 dark:text-blue-400">
                  {processObtain}
                </TableCell>
                <TableCell className="text-right font-bold">{processPercent}%</TableCell>
                <TableCell colSpan={5}></TableCell>
                <TableCell className="text-right">—</TableCell>
              </TableRow>

              {/* Part II Header */}
              <TableRow className="bg-purple-50/70 dark:bg-purple-950/40 border-t-2 border-b border-purple-200 dark:border-purple-900">
                <TableCell colSpan={11} className="py-2.5 font-bold text-purple-900 dark:text-purple-300">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-300 font-semibold text-xs">
                      PART II
                    </Badge>
                    <span>PERFORMANCE WISE INSPECTION (H – M)</span>
                    <span className="text-xs font-normal text-muted-foreground ml-auto">
                      Carry Marks: 60 | Sections H to M
                    </span>
                  </div>
                </TableCell>
              </TableRow>

              {performancePoints.map(renderPointRow)}

              {/* Part II Subtotal */}
              <TableRow className="font-semibold bg-purple-50/40 dark:bg-purple-950/20 border-t border-b border-purple-200/60 dark:border-purple-900/40">
                <TableCell colSpan={2} className="text-foreground">
                  Sub Total (Part II: Performance)
                </TableCell>
                <TableCell className="text-right font-bold">{perfCarry}</TableCell>
                <TableCell className="text-right font-bold text-purple-700 dark:text-purple-400">
                  {perfObtain}
                </TableCell>
                <TableCell className="text-right font-bold">{perfPercent}%</TableCell>
                <TableCell colSpan={5}></TableCell>
                <TableCell className="text-right">—</TableCell>
              </TableRow>
            </>
          ) : (
            points.map(renderPointRow)
          )}

          {/* Grand Total */}
          {points.length > 0 && (
            <TableRow className="font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
              <TableCell colSpan={2}>Grand Total (Process + Performance)</TableCell>
              <TableCell className="text-right">{totalCarry}</TableCell>
              <TableCell className="text-right">{totalObtain}</TableCell>
              <TableCell className="text-right">{totalPercent}%</TableCell>
              <TableCell colSpan={5}></TableCell>
              <TableCell className="text-right">—</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
