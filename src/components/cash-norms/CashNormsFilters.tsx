import React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar } from 'lucide-react';

interface CashNormsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  month: number | undefined;
  onMonthChange: (value: number | undefined) => void;
  year: number | undefined;
  onYearChange: (value: number | undefined) => void;
  filterField: 'deposit_date' | 'payment_date' | 'created_date' | undefined;
  onFilterFieldChange: (value: 'deposit_date' | 'payment_date' | 'created_date' | undefined) => void;
}

export const CashNormsFilters: React.FC<CashNormsFiltersProps> = ({ 
  searchTerm, 
  onSearchChange,
  month,
  onMonthChange,
  year,
  onYearChange,
  filterField,
  onFilterFieldChange
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search receipts (loan no, customer, mobile, branch, etc.)..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select
              value={filterField || 'none'}
              onValueChange={(val) => onFilterFieldChange(val === 'none' ? undefined : val as 'deposit_date' | 'payment_date' | 'created_date')}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select date filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Date Filter</SelectItem>
                <SelectItem value="deposit_date">Deposit Date</SelectItem>
                <SelectItem value="payment_date">Payment Date</SelectItem>
                <SelectItem value="created_date">Created Date</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={month?.toString() || 'all'}
              onValueChange={(val) => onMonthChange(val === 'all' ? undefined : parseInt(val))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value.toString()}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={year?.toString() || 'all'}
              onValueChange={(val) => onYearChange(val === 'all' ? undefined : parseInt(val))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
