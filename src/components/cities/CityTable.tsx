import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';
import { Edit, Landmark } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface UiCity {
  id: number;
  city_name: string;
  city_code: string;
  is_active?: boolean;
  state?: { id: number; state_name: string; state_code: string };
}

interface CityTableProps {
  cities: UiCity[];
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (ct: UiCity) => void;
}

export const CityTable: React.FC<CityTableProps> = ({
  cities,
  isLoading,
  error,
  page,
  totalPages,
  onPageChange,
  onEdit,
}) => {
  const current = Math.min(page, Math.max(1, totalPages));

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">Cities</CardTitle>
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
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="py-10 text-center text-muted-foreground">Loading cities…</div>
                    </TableCell>
                  </TableRow>
                )}
                {(!isLoading && cities.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="py-10 text-center text-muted-foreground">No cities found</div>
                    </TableCell>
                  </TableRow>
                )}
                {cities.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-muted-foreground">#{c.id}</TableCell>
                    <TableCell>{c.city_name}</TableCell>
                    <TableCell>{c.city_code}</TableCell>
                    <TableCell>{c.state?.state_name || '-'}</TableCell>
                    <TableCell>
                      <Badge className={c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {c.is_active ? 'active' : 'inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => onEdit(c)}>
                        <Edit className="w-4 h-4" />
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
