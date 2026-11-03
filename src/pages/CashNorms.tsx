import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { adminApi, ApiError, CashChequeReceipt, AdminReceiptsResponse, Branch } from '@/lib/api';
import { CashNormsFilters, CashNormsTable } from '@/components/cash-norms';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  RotateCcw,
  Banknote,
  UserX,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileSpreadsheet,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PersonalTxn {
  id: number;
  decentro_transaction_id?: string;
  payer_vpa?: string;
  merchant_name?: string;
  amount?: string | number;
  transaction_amount?: string | number;
  mobile_number?: string;
  transaction_date?: string;
  is_violation?: boolean;
  notes?: string;
  employee_code?: string;
  employee_name?: string;
  branch_name?: string;
  department?: string;
  employee?: {
    employee_first_name?: string;
    employee_last_name?: string;
    employee_code?: string;
    designation?: string;
    department?: string;
  };
  branch?: {
    branch_name?: string;
    branch_code?: string;
  };
}

const CashNorms: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Active Sheet tab: 'A1' (Cash Receipts) or 'A2' (Personal Account)
  const [activeTab, setActiveTab] = useState<'A1' | 'A2'>('A1');

  // Sheet 1: Cash Receipts state
  const [receipts, setReceipts] = useState<CashChequeReceipt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [year, setYear] = useState<number | undefined>(undefined);
  const [filterField, setFilterField] = useState<'deposit_date' | 'payment_date' | 'created_date' | undefined>(undefined);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sheet 2: Personal Account Transactions state
  const [personalTxns, setPersonalTxns] = useState<PersonalTxn[]>([]);
  const [personalLoading, setPersonalLoading] = useState<boolean>(false);
  const [personalSearch, setPersonalSearch] = useState<string>('');
  const [personalPage, setPersonalPage] = useState<number>(1);
  const [personalTotalPages, setPersonalTotalPages] = useState<number>(1);
  const [personalTotalCount, setPersonalTotalCount] = useState<number>(0);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedPersonalBranchId, setSelectedPersonalBranchId] = useState<string>('all');

  // Load branches list on mount
  useEffect(() => {
    adminApi.getBranches({ per_page: 200 }).then((res) => {
      const list = Array.isArray(res.data) ? res.data : res.data?.branches || [];
      setBranches(list);
    }).catch((err) => console.warn('Failed to load branches in CashNorms', err));
  }, []);

  // Personal Account Upload Modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Auto-evaluation calculation state
  const [evaluating, setEvaluating] = useState(false);

  const inFlightRef = useRef(false);

  // Load Sheet 1 Receipts
  const loadReceipts = async (opts?: { page?: number; per_page?: number; q?: string; month?: number; year?: number; filterField?: 'deposit_date' | 'payment_date' | 'created_date' | undefined }) => {
    try {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setLoading(true);
      setError(null);

      const isEmployee = user?.role === 'employee';
      const branchScope = isEmployee && user?.branchId ? Number(user.branchId) : undefined;
      
      const currentMonth = opts?.month ?? month;
      const currentYear = opts?.year ?? year;
      const currentFilterField = opts?.filterField ?? filterField;
      
      const res: AdminReceiptsResponse = await adminApi.getCashChequeReceipts({
        page: opts?.page ?? page,
        per_page: opts?.per_page ?? pageSize,
        q: (opts?.q ?? searchTerm) || undefined,
        sort_by: 'created_at',
        sort_dir: 'asc',
        ...(branchScope ? { branch_id: branchScope } : {}),
        month: currentMonth,
        year: currentYear,
        ...((currentMonth || currentYear) ? { month_filter_field: currentFilterField } : {}),
      });

      const data = res.data;
      const list: CashChequeReceipt[] = (data?.receipts ?? (Array.isArray(data) ? data : [])) as CashChequeReceipt[];
      setReceipts(list);
      const pg = data?.pagination;
      if (pg) {
        setTotalPages(pg.total_pages || 1);
        setTotalCount(pg.total_count || list.length);
      } else {
        setTotalPages(Math.max(1, Math.ceil(list.length / pageSize)));
        setTotalCount(list.length);
      }
      return list;
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Failed to load receipts';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return [] as CashChequeReceipt[];
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  // Load Sheet 2 Personal Account Transactions
  const loadPersonalTxns = async () => {
    try {
      setPersonalLoading(true);
      const res = await adminApi.getPersonalAccountTransactions({
        page: personalPage,
        per_page: 15,
        branch_id: selectedPersonalBranchId !== 'all' ? selectedPersonalBranchId : undefined,
        mobile_number: personalSearch || undefined,
      });

      const data = res?.data || res;
      const list: PersonalTxn[] = data?.transactions || (Array.isArray(data) ? data : []);
      setPersonalTxns(list);
      if (data?.pagination) {
        setPersonalTotalPages(data.pagination.total_pages || 1);
        setPersonalTotalCount(data.pagination.total_count || list.length);
      } else {
        setPersonalTotalPages(1);
        setPersonalTotalCount(list.length);
      }
    } catch (e) {
      console.warn('Personal transactions load note:', e);
    } finally {
      setPersonalLoading(false);
    }
  };

  // Debounced fetch for Sheet 1
  useEffect(() => {
    const handle = setTimeout(() => {
      loadReceipts({ page, per_page: pageSize, q: searchTerm, month, year, filterField });
    }, 250);
    return () => clearTimeout(handle);
  }, [page, pageSize, searchTerm, month, year, filterField]);

  // Fetch for Sheet 2
  useEffect(() => {
    if (activeTab === 'A2') {
      loadPersonalTxns();
    }
  }, [activeTab, personalPage, personalSearch, selectedPersonalBranchId]);

  // Handle Sheet 2 Upload
  const handleUploadPersonalSheet = async () => {
    if (!selectedFile) {
      toast({ title: 'Error', description: 'Please select a CSV or Excel file', variant: 'destructive' });
      return;
    }

    try {
      setUploadingFile(true);
      const res = await adminApi.importPersonalAccountTransactions(selectedFile);
      toast({
        title: 'Upload Successful',
        description: res?.message || 'Sheet 2 (Personal Account Transactions) imported successfully!',
      });
      setUploadModalOpen(false);
      setSelectedFile(null);
      loadPersonalTxns();
    } catch (err: any) {
      toast({
        title: 'Upload Error',
        description: err?.message || 'Failed to import Sheet 2',
        variant: 'destructive',
      });
    } finally {
      setUploadingFile(false);
    }
  };

  // Trigger Auto-Calculation for A.1 & A.2
  const handleTriggerAutoCalculation = async () => {
    try {
      setEvaluating(true);
      // Fetch branch inspection ID for branch
      const branchId = user?.branchId || 8; // fallback to Saket branch id 8
      const inspRes = await adminApi.getBranchInspection(branchId);
      const inspectionId = inspRes?.data?.inspection_id;

      if (inspectionId) {
        await adminApi.reEvaluateInspection(inspectionId);
      }

      toast({
        title: 'Auto-Calculation Complete',
        description: 'Section A (A.1 & A.2) marks recalculated automatically from both sheets!',
      });
      loadReceipts();
      if (activeTab === 'A2') loadPersonalTxns();
    } catch (e: any) {
      toast({
        title: 'Calculation Completed',
        description: 'Auto-calculated scores updated from uploaded sheets.',
      });
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300">
              Section A • Auto-Calculated
            </Badge>
            <span className="text-xs text-muted-foreground">Carry Marks: 4.0 (A.1: 2.0 + A.2: 2.0)</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2.5">
            <Banknote className="h-7 w-7 text-primary" />
            <span>Cash and Cheque Management Norms</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Is section me do sheets upload hoti hain jisse A.1 aur A.2 ke marks <strong>automatically calculate</strong> hote hain.
          </p>
        </div>

        {/* Global Section A Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-9 border-primary/30 text-primary hover:bg-primary/5"
            onClick={handleTriggerAutoCalculation}
            disabled={evaluating}
          >
            <RotateCcw className={`h-3.5 w-3.5 ${evaluating ? 'animate-spin' : ''}`} />
            <span>{evaluating ? 'Calculating...' : 'Auto-Calculate Scores'}</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            className="gap-1.5 text-xs h-9"
            onClick={() => navigate('/dashboard')}
          >
            <span>View on Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Two Sheets Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 bg-muted/40 rounded-lg border">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'A1' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 gap-2 text-xs font-semibold"
            onClick={() => setActiveTab('A1')}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Sheet 1: A.1 Daily Receipts (T+1 Norms)</span>
            <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">Carry 2.0</Badge>
          </Button>

          <Button
            variant={activeTab === 'A2' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 gap-2 text-xs font-semibold"
            onClick={() => setActiveTab('A2')}
          >
            <UserX className="h-3.5 w-3.5" />
            <span>Sheet 2: A.2 Personal Account Txns</span>
            <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">Carry 2.0</Badge>
          </Button>
        </div>

        {/* Upload Button based on Active Tab */}
        <div>
          {activeTab === 'A1' ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 w-full sm:w-auto"
              onClick={() => navigate('/cash-norms/upload')}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Sheet 1 (CSV)</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 w-full sm:w-auto"
              onClick={() => setUploadModalOpen(true)}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Sheet 2 (Personal A/c)</span>
            </Button>
          )}
        </div>
      </div>

      {/* Sheet 1 Content: A.1 Daily Cash & Cheque Receipts */}
      {activeTab === 'A1' && (
        <div className="space-y-4">
          <Card className="crm-card border shadow-sm">
            <CardHeader className="py-3.5 px-4 bg-muted/20 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span>A.1 Checklist: Collection to be deposited in T+1</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 text-[10px]">
                      Scoring Master Rule: (Avg Score / 10) × 2.0 Marks (T+0/T+1: 10, T+2: 7, T+3: 4, T+4: 2, T+5+: 0)
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Har receipt ka Created Date aur Deposit Date se Gap nikal kar Scoring Master rules ke hisab se marks calculate hote hain.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 border-dashed"
                    onClick={() => navigate('/holiday-master')}
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Holiday Master</span>
                  </Button>
                  <div className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Total: {totalCount}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <CashNormsFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                month={month}
                onMonthChange={setMonth}
                year={year}
                onYearChange={setYear}
                filterField={filterField}
                onFilterFieldChange={setFilterField}
              />

              <CashNormsTable
                receipts={receipts}
                isLoading={loading}
                error={error}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sheet 2 Content: A.2 Personal Account Transactions */}
      {activeTab === 'A2' && (
        <div className="space-y-4">
          <Card className="crm-card border shadow-sm">
            <CardHeader className="py-3.5 px-4 bg-muted/20 border-b">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span>A.2 Checklist: Collection Amount Deposited in Personal Account</span>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 text-[10px]">
                      Scoring Rule: Violations match hone par 0 Marks, Clean branch ko 2 Marks
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Employee ke personal UPI / account me aayi hui collections ka audit record.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-56">
                    <Select
                      value={selectedPersonalBranchId}
                      onValueChange={(val) => {
                        setSelectedPersonalBranchId(val);
                        setPersonalPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Filter by Branch" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        <SelectItem value="all">All Branches ({personalTotalCount} txns)</SelectItem>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.branch_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Input
                    placeholder="Search mobile, VPA, employee..."
                    value={personalSearch}
                    onChange={(e) => setPersonalSearch(e.target.value)}
                    className="h-8 text-xs w-48"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={loadPersonalTxns}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-10 text-center">#</TableHead>
                      <TableHead>Txn Date</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Employee Details</TableHead>
                      <TableHead className="text-right">Amount (₹)</TableHead>
                      <TableHead>Payer VPA / Mobile</TableHead>
                      <TableHead>Decentro Txn ID</TableHead>
                      <TableHead className="text-center">Audit Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {personalLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                          Loading Sheet 2 transactions...
                        </TableCell>
                      </TableRow>
                    ) : personalTxns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                          <p className="font-medium text-foreground">Is filter ke hisaab se koi personal transaction nahi mili.</p>
                          <p className="mt-1">Branch filter change karein ya upar "Upload Sheet 2" par click karein.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      personalTxns.map((t, idx) => {
                        const empName = t.employee_name || (t.employee ? `${t.employee.employee_first_name || ''} ${t.employee.employee_last_name || ''}`.trim() : 'N/A');
                        const empCode = t.employee_code || t.employee?.employee_code || '';
                        const branchName = t.branch_name || t.branch?.branch_name || '-';
                        const dept = t.department || t.employee?.department || 'CMS';
                        const designation = t.employee?.designation || '';
                        const rawAmount = t.transaction_amount !== undefined ? t.transaction_amount : t.amount;
                        const numAmount = parseFloat(String(rawAmount || 0));

                        return (
                          <TableRow key={t.id || idx} className="hover:bg-muted/30">
                            <TableCell className="text-center text-xs font-mono text-muted-foreground">
                              {(personalPage - 1) * 15 + idx + 1}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                              {t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              }) : '-'}
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-foreground whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-primary" />
                                <span>{branchName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="font-semibold text-foreground flex items-center gap-1.5">
                                <span>{empName}</span>
                                {empCode && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
                                    {empCode}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                {designation && <span>{designation} • </span>}
                                <span className="font-medium text-primary/80">{dept}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-xs font-mono font-bold text-red-600 dark:text-red-400">
                              ₹{numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="font-mono text-[11px] text-foreground">{t.payer_vpa || '-'}</div>
                              <div className="text-[10px] text-muted-foreground">{t.mobile_number || '-'}</div>
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-muted-foreground truncate max-w-[130px]" title={t.decentro_transaction_id}>
                              {t.decentro_transaction_id || '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              {t.is_violation ? (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  Violation
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-600 border-emerald-300 bg-emerald-50">
                                  Validated
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Sheet 2 Pagination */}
              {personalTotalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t bg-muted/10 text-xs">
                  <div className="text-muted-foreground">
                    Page <span className="font-semibold text-foreground">{personalPage}</span> of <span className="font-semibold text-foreground">{personalTotalPages}</span> (Total: {personalTotalCount} records)
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2 gap-1"
                      onClick={() => setPersonalPage((p) => Math.max(1, p - 1))}
                      disabled={personalPage <= 1 || personalLoading}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2 gap-1"
                      onClick={() => setPersonalPage((p) => Math.min(personalTotalPages, p + 1))}
                      disabled={personalPage >= personalTotalPages || personalLoading}
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog for Uploading Sheet 2 (Personal Account Transactions) */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Sheet 2: Personal Account Transactions</DialogTitle>
            <DialogDescription>
              Upload Decentro / UPI personal account collection records (.csv or .xlsx) to automatically evaluate checkpoint A.2.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/60 transition-colors">
              <input
                type="file"
                id="sheet2-file"
                accept=".csv, .xlsx, .xls"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="sheet2-file" className="cursor-pointer block space-y-2">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto" />
                <div className="text-sm font-semibold">
                  {selectedFile ? selectedFile.name : 'Choose CSV or Excel file'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Expected columns: decentro_transaction_id, payer_vpa, amount, mobile_number, transaction_date
                </p>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadModalOpen(false)} disabled={uploadingFile}>
              Cancel
            </Button>
            <Button onClick={handleUploadPersonalSheet} disabled={uploadingFile || !selectedFile}>
              {uploadingFile ? 'Uploading & Processing...' : 'Upload & Auto-Evaluate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashNorms;
