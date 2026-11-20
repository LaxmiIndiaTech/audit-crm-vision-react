import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useValidatedRoles from '@/hooks/useValidatedRoles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  adminApi,
  ApiError,
  Branch,
  BranchInspectionData,
  InspectionChecklistItem,
  InspectionDataItem,
} from '@/lib/api';
import {
  Layers,
  UserCheck,
  Monitor,
  FolderLock,
  Home,
  ShieldAlert,
  Award,
  Edit3,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
  Percent,
  UserMinus,
  Smartphone,
  FileQuestion,
  Upload,
  FileSpreadsheet,
  Loader2,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScorecardPointDetailsModal } from '@/components/scorecard/ScorecardPointDetailsModal';

interface SectionMeta {
  code: string;
  title: string;
  carry: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECTION_METAS: Record<string, SectionMeta> = {
  B: {
    code: 'B',
    title: 'Operational Aspects and Application Awareness',
    carry: 6,
    description: 'Branch software usage (LOS, LMS, HRMS, CRM), product/credit policy display, non-refundable charge display, and employee ID card compliance.',
    icon: Layers,
  },
  C: {
    code: 'C',
    title: 'Customer Management',
    carry: 5,
    description: 'Upfront charges disclosure to customers, customer grievance resolution process, and property papers/NOC acknowledgement copies sent to HO.',
    icon: UserCheck,
  },
  D: {
    code: 'D',
    title: 'Display and Regulatory Requirements',
    carry: 10,
    description: 'Mandatory notice board displays (RBI license, grievance details, GSTIN, CIN, working hours, Fair Practice Code, POSH) and entrance signage.',
    icon: Monitor,
  },
  E: {
    code: 'E',
    title: 'Document Management',
    carry: 4,
    description: 'Registers (Courier, Grievance, NOC), safe custody of original property papers (OPP), PDC compliance, and unauthorized stamp removal.',
    icon: FolderLock,
  },
  F: {
    code: 'F',
    title: 'Admin & House Keeping',
    carry: 6,
    description: 'Lease/rent agreement copy, premises cleanliness, tobacco prohibition adherence, admin fixed assets verification, and scrap assets in AIMS.',
    icon: Home,
  },
  G: {
    code: 'G',
    title: 'Information Security',
    carry: 5,
    description: 'Blocked USB ports, system checks for unauthorized files, active antivirus definitions, and IT hardware reconciliation with HO records.',
    icon: ShieldAlert,
  },
  H: {
    code: 'H',
    title: 'TAT Login to Disbursement (Average Of Last Quarter)',
    carry: 5,
    description: 'Average days from loan application login to final disbursement. Tiers: <=10 days (100%), 11-20 days (75%), 21-30 days (50%), 31+ days (20%).',
    icon: Clock,
  },
  I: {
    code: 'I',
    title: 'Target Vs Achievement (Average Of Last Quarter)',
    carry: 15,
    description: 'Quarterly business achievement versus branch sales targets. Tiers: >90% (100%), 60-90% (75%), 40-60% (50%), <40% (20%).',
    icon: Target,
  },
  J: {
    code: 'J',
    title: 'Branch NPA % (Average Of Last Quarter)',
    carry: 15,
    description: 'Branch non-performing assets ratio and credit quality risk. Tiers: <=2% Low (100%), 2-5% Medium (50%), 5-8% High (20%), >8% Very High (0%).',
    icon: Percent,
  },
  K: {
    code: 'K',
    title: 'Manpower Attrition (Average Of Last Quarter)',
    carry: 10,
    description: 'Staff turnover rate during the audit quarter. Tiers: <5% (100%), 5-10% (50%), >=10% (0%).',
    icon: UserMinus,
  },
  L: {
    code: 'L',
    title: 'Application Utilization (AIMS & Visitor App)',
    carry: 5,
    description: 'Adoption and daily usage rates for internal apps (AIMS & Visitor App). Tiers: >80% (100%), 60-80% (75%), 40-60% (50%), 20-40% (25%), <=20% (0%).',
    icon: Smartphone,
  },
  M: {
    code: 'M',
    title: 'Loan File Query Resolution (Average Of Last Quarter)',
    carry: 10,
    description: 'Percentage of credit and underwriting queries resolved within TAT. Tiers: >80% (100%), 60-80% (75%), 40-60% (50%), <=40% (20%).',
    icon: FileQuestion,
  },
};

interface SectionAuditPageProps {
  sectionCode: 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M';
}

const SectionAuditPage: React.FC<SectionAuditPageProps> = ({ sectionCode }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { roles } = useValidatedRoles(true);
  const isAdmin = !!roles?.includes('admin');
  const isEmployee = !!roles?.includes('employee') && !isAdmin;
  const userBranchId = user?.branchId;
  const userBranchName = user?.branchName;

  const meta = SECTION_METAS[sectionCode] || {
    code: sectionCode,
    title: `Section ${sectionCode}`,
    carry: 0,
    description: 'Section Checkpoints & Inspection scoring',
    icon: Layers,
  };
  const IconComponent = meta.icon;

  // Branch state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Inspection data state
  const [inspectionData, setInspectionData] = useState<BranchInspectionData | null>(null);
  const [loading, setLoading] = useState(false);

  // TAT Specific State (Section H)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tatUploading, setTatUploading] = useState(false);
  const [tatSummary, setTatSummary] = useState<any>(null);
  const [tatRecords, setTatRecords] = useState<any[]>([]);
  const [tatLoading, setTatLoading] = useState(false);
  const [tatSearch, setTatSearch] = useState('');

  // Target vs Achievement Specific State (Section I)
  const targetFileInputRef = useRef<HTMLInputElement>(null);
  const disbursalFileInputRef = useRef<HTMLInputElement>(null);
  const [targetUploading, setTargetUploading] = useState(false);
  const [targetSummary, setTargetSummary] = useState<any>(null);
  const [targetLoans, setTargetLoans] = useState<any[]>([]);
  const [targetLoading, setTargetLoading] = useState(false);
  const [targetSearch, setTargetSearch] = useState('');

  // Scoring Modal state
  const [scoringModalOpen, setScoringModalOpen] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<{
    code: string;
    section: string;
    marks_carry?: number;
    marks_obtained?: number;
    visitorComment?: string;
    immediateAction?: string;
  } | null>(null);

  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentYear = String(new Date().getFullYear());

  // Load branches
  const loadBranches = async () => {
    try {
      setBranchesLoading(true);
      const response = await adminApi.getBranches({ per_page: 100 });
      const branchList = Array.isArray(response.data) ? response.data : response.data?.branches || [];
      setBranches(branchList);
      
      if (branchList.length > 0 && !selectedBranchId) {
        const defaultId = isEmployee && userBranchId ? String(userBranchId) : String(branchList[0].id);
        setSelectedBranchId(defaultId);
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load branches';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setBranchesLoading(false);
    }
  };

  // Load branch inspection data
  const loadBranchInspection = async (branchId: string) => {
    if (!branchId) return;
    try {
      setLoading(true);
      const response = await adminApi.getBranchInspection(branchId);
      setInspectionData(response.data);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load inspection data';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      setInspectionData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadTatData = async (branchId: string) => {
    if (!branchId || sectionCode !== 'H') return;
    try {
      setTatLoading(true);
      const [summaryRes, recordsRes] = await Promise.all([
        adminApi.getBranchTatSummary(branchId),
        adminApi.getTatRecords({ branch_id: branchId, per_page: 100 }),
      ]);
      setTatSummary(summaryRes?.data || null);
      setTatRecords(recordsRes?.data?.tat_records || []);
    } catch (e) {
      console.error('Failed to load TAT data', e);
    } finally {
      setTatLoading(false);
    }
  };

  const handleTatFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setTatUploading(true);
      const res = await adminApi.importTatRecords(file, selectedBranchId ? Number(selectedBranchId) : undefined);
      if (res?.status === 'success') {
        toast({
          title: 'TAT Sheet Uploaded & Scored Successfully!',
          description: `Processed ${res.data?.total_processed || 0} loan files across ${res.data?.branches_affected_count || 0} branches. H.1 score updated.`,
        });
        if (selectedBranchId) {
          await loadBranchInspection(selectedBranchId);
          await loadTatData(selectedBranchId);
        }
      } else {
        toast({
          title: 'Upload Failed',
          description: res?.message || 'Failed to process sheet',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Upload Error',
        description: err?.message || 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setTatUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const loadTargetData = async (branchId: string) => {
    if (!branchId || sectionCode !== 'I') return;
    try {
      setTargetLoading(true);
      const [summaryRes, loansRes] = await Promise.all([
        adminApi.getBranchTargetSummary(branchId),
        adminApi.getTargetLoans({ branch_id: branchId, per_page: 100 }),
      ]);
      setTargetSummary(summaryRes?.data || null);
      setTargetLoans(loansRes?.data?.loans || []);
    } catch (e) {
      console.error('Failed to load Target data', e);
    } finally {
      setTargetLoading(false);
    }
  };

  const handleTargetFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    sheetType?: 'branch_target' | 'book1_disbursal'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setTargetUploading(true);
      const res = await adminApi.importTargetRecords(
        file,
        selectedBranchId ? Number(selectedBranchId) : undefined,
        sheetType
      );
      if (res?.status === 'success') {
        const typeLabel =
          res.data?.type === 'book1_disbursal'
            ? 'Book1 Loan Disbursals'
            : 'Branch Target Sheet';
        toast({
          title: `${typeLabel} Uploaded & Scored Successfully!`,
          description: `Processed ${res.data?.total_processed || 0} records across ${res.data?.branches_affected_count || 0} branches. I.1 score updated.`,
        });
        if (selectedBranchId) {
          await loadBranchInspection(selectedBranchId);
          await loadTargetData(selectedBranchId);
        }
      } else {
        toast({
          title: 'Upload Failed',
          description: res?.message || 'Failed to process sheet',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Upload Error',
        description: err?.message || 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setTargetUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  useEffect(() => {
    loadBranches();
  }, [isEmployee]);

  useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      const defaultId = isEmployee && userBranchId ? String(userBranchId) : String(branches[0].id);
      setSelectedBranchId(defaultId);
    }
  }, [branches, isEmployee, userBranchId, selectedBranchId]);

  useEffect(() => {
    if (selectedBranchId) {
      loadBranchInspection(selectedBranchId);
      if (sectionCode === 'H') {
        loadTatData(selectedBranchId);
      } else if (sectionCode === 'I') {
        loadTargetData(selectedBranchId);
      }
    }
  }, [selectedBranchId, sectionCode]);

  // Find section item
  const sectionItem: InspectionDataItem | undefined = inspectionData?.inspection_data.find(
    (sec, idx) => sec.section_code === sectionCode || String.fromCharCode(65 + idx) === sectionCode || sec.section.startsWith(meta.title)
  );

  const checklistItems: InspectionChecklistItem[] = sectionItem?.checklist_items || [];
  const carryMarks = sectionItem ? sectionItem.marks_carry : meta.carry;
  const marksObtained = sectionItem ? sectionItem.marks_obtained : 0;
  const percentage = carryMarks > 0 ? Math.round((marksObtained / carryMarks) * 100) : 0;

  const handleOpenScoringModal = (item: InspectionChecklistItem) => {
    setSelectedCheckpoint({
      code: item.code,
      section: item.description || item.section,
      marks_carry: item.marks_carry,
      marks_obtained: item.marks_obtained,
      visitorComment: item.visitorComment,
      immediateAction: item.immediateAction,
    });
    setScoringModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Button>
            <span className="text-muted-foreground">•</span>
            <Badge variant="outline" className="font-mono text-xs bg-primary/10 text-primary border-primary/20">
              Section {sectionCode}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2.5 text-foreground">
            <IconComponent className="h-7 w-7 text-primary" />
            <span>{meta.title}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            {meta.description}
          </p>
        </div>

        {/* Branch Selector & Scorecard Shortcut */}
        <div className="flex items-center gap-3">
          {!isEmployee ? (
            <div className="w-full md:w-64">
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger aria-label="Select Branch" className="font-medium">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {branchesLoading ? (
                    <SelectItem value="loading" disabled>Loading branches...</SelectItem>
                  ) : branches.map(b => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.branch_name} ({b.branch_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Branch: <span className="font-semibold text-foreground">{userBranchName || '-'}</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 hidden sm:inline-flex"
            onClick={() => navigate('/scorecard')}
          >
            <span>Full Scorecard</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Summary Score Card */}
      <Card className="crm-card border shadow-sm">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="space-y-1">
              <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                Section Carry Marks
              </span>
              <div className="text-2xl font-bold text-foreground">
                {carryMarks.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">Marks</span>
              </div>
            </div>

            <div className="space-y-1 border-t md:border-t-0 md:border-l border-border/60 pt-3 md:pt-0 md:pl-4">
              <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                Marks Obtained by Branch
              </span>
              <div className="text-2xl font-bold text-primary">
                {marksObtained.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">/ {carryMarks.toFixed(1)}</span>
              </div>
            </div>

            <div className="space-y-1 border-t md:border-t-0 md:border-l border-border/60 pt-3 md:pt-0 md:pl-4">
              <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                Section Performance
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{percentage}%</span>
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold ${
                    percentage >= 75
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300'
                      : percentage > 0
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {percentage >= 75 ? 'Pass / High' : percentage > 0 ? 'Partial' : 'Pending'}
                </Badge>
              </div>
            </div>

            <div className="space-y-1 border-t md:border-t-0 md:border-l border-border/60 pt-3 md:pt-0 md:pl-4">
              <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                Branch Inspection Period
              </span>
              <div className="text-sm font-medium text-foreground truncate">
                {inspectionData?.branch_info.inspection_date || 'October 2026'}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {inspectionData?.branch_info.branch_name} • {inspectionData?.branch_info.company_name}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section H Specific: TAT Sheet Upload & Branch Average Days Analysis */}
      {sectionCode === 'H' && (
        <div className="space-y-4">
          <Card className="crm-card border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-background to-blue-500/5 shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">
                      LMS TAT Login to Disbursement Sheet Upload
                    </h3>
                    <Badge variant="outline" className="text-xs font-semibold bg-primary/10 text-primary border-primary/30">
                      Auto-Calculator (H.1)
                    </Badge>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground max-w-2xl">
                    LMS se nikali hui Loan TAT sheet (CSV ya Excel) upload karein. System har branch ke average days auto-calculate karke policy slab ke mutabiq <strong>Section H.1 score</strong> assign karega.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="font-semibold text-muted-foreground">Scoring Slabs:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium">
                      ≤10 Days = 5.0M (100%)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-medium">
                      11-20 Days = 3.75M (75%)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium">
                      21-30 Days = 2.5M (50%)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-medium">
                      &gt;30 Days = 1.0M (20%)
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleTatFileUpload}
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={tatUploading}
                    className="gap-2 font-semibold shadow-sm w-full md:w-auto"
                  >
                    {tatUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing &amp; Auto-scoring...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Upload TAT Sheet (Excel / CSV)</span>
                      </>
                    )}
                  </Button>
                  <span className="text-[11px] text-muted-foreground">
                    Columns: Loan No, Login Date, Disbursal Date, Branch, Days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branch Live TAT Stats Banner */}
          {tatSummary && tatSummary.total_loans > 0 ? (
            <Card className="crm-card border shadow-sm">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Total Loans Evaluated
                    </span>
                    <div className="text-2xl font-bold text-foreground mt-1">
                      {tatSummary.total_loans} <span className="text-xs font-normal text-muted-foreground">files</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Range: {tatSummary.min_days}d to {tatSummary.max_days}d
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Branch Average TAT
                    </span>
                    <div className="text-2xl font-bold text-primary mt-1">
                      {tatSummary.average_days} <span className="text-xs font-normal text-muted-foreground">Days</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] mt-0.5 font-semibold ${
                        tatSummary.average_days <= 10
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : tatSummary.average_days <= 20
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : tatSummary.average_days <= 30
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'bg-rose-50 text-rose-700 border-rose-300'
                      }`}
                    >
                      {tatSummary.average_days <= 10 ? 'Excellent TAT' : tatSummary.average_days <= 20 ? 'Good TAT' : 'Needs Optimization'}
                    </Badge>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Applicable Policy Slab
                    </span>
                    <div className="text-sm font-bold text-foreground mt-1 leading-tight">
                      {tatSummary.tier}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Weight: 5.0 Marks
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase">
                      Calculated H.1 Marks
                    </span>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                      {tatSummary.marks_obtained} <span className="text-xs font-normal text-muted-foreground">/ {tatSummary.carry_marks}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                      {tatSummary.percentage}% Score Awarded
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-4 rounded-lg border border-dashed text-center text-sm text-muted-foreground bg-muted/20">
              Is branch ke liye abhi koi TAT record uploaded nahi hai. Upar diye gaye button se TAT sheet upload karein taaki average days aur score auto-calculate ho sake.
            </div>
          )}

          {/* Branch Disbursed Loans Detailed Table */}
          {tatRecords.length > 0 && (
            <Card className="crm-card border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>Branch Disbursed Loans Detail ({tatRecords.length} Files)</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Uploaded sheet ke mutabiq is branch me login se disbursal tak ka record.
                    </CardDescription>
                  </div>
                  <div className="w-full sm:w-64">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Search loan account / customer..."
                        value={tatSearch}
                        onChange={(e) => setTatSearch(e.target.value)}
                        className="h-8 pl-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-80 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="text-xs">Loan Account No</TableHead>
                        <TableHead className="text-xs">Customer Name</TableHead>
                        <TableHead className="text-xs">Product</TableHead>
                        <TableHead className="text-xs">Login Date</TableHead>
                        <TableHead className="text-xs">Disbursal Date</TableHead>
                        <TableHead className="text-xs text-right">TAT (Days)</TableHead>
                        <TableHead className="text-xs">Sourcing RM</TableHead>
                        <TableHead className="text-xs text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tatRecords
                        .filter(
                          (r) =>
                            !tatSearch ||
                            r.loan_account_number?.toLowerCase().includes(tatSearch.toLowerCase()) ||
                            r.customer_name?.toLowerCase().includes(tatSearch.toLowerCase()) ||
                            r.product_name?.toLowerCase().includes(tatSearch.toLowerCase())
                        )
                        .map((r) => (
                          <TableRow key={r.id} className="text-xs hover:bg-muted/30">
                            <TableCell className="font-mono font-medium">{r.loan_account_number}</TableCell>
                            <TableCell className="font-medium">{r.customer_name}</TableCell>
                            <TableCell className="text-muted-foreground">{r.product_name}</TableCell>
                            <TableCell>{r.login_date}</TableCell>
                            <TableCell>{r.disbursal_date}</TableCell>
                            <TableCell className="text-right">
                              <span
                                className={`px-2 py-0.5 rounded font-bold ${
                                  Number(r.days) <= 10
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : Number(r.days) <= 20
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    : Number(r.days) <= 30
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {r.days}d
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {r.sourcing_rm_name || r.sourcing_rm_id || '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="text-[10px]">
                                {r.loan_status || 'Active'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Section I Specific: Target vs Achievement & Book1 Disbursals Analysis */}
      {sectionCode === 'I' && (
        <div className="space-y-4">
          <Card className="crm-card border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-background to-blue-500/5 shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">
                      Target Vs Achievement &amp; Book1 Disbursal Upload
                    </h3>
                    <Badge variant="outline" className="text-xs font-semibold bg-primary/10 text-primary border-primary/30">
                      Auto-Calculator (I.1)
                    </Badge>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground max-w-2xl">
                    Branch target sheet (AMJ targets) ya Book1 loan disbursal sheet upload karein. System har branch ka actual disbursement calculate karke target se match karega aur <strong>Section I.1 score (15M Carry)</strong> assign karega.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="font-semibold text-muted-foreground">Scoring Slabs:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium">
                      &gt;90% = 15.0M (100%)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-medium">
                      60%-90% = 11.25M (75%)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium">
                      40%-60% = 7.5M (50%)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-medium">
                      &lt;40% = 3.0M (20%)
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  <input
                    type="file"
                    ref={targetFileInputRef}
                    onChange={(e) => handleTargetFileUpload(e, 'branch_target')}
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={disbursalFileInputRef}
                    onChange={(e) => handleTargetFileUpload(e, 'book1_disbursal')}
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                  />
                  <Button
                    onClick={() => targetFileInputRef.current?.click()}
                    disabled={targetUploading}
                    variant="outline"
                    className="gap-2 font-semibold shadow-sm text-xs"
                  >
                    {targetUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>Upload Target Sheet</span>
                  </Button>
                  <Button
                    onClick={() => disbursalFileInputRef.current?.click()}
                    disabled={targetUploading}
                    className="gap-2 font-semibold shadow-sm text-xs"
                  >
                    {targetUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>Upload Book1 Disbursals</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branch Live Target vs Achievement Stats Banner */}
          {targetSummary && (
            <Card className="crm-card border shadow-sm">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Branch Target
                    </span>
                    <div className="text-xl font-bold text-foreground mt-1">
                      ₹{Number(targetSummary.target_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Quarter Target
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Total Disbursed
                    </span>
                    <div className="text-xl font-bold text-primary mt-1">
                      ₹{Number(targetSummary.disbursed_amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {targetSummary.total_loans || 0} loan file(s)
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Achievement %
                    </span>
                    <div className="text-2xl font-bold text-foreground mt-1">
                      {targetSummary.achievement_percentage}%
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] mt-0.5 font-semibold ${
                        targetSummary.achievement_percentage >= 90
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : targetSummary.achievement_percentage >= 60
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : targetSummary.achievement_percentage >= 40
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'bg-rose-50 text-rose-700 border-rose-300'
                      }`}
                    >
                      {targetSummary.achievement_percentage >= 90
                        ? 'Target Achieved'
                        : targetSummary.achievement_percentage >= 60
                        ? 'Good Performance'
                        : 'Below Target'}
                    </Badge>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Applicable Policy Slab
                    </span>
                    <div className="text-sm font-bold text-foreground mt-1 leading-tight">
                      {targetSummary.tier}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Slab: {targetSummary.percentage}% marks
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 col-span-2 md:col-span-1">
                    <span className="text-xs font-semibold text-primary uppercase">
                      Marks Obtained
                    </span>
                    <div className="text-2xl font-black text-primary mt-1">
                      {Number(targetSummary.marks_obtained || 0).toFixed(2)}{' '}
                      <span className="text-xs font-semibold text-muted-foreground">/ 15.00 M</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Auto-synced in Scorecard
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Book1 Loans List for this Branch */}
          {targetLoans && targetLoans.length > 0 && (
            <Card className="crm-card border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span>Book1 Disbursed Loans ({targetLoans.length})</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Uploaded Book1 sheet ke mutabiq is branch ke individual loan disbursals.
                    </CardDescription>
                  </div>
                  <div className="w-full sm:w-64">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Search loan account / customer..."
                        value={targetSearch}
                        onChange={(e) => setTargetSearch(e.target.value)}
                        className="h-8 pl-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-80 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="text-xs">Loan Account No</TableHead>
                        <TableHead className="text-xs">Customer Name</TableHead>
                        <TableHead className="text-xs">Product</TableHead>
                        <TableHead className="text-xs">Disbursal Date</TableHead>
                        <TableHead className="text-xs text-right">Disbursal Amount</TableHead>
                        <TableHead className="text-xs">Month</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {targetLoans
                        .filter(
                          (r) =>
                            !targetSearch ||
                            r.loan_account_number?.toLowerCase().includes(targetSearch.toLowerCase()) ||
                            r.customer_name?.toLowerCase().includes(targetSearch.toLowerCase()) ||
                            r.product_name?.toLowerCase().includes(targetSearch.toLowerCase())
                        )
                        .map((r) => (
                          <TableRow key={r.id} className="text-xs hover:bg-muted/30">
                            <TableCell className="font-mono font-medium">{r.loan_account_number}</TableCell>
                            <TableCell className="font-medium">{r.customer_name || '—'}</TableCell>
                            <TableCell className="text-muted-foreground">{r.product_name || 'Loan'}</TableCell>
                            <TableCell>{r.disbursal_date || '—'}</TableCell>
                            <TableCell className="text-right font-bold text-foreground">
                              ₹{Number(r.disbursal_amount || 0).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {r.disbursal_month || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Checkpoints Scoring Table */}
      <Card className="crm-card border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Audit Checkpoints & Scoring</CardTitle>
              <CardDescription>
                HO auditor observation likhein aur branch ko number assign karein.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="font-medium text-xs">
              {checklistItems.length} Checkpoints Configured
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-16 text-center">Code</TableHead>
                  <TableHead className="min-w-[320px]">Checkpoint Requirement / Scope Point</TableHead>
                  <TableHead className="text-right w-24">Carry</TableHead>
                  <TableHead className="text-right w-28">Obtained</TableHead>
                  <TableHead className="text-right w-24">% Score</TableHead>
                  <TableHead className="text-right w-44">HO Scoring Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Loading Section {sectionCode} checkpoints...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : checklistItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No checkpoints found for Section {sectionCode}. Please select a branch or verify seeders.
                    </TableCell>
                  </TableRow>
                ) : (
                  checklistItems.map((item) => {
                    const itemPct = item.marks_carry > 0 ? Math.round((item.marks_obtained / item.marks_carry) * 100) : 0;
                    const hasMarks = item.marks_obtained > 0;

                    return (
                      <TableRow key={item.code} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono text-xs font-semibold bg-background">
                            {item.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="space-y-1.5">
                            <p className="text-sm font-medium leading-relaxed text-foreground">
                              {item.description || item.section}
                            </p>
                            {item.visitorComment && (
                              <div className="text-xs text-muted-foreground flex items-start gap-1 p-2 bg-muted/40 rounded border border-border/40">
                                <span className="font-semibold text-primary shrink-0">HO Auditor Remark:</span>
                                <span>{item.visitorComment}</span>
                              </div>
                            )}
                            {item.immediateAction && (
                              <div className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1 p-2 bg-amber-500/10 rounded border border-amber-300/40">
                                <span className="font-semibold shrink-0">Immediate Action:</span>
                                <span>{item.immediateAction}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-muted-foreground">
                          {item.marks_carry.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`inline-block font-semibold px-2.5 py-1 rounded text-xs ${
                              hasMarks
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {item.marks_obtained.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-xs font-medium text-muted-foreground">{itemPct}%</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={hasMarks ? 'outline' : 'default'}
                            className={`h-8 gap-1.5 text-xs font-medium ${
                              !hasMarks ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''
                            }`}
                            onClick={() => handleOpenScoringModal(item)}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>{hasMarks ? 'Change Marks' : 'Number Dein (Score)'}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}

                {/* Subtotal Row */}
                <TableRow className="font-bold bg-muted/60 text-foreground border-t-2">
                  <TableCell colSpan={2} className="py-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span>Total Marks for Section {sectionCode}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-base">{carryMarks.toFixed(1)}</TableCell>
                  <TableCell className="text-right text-base text-primary">{marksObtained.toFixed(1)}</TableCell>
                  <TableCell className="text-right text-base">{percentage}%</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-xs font-semibold">
                      {percentage >= 75 ? 'Satisfactory' : 'Action Needed'}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal for HO Auditor to Assign Marks, Comment, and Action */}
      <ScorecardPointDetailsModal
        open={scoringModalOpen}
        onOpenChange={setScoringModalOpen}
        scorePoint={selectedCheckpoint}
        selectedMonth={currentMonth}
        selectedYear={currentYear}
        branchId={selectedBranchId}
        branchName={branches.find((b) => String(b.id) === selectedBranchId)?.branch_name}
        onSave={() => {
          if (selectedBranchId) {
            loadBranchInspection(selectedBranchId);
          }
        }}
      />
    </div>
  );
};

export default SectionAuditPage;
