import React from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileDown, Mail } from 'lucide-react';

interface ScorecardFiltersProps {
  selectedBranchId: string;
  selectedMonth: string;
  selectedYear: string;
  onBranchChange: (branchId: string) => void;
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
  branches: Array<{ id: number; branch_name: string }>;
  branchesLoading: boolean;
  months: Array<{ value: string; label: string }>;
  years: Array<{ value: string; label: string }>;
  isEmployee: boolean;
  onExportPDF: () => void;
  onSendReport: () => void;
  disabledExport: boolean;
  disabledSendReport: boolean;
  exportingPDF: boolean;
}

export const ScorecardFilters: React.FC<ScorecardFiltersProps> = ({
  selectedBranchId,
  selectedMonth,
  selectedYear,
  onBranchChange,
  onMonthChange,
  onYearChange,
  branches,
  branchesLoading,
  months,
  years,
  isEmployee,
  onExportPDF,
  onSendReport,
  disabledExport,
  disabledSendReport,
  exportingPDF,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
      {!isEmployee && (
        <div className="w-full md:w-52">
          <Select value={selectedBranchId} onValueChange={onBranchChange}>
            <SelectTrigger aria-label="Select Branch">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              {branchesLoading ? (
                <SelectItem value="loading" disabled>
                  Loading branches...
                </SelectItem>
              ) : branches.length === 0 ? (
                <SelectItem value="no-branches" disabled>
                  No branches available
                </SelectItem>
              ) : (
                branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.branch_name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="w-full md:w-40">
        <Select value={selectedMonth} onValueChange={onMonthChange}>
          <SelectTrigger aria-label="Select Month">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full md:w-28">
        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger aria-label="Select Year">
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y.value} value={y.value}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={onExportPDF}
        disabled={disabledExport}
        variant="outline"
        className="w-full md:w-auto"
      >
        <FileDown className="mr-2 h-4 w-4" />
        {exportingPDF ? 'Exporting...' : 'Export PDF'}
      </Button>
      <Button
        onClick={onSendReport}
        disabled={disabledSendReport}
        variant="outline"
        className="w-full md:w-auto"
      >
        <Mail className="mr-2 h-4 w-4" />
        Send Report
      </Button>
    </div>
  );
};
