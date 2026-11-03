import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useValidatedRoles from '@/hooks/useValidatedRoles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  adminApi,
  ApiError,
  DashboardStatsData,
  Branch,
  BranchInspectionData,
  InspectionChecklistItem
} from '@/lib/api';
import {
  Users,
  Building2,
  Map,
  MapPin,
  ChevronDown,
  ChevronRight,
  Edit3,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ListChecks,
} from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScorecardPointDetailsModal } from '@/components/scorecard/ScorecardPointDetailsModal';

const SECTION_NAV_LINKS: Record<string, string> = {
  A: '/cash-norms',
  B: '/operational-aspects',
  C: '/customer-management',
  D: '/display-regulatory',
  E: '/document-management',
  F: '/admin-housekeeping',
  G: '/information-security',
};

const AdminDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { roles } = useValidatedRoles(true);
  const isAdmin = !!roles?.includes('admin');
  const isEmployee = !!roles?.includes('employee') && !isAdmin;
  const userBranchId = user?.branchId;
  const userBranchName = user?.branchName;

  // Dashboard stats state
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Branch inspection state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [inspectionData, setInspectionData] = useState<BranchInspectionData | null>(null);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Expand / Collapse state for sections (Sections A to G all visible by default)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
  );

  // Filter state to focus on specific section or show all
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('ALL');

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

  // Load dashboard stats
  const loadDashboardStats = async () => {
    if (isEmployee) return; // Don't load stats for employees
    
    try {
      setStatsLoading(true);
      const response = await adminApi.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load dashboard statistics';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Load branches
  const loadBranches = async () => {
    try {
      setBranchesLoading(true);
      const response = await adminApi.getBranches({ per_page: 100 });
      const branchList = Array.isArray(response.data) ? response.data : response.data?.branches || [];
      setBranches(branchList);
      
      // Set default selected branch
      if (branchList.length > 0 && !selectedBranchId) {
        const defaultId = isEmployee && userBranchId ? String(userBranchId) : String(branchList[0].id);
        setSelectedBranchId(defaultId);
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load branches';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setBranchesLoading(false);
    }
  };

  // Load branch inspection data
  const loadBranchInspection = async (branchId: string) => {
    if (!branchId) return;
    
    try {
      setInspectionLoading(true);
      const response = await adminApi.getBranchInspection(branchId);
      setInspectionData(response.data);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load branch inspection data';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      setInspectionData(null);
    } finally {
      setInspectionLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadDashboardStats();
    loadBranches();
  }, [isEmployee]);

  // Set initial selected branch when branches are loaded
  useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      const defaultId = isEmployee && userBranchId ? String(userBranchId) : String(branches[0].id);
      setSelectedBranchId(defaultId);
    }
  }, [branches, isEmployee, userBranchId, selectedBranchId]);

  const selectedBranch = branches.find(b => String(b.id) === selectedBranchId);

  useEffect(() => {
    if (isEmployee && userBranchId) {
      setSelectedBranchId(String(userBranchId));
    }
  }, [isEmployee, userBranchId]);

  // Load inspection data when selected branch changes
  useEffect(() => {
    if (selectedBranchId) {
      loadBranchInspection(selectedBranchId);
    }
  }, [selectedBranchId]);

  // Calculate totals from inspection data
  const totalCarry = inspectionData?.inspection_data.reduce((s, x) => s + x.marks_carry, 0) || 0;
  const totalObtained = inspectionData?.inspection_data.reduce((s, x) => s + x.marks_obtained, 0) || 0;
  const percentScore = totalCarry === 0 ? 0 : Math.round((totalObtained / totalCarry) * 100);

  // Toggle single section expand/collapse
  const toggleSection = (secCode: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(secCode)) {
        next.delete(secCode);
      } else {
        next.add(secCode);
      }
      return next;
    });
  };

  // Toggle all sections
  const toggleAllSections = () => {
    if (!inspectionData?.inspection_data) return;
    const allCodes = inspectionData.inspection_data.map((_, i) => String.fromCharCode(65 + i));
    if (expandedSections.size >= allCodes.length) {
      setExpandedSections(new Set());
    } else {
      setExpandedSections(new Set(allCodes));
    }
  };

  // Open scoring modal for a checkpoint
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

  // Grade helper
  const getGradeInfo = (pct: number) => {
    if (pct >= 85) {
      return {
        label: 'Grade A+ (Outstanding)',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300',
      };
    }
    if (pct >= 70) {
      return {
        label: 'Grade A (Good)',
        badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300',
      };
    }
    if (pct >= 50) {
      return {
        label: 'Grade B (Average)',
        badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300',
      };
    }
    return {
      label: 'Grade C (Needs Improvement)',
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300',
    };
  };

  const gradeInfo = getGradeInfo(percentScore);

  // Filter sections according to activeSectionFilter
  const displaySections = useMemo(() => {
    if (!inspectionData?.inspection_data) return [];
    return inspectionData.inspection_data
      .map((sec, index) => ({
        ...sec,
        secCode: String.fromCharCode(65 + index),
        originalIndex: index,
      }))
      .filter((sec) => {
        if (activeSectionFilter === 'ALL') return true;
        return sec.secCode === activeSectionFilter;
      });
  }, [inspectionData, activeSectionFilter]);

  return (
    <div className="space-y-6">
      {/* Stats Grid (hide for employees) */}
      {!isEmployee && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="crm-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stats?.branches.label || 'Branches'}
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats ? (stats.branches.active || stats.branches.total) : '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.branches.description || 'Active / total branches'}
              </p>
            </CardContent>
          </Card>
          <Card className="crm-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stats?.states.label || 'States'}
              </CardTitle>
              <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats ? stats.states.total : '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.states.description || 'In master data'}
              </p>
            </CardContent>
          </Card>
          <Card className="crm-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stats?.cities.label || 'Cities'}
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats ? (stats.cities.mapped || stats.cities.total) : '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.cities.description || 'Mapped to states'}
              </p>
            </CardContent>
          </Card>
          <Card className="crm-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stats?.employees.label || 'Employees'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats ? (stats.employees.active || stats.employees.total) : '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.employees.description || 'Active users'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Branch Inspection Report Card & Scoring Console */}
      <Card className="crm-card border shadow-sm">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold">Branch Inspection Report Card</CardTitle>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                  HO Audit Console
                </Badge>
              </div>
              <CardDescription className="text-sm mt-0.5">
                Head Office auditor portal — Checkpoints inspect karein aur branch ko number/marks assign karein.
              </CardDescription>
            </div>
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
                      ) : branches.length === 0 ? (
                        <SelectItem value="no-branches" disabled>No branches available</SelectItem>
                      ) : branches.map(b => (
                        <SelectItem key={b.id} value={String(b.id)} className="cursor-pointer">
                          {b.branch_name} ({b.branch_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Viewing branch: <span className="font-semibold text-foreground">{userBranchName || selectedBranch?.branch_name || '-'}</span>
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

          {/* Branch metadata preview */}
          {inspectionLoading && (
            <div className="grid md:grid-cols-3 gap-4 text-sm mt-2">
              <div className="animate-pulse text-muted-foreground">Loading branch inspection details...</div>
            </div>
          )}
          {inspectionData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm pt-2 pb-1 border-y border-border/50">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Branch Name</p>
                <p className="font-semibold text-foreground">{inspectionData.branch_info.branch_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Company Name</p>
                <p className="font-medium text-foreground">{inspectionData.branch_info.company_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Inspection Date</p>
                <p className="font-medium text-foreground">{inspectionData.branch_info.inspection_date}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Inspection Officials</p>
                <p className="font-medium text-foreground">{inspectionData.branch_info.inspection_officials}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Branch Address</p>
                <p className="font-medium truncate text-foreground" title={inspectionData.branch_info.branch_address}>
                  {inspectionData.branch_info.branch_address || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">In-Charge & Code</p>
                <p className="font-medium text-foreground">{inspectionData.branch_info.in_charge_code || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">CM/ASM & Code</p>
                <p className="font-medium text-foreground">{inspectionData.branch_info.cm_asm_code || '-'}</p>
              </div>
            </div>
          )}

          {/* HO Audit Live Scoring Summary Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-gradient-to-r from-muted/50 to-muted/20 rounded-lg border">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Total Score:</span>
                <div className="text-lg font-bold text-foreground">
                  {totalObtained.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">/ {totalCarry.toFixed(1)} Marks</span>
                </div>
              </div>
              <div className="border-l border-border h-8" />
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Percentage:</span>
                <div className="text-lg font-bold text-primary">
                  {percentScore}%
                </div>
              </div>
              <div className="border-l border-border h-8" />
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold block">Audit Grading:</span>
                <Badge variant="outline" className={`mt-0.5 font-semibold text-xs ${gradeInfo.badgeClass}`}>
                  {gradeInfo.label}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={toggleAllSections}
              >
                <ListChecks className="h-3.5 w-3.5" />
                {inspectionData?.inspection_data && expandedSections.size >= inspectionData.inspection_data.length
                  ? 'Collapse All Sections'
                  : 'Expand All (A-G)'}
              </Button>
            </div>
          </div>

          {/* Section Filter Pills (A through G) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-border/40">
            <span className="text-xs font-semibold text-muted-foreground mr-1 shrink-0">View Section:</span>
            {[
              { code: 'ALL', label: 'All (A-G)' },
              { code: 'A', label: 'A. Cash & Cheque' },
              { code: 'B', label: 'B. Operational' },
              { code: 'C', label: 'C. Customer' },
              { code: 'D', label: 'D. Regulatory' },
              { code: 'E', label: 'E. Documents' },
              { code: 'F', label: 'F. Admin & HK' },
              { code: 'G', label: 'G. IT Security' },
            ].map(tab => (
              <Button
                key={tab.code}
                variant={activeSectionFilter === tab.code ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-2.5 shrink-0"
                onClick={() => {
                  setActiveSectionFilter(tab.code);
                  if (tab.code !== 'ALL') {
                    setExpandedSections(prev => new Set([...prev, tab.code]));
                  }
                }}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="min-w-[280px]">Section / Audit Checkpoints (A through G)</TableHead>
                  <TableHead className="text-right w-28">Marks Carry</TableHead>
                  <TableHead className="text-right w-32">Marks Obtained</TableHead>
                  <TableHead className="text-right w-24">% Score</TableHead>
                  <TableHead className="text-right w-52">HO Scoring Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspectionLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Inspection checkpoints load ho rahe hain...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : displaySections.length ? (
                  displaySections.map((sec) => {
                    const secCode = sec.secCode;
                    const isExpanded = expandedSections.has(secCode);
                    const checklistItems = sec.checklist_items || [];
                    const secPct = sec.marks_carry === 0 ? 0 : Math.round((sec.marks_obtained / sec.marks_carry) * 100);

                    return (
                      <React.Fragment key={secCode}>
                        {/* Parent Section Summary Row */}
                        <TableRow
                          className={`cursor-pointer transition-colors ${
                            isExpanded ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/40'
                          }`}
                          onClick={() => toggleSection(secCode)}
                        >
                          <TableCell className="text-center font-bold text-foreground">
                            <div className="flex items-center justify-center gap-1">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-primary" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span>{secCode}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">{sec.section}</span>
                              <Badge variant="secondary" className="text-[11px] px-1.5 py-0 font-normal">
                                {checklistItems.length} points
                              </Badge>
                              {secCode === 'A' ? (
                                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 font-semibold">
                                  Auto-Calculation (Sheet 1 & 2)
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 font-semibold">
                                  Manual Scoring
                                </Badge>
                              )}
                              {SECTION_NAV_LINKS[secCode] && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[11px] text-primary gap-1 px-1.5 hover:underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(SECTION_NAV_LINKS[secCode]);
                                  }}
                                >
                                  <span>Dedicated Page</span>
                                  <ArrowRight className="h-2.5 w-2.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{sec.marks_carry.toFixed(1)}</TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            {sec.marks_obtained.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className={`font-semibold text-xs ${
                                secPct >= 75
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300'
                                  : secPct > 0
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {secPct}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1 border-dashed"
                                onClick={() => toggleSection(secCode)}
                              >
                                <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                              </Button>
                              {SECTION_NAV_LINKS[secCode] && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 text-xs gap-1"
                                  onClick={() => navigate(SECTION_NAV_LINKS[secCode])}
                                >
                                  <span>Open</span>
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Collapsible Sub-Rows: Checkpoints under this section */}
                        {isExpanded && (
                          checklistItems.length === 0 ? (
                            <TableRow className="bg-muted/20">
                              <TableCell colSpan={6} className="text-center py-3 text-xs text-muted-foreground italic">
                                Is section me koi sub-checkpoints configured nahi hain.
                              </TableCell>
                            </TableRow>
                          ) : (
                            checklistItems.map((item) => {
                              const itemPct = item.marks_carry > 0 ? Math.round((item.marks_obtained / item.marks_carry) * 100) : 0;
                              const hasMarks = item.marks_obtained > 0;

                              return (
                                <TableRow key={item.code} className="bg-muted/25 hover:bg-muted/40 border-l-4 border-l-primary/60">
                                  <TableCell className="text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <Badge variant="outline" className="font-mono text-xs font-semibold bg-background">
                                        {item.code}
                                      </Badge>
                                      {secCode === 'A' ? (
                                        <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-300 px-1 py-0.5 rounded border border-blue-200">
                                          Auto
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300 px-1 py-0.5 rounded border border-amber-200">
                                          Manual
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2.5">
                                    <div className="space-y-1">
                                      <p className="text-sm font-medium leading-snug text-foreground">
                                        {item.description || item.section}
                                      </p>
                                      {item.visitorComment && (
                                        <div className="text-xs text-muted-foreground flex items-start gap-1">
                                          <span className="font-semibold text-primary shrink-0">HO Auditor Remark:</span>
                                          <span className="italic">{item.visitorComment}</span>
                                        </div>
                                      )}
                                      {item.immediateAction && (
                                        <div className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1">
                                          <span className="font-semibold shrink-0">Action Required:</span>
                                          <span>{item.immediateAction}</span>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-medium text-muted-foreground">
                                    {item.marks_carry.toFixed(1)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span
                                      className={`inline-block font-semibold px-2 py-0.5 rounded text-xs ${
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
                          )
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      {selectedBranchId ? 'No inspection data available' : 'Select a branch to view inspection data'}
                    </TableCell>
                  </TableRow>
                )}

                {/* Grand Total Row */}
                <TableRow className="font-bold bg-muted/60 text-foreground border-t-2">
                  <TableCell colSpan={2} className="py-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span>Total Process Audit Marks (Sections A through G)</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-base">{totalCarry.toFixed(1)}</TableCell>
                  <TableCell className="text-right text-base text-primary">{totalObtained.toFixed(1)}</TableCell>
                  <TableCell className="text-right text-base">{percentScore}%</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={`font-semibold text-xs ${gradeInfo.badgeClass}`}>
                      {gradeInfo.label}
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
        branchName={selectedBranch?.branch_name}
        onSave={() => {
          if (selectedBranchId) {
            loadBranchInspection(selectedBranchId);
          }
        }}
      />
    </div>
  );
};

export default AdminDashboard;
