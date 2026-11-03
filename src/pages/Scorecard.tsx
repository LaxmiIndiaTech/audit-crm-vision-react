import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { adminApi, ApiError, Branch, BranchInspectionData } from '@/lib/api';
import {
  ScorecardFilters,
  ScorecardBranchInfo,
  ScorecardMetrics,
  ScorecardScoreDistribution,
  ScorecardTable,
  ScorecardPointDetailsModal,
  SendInspectionReportModal,
} from '@/components/scorecard';

// DO NOT ADD NEW IMPORTS BELOW - ALL UI COMPONENTS ARE IN SEPARATE FILES

// Types
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
  immediateAction?: string;
}

// Date utilities
const formatDateForAPI = (month: string, year: string): string => {
  return `${year}-${month}-15`; // YYYY-MM-DD format (15th of month)
};

// Generate months (1-12)
const months = Array.from({ length: 12 }, (_, i) => {
  const monthNum = String(i + 1).padStart(2, '0');
  const label = new Date(2000, i, 1).toLocaleString(undefined, { month: 'short' });
  return { value: monthNum, label };
});

// Generate years (current year and 2 previous years)
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 3 }, (_, i) => {
  const yearValue = String(currentYear - i);
  return { value: yearValue, label: yearValue };
});



const Scorecard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isEmployee = user?.role === 'employee';

  // Branch state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Date state
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));

  // Inspection data state
  const [inspectionData, setInspectionData] = useState<BranchInspectionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Modal states
  const [sendReportModalOpen, setSendReportModalOpen] = useState(false);
  const [pointDetailsModalOpen, setPointDetailsModalOpen] = useState(false);
  const [selectedScorePoint, setSelectedScorePoint] = useState<ScorePoint | null>(null);
  
  // Load branches on mount
  useEffect(() => {
    loadBranches();
  }, []);

  // Load inspection data when filters change
  useEffect(() => {
    if (selectedBranchId && selectedMonth && selectedYear) {
      loadInspectionData(selectedBranchId, selectedMonth, selectedYear);
    }
  }, [selectedBranchId, selectedMonth, selectedYear]);

  // Set initial branch when branches are loaded
  useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      const defaultId = isEmployee && user?.branchId ? String(user.branchId) : String(branches[0].id);
      setSelectedBranchId(defaultId);
    }
  }, [branches, isEmployee, user?.branchId]);

  // Sync employee branch when user changes
  useEffect(() => {
    if (isEmployee && user?.branchId) {
      setSelectedBranchId(String(user.branchId));
    }
  }, [isEmployee, user?.branchId]);

  const loadBranches = async () => {
    try {
      setBranchesLoading(true);
      const response = await adminApi.getBranches({ per_page: 200 });
      const branchList = Array.isArray(response.data) ? response.data : response.data?.branches || [];
      setBranches(branchList);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load branches';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setBranchesLoading(false);
    }
  };

  const loadInspectionData = async (branchId: string, month: string, year: string) => {
    try {
      setLoading(true);
      const dateForAPI = formatDateForAPI(month, year);
      const response = await adminApi.getBranchInspection(branchId, dateForAPI);
      setInspectionData(response.data);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load inspection data';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      setInspectionData(null);
    } finally {
      setLoading(false);
    }
  };

  // Transform inspection data to score points
  const points = useMemo(() => {
    if (!inspectionData?.inspection_data) return [];
    const latestFeedback = inspectionData.latest_feedback;

    const list: ScorePoint[] = [];

    inspectionData.inspection_data.forEach((item: any, index: number) => {
      if (Array.isArray(item.checklist_items) && item.checklist_items.length > 0) {
        item.checklist_items.forEach((chk: any) => {
          const code = chk.code || `A.${index + 1}`;
          const matchesFeedback = latestFeedback?.feedback_thread?.score_point_code === code;
          list.push({
            code,
            section: chk.description || chk.section || item.section,
            marks_carry: Number(chk.marks_carry || 0),
            marks_obtained: Number(chk.marks_obtained || 0),
            percentage: Number(chk.percentage || 0),
            total_receipts: Number(chk.total_receipts || 0),
            scored_receipts: Number(chk.scored_receipts || 0),
            average_score: Number(chk.average_score || 0),
            visitorComment: chk.visitorComment || (matchesFeedback ? latestFeedback?.feedback_thread?.visitor_comment || '' : ''),
            lastReply: chk.lastReply || (matchesFeedback ? latestFeedback?.last_reply?.text || '' : ''),
            immediateAction: chk.immediateAction || (matchesFeedback ? latestFeedback?.feedback_thread?.immediate_action || '' : ''),
          });
        });
      } else {
        const code = item.code || `A.${index + 1}`;
        const matchesFeedback = latestFeedback?.feedback_thread?.score_point_code === code;
        list.push({
          code,
          section: item.section,
          marks_carry: Number(item.marks_carry || 0),
          marks_obtained: Number(item.marks_obtained || 0),
          percentage: Number(item.percentage || 0),
          total_receipts: Number(item.total_receipts || 0),
          scored_receipts: Number(item.scored_receipts || 0),
          average_score: Number(item.average_score || 0),
          visitorComment: item.visitorComment || (matchesFeedback ? latestFeedback?.feedback_thread?.visitor_comment || '' : ''),
          lastReply: item.lastReply || (matchesFeedback ? latestFeedback?.last_reply?.text || '' : ''),
          immediateAction: item.immediateAction || (matchesFeedback ? latestFeedback?.feedback_thread?.immediate_action || '' : ''),
        });
      }
    });

    return list;
  }, [inspectionData]);

  // Calculate totals
  const totalCarry = points.reduce((sum, p) => sum + p.marks_carry, 0);
  const totalObtain = points.reduce((sum, p) => sum + p.marks_obtained, 0);
  const totalPercent = totalCarry === 0 ? 0 : Math.round((totalObtain / totalCarry) * 100);

  // Event handlers
  const handleExportPDF = async () => {
    if (!selectedBranchId || !selectedMonth || !selectedYear) {
      toast({
        title: 'Error',
        description: 'Please select a branch and date to export',
        variant: 'destructive',
      });
      return;
    }

    try {
      setExporting(true);
      const dateForAPI = formatDateForAPI(selectedMonth, selectedYear);
      const blob = await adminApi.exportBranchInspectionPDF(selectedBranchId, dateForAPI);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const branchName = branches.find((b) => String(b.id) === selectedBranchId)?.branch_name || 'Branch';
      link.download = `${branchName.replace(/\s+/g, '_')}_Inspection_${selectedYear}-${selectedMonth}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'PDF exported successfully',
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to export PDF';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const handleOpenPointDetails = (code: string) => {
    const point = points.find((p) => p.code === code);
    if (point) {
      setSelectedScorePoint(point);
      setPointDetailsModalOpen(true);
    }
  };

  const handleRefreshData = () => {
    loadInspectionData(selectedBranchId, selectedMonth, selectedYear);
  };

  const selectedBranchName = branches.find((b) => String(b.id) === selectedBranchId)?.branch_name || 'Branch';

  return (
    <div className="space-y-6">
      <Card className="crm-card">
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Scorecard</CardTitle>
              <CardDescription>Branch & date wise inspection performance and checklist details</CardDescription>
            </div>
            <ScorecardFilters
              selectedBranchId={selectedBranchId}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onBranchChange={setSelectedBranchId}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
              branches={branches}
              branchesLoading={branchesLoading}
              months={months}
              years={years}
              isEmployee={isEmployee}
              onExportPDF={handleExportPDF}
              onSendReport={() => setSendReportModalOpen(true)}
              disabledExport={!inspectionData || exporting || loading}
              disabledSendReport={!inspectionData || loading}
              exportingPDF={exporting}
            />
          </div>

          <ScorecardBranchInfo inspectionData={inspectionData} />
        </CardHeader>

        <CardContent className="space-y-6">
          <ScorecardMetrics inspectionData={inspectionData} />

          <ScorecardTable
            points={points}
            loading={loading}
            selectedBranchId={selectedBranchId}
            totalCarry={totalCarry}
            totalObtain={totalObtain}
            totalPercent={totalPercent}
            onRowClick={handleOpenPointDetails}
          />

          <ScorecardScoreDistribution inspectionData={inspectionData} />
        </CardContent>
      </Card>

      <ScorecardPointDetailsModal
        open={pointDetailsModalOpen}
        onOpenChange={setPointDetailsModalOpen}
        scorePoint={selectedScorePoint}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        branchId={selectedBranchId}
        branchName={selectedBranchName}
        onSave={handleRefreshData}
      />

      <SendInspectionReportModal
        open={sendReportModalOpen}
        onOpenChange={setSendReportModalOpen}
        branchId={selectedBranchId}
        branchName={selectedBranchName}
        date={formatDateForAPI(selectedMonth, selectedYear)}
      />
    </div>
  );
};

export default Scorecard;