import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';
import { Banknote } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CashChequeReceipt } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface CashNormsTableProps {
  receipts: CashChequeReceipt[];
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const CashNormsTable: React.FC<CashNormsTableProps> = ({
  receipts,
  isLoading,
  error,
  page,
  totalPages,
  onPageChange,
}) => {
  const current = Math.min(page, Math.max(1, totalPages));
  const navigate = useNavigate();

  const formatDate = (val?: string | null) => {
    if (!val) return '-';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch {
      return val;
    }
  };

  const getTatBadge = (tat?: string | null, gap?: number | null) => {
    const g = gap ?? (tat ? parseInt(tat.replace('T+', ''), 10) : 0);
    if (g <= 1) {
      return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold">{tat || `T+${g}`}</Badge>;
    } else if (g === 2) {
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold">{tat || `T+${g}`}</Badge>;
    } else if (g === 3 || g === 4) {
      return <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold">{tat || `T+${g}`}</Badge>;
    } else {
      return <Badge className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold">{tat || `T+${g}`}</Badge>;
    }
  };

  const getScoreBadge = (receipt: CashChequeReceipt) => {
    let pts = receipt.scoring_rule?.score;
    const gap = receipt.gap_in_days;
    if (pts === undefined || pts === null) {
      if (gap !== undefined && gap !== null) {
        if (gap <= 1) pts = 10;
        else if (gap === 2) pts = 7;
        else if (gap === 3) pts = 4;
        else if (gap === 4) pts = 2;
        else pts = 0;
      }
    }
    if (pts === undefined || pts === null) return <span className="text-muted-foreground text-xs">-</span>;
    
    if (pts >= 10) {
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">{pts} pts (100%)</span>;
    } else if (pts >= 7) {
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">{pts} pts (70%)</span>;
    } else if (pts > 0) {
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">{pts} pts ({pts * 10}%)</span>;
    } else {
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">{pts} pts (0%)</span>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">Daily Collection Receipts (A.1 Verification)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {error && (
            <div className="px-4 py-3">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
          <div className="overflow-x-auto border-t">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="whitespace-nowrap font-semibold">Created Date</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Deposit Date</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Gap</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">TAT Status</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Score Master Rule</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Loan No</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Customer</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Amount Paid</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Deposit Amount</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Branch</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Collected By</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={12}>
                      <div className="py-10 text-center text-muted-foreground">Loading receipts…</div>
                    </TableCell>
                  </TableRow>
                )}
                {(!isLoading && receipts.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={12}>
                      <div className="py-10 text-center text-muted-foreground">No receipts found</div>
                    </TableCell>
                  </TableRow>
                )}
                {receipts.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{formatDate(r.created_date || r.created_at)}</TableCell>
                    <TableCell className="font-medium text-blue-600 dark:text-blue-400">{formatDate(r.deposit_date)}</TableCell>
                    <TableCell>
                      {r.gap_in_days !== undefined && r.gap_in_days !== null ? (
                        <span className="text-xs font-semibold">{r.gap_in_days} {r.gap_in_days === 1 ? 'day' : 'days'}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getTatBadge(r.tat_status, r.gap_in_days)}</TableCell>
                    <TableCell>{getScoreBadge(r)}</TableCell>
                    <TableCell className="font-mono text-xs font-medium">{r.loan_no}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-xs">{r.customer_name}</span>
                        <span className="text-muted-foreground text-[11px]">{r.customer_mobile_no}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-xs">₹ {Number(r.total_amount_paid || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs">₹ {Number(r.deposit_amount || r.total_amount_paid || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{r.branch_name || r.branch?.branch_name || '-'}</TableCell>
                    <TableCell className="text-xs">{r.collected_by_name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => navigate(`/cash-norms/${r.id}`, { state: { receipt: r } })}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination className="pt-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); if (current > 1) onPageChange(current - 1); }}
                className={current === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {(() => {
              const windowSize = 5;
              let start = current;
              if (totalPages <= windowSize) {
                start = 1;
              } else if (current > totalPages - windowSize + 1) {
                start = Math.max(1, totalPages - windowSize + 1);
              }
              const end = Math.min(totalPages, start + windowSize - 1);
              const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
              return (
                <>
                  {pages.map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink href="#" isActive={p === current} onClick={(e) => { e.preventDefault(); onPageChange(p); }}>
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  {end < totalPages && (
                    <>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); onPageChange(totalPages); }}>
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                </>
              );
            })()}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); if (current < totalPages) onPageChange(current + 1); }}
                className={current === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
};
