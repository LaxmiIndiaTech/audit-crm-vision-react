import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { adminApi, ApiError } from '@/lib/api';
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  Building2,
  Users,
  CreditCard,
  Receipt,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface ScorePoint {
  code: string;
  section: string;
  marks_carry?: number;
  marks_obtained?: number;
  visitorComment?: string;
  immediateAction?: string;
}

interface ScorecardPointDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scorePoint: ScorePoint | null;
  selectedMonth: string;
  selectedYear: string;
  branchId: string;
  branchName?: string;
  onSave?: () => void;
}

interface PersonalTxn {
  id: number;
  merchant_name?: string;
  decentro_transaction_id?: string;
  transaction_date?: string;
  collection_type?: string;
  transaction_amount?: string | number;
  payer_vpa?: string;
  mobile_number?: string;
  employee_id?: number;
  employee_code?: string;
  employee_name?: string;
  branch_id?: number;
  branch_name?: string;
  department?: string;
  quarter?: string;
  financial_year?: string;
  is_violation?: boolean;
  remarks?: string;
  employee?: {
    id: number;
    employee_first_name?: string;
    employee_last_name?: string;
    employee_code?: string;
    designation?: string;
    department?: string;
    mobile_number?: string;
    email?: string;
  };
  branch?: {
    id: number;
    branch_name?: string;
    branch_code?: string;
  };
}

export const ScorecardPointDetailsModal: React.FC<ScorecardPointDetailsModalProps> = ({
  open,
  onOpenChange,
  scorePoint,
  selectedMonth,
  selectedYear,
  branchId,
  branchName,
  onSave,
}) => {
  const { toast } = useToast();
  const [marksObtained, setMarksObtained] = useState<string>('');
  const [visitorComment, setVisitorComment] = useState('');
  const [immediateAction, setImmediateAction] = useState('');
  const [saving, setSaving] = useState(false);

  // A.2 Specific State
  const isA2 = scorePoint?.code === 'A.2';
  const [transactions, setTransactions] = useState<PersonalTxn[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [txnSearch, setTxnSearch] = useState('');

  const carry = Number(scorePoint?.marks_carry ?? (isA2 ? 2 : 1));

  // Sync basic state on open
  useEffect(() => {
    if (scorePoint && open) {
      setMarksObtained(scorePoint.marks_obtained !== undefined ? String(scorePoint.marks_obtained) : '');
      setVisitorComment(scorePoint.visitorComment || '');
      setImmediateAction(scorePoint.immediateAction || '');
      setTxnSearch('');
    }
  }, [scorePoint, open]);

  // Load A.2 transactions for the specific selected branch
  useEffect(() => {
    if (open && isA2 && branchId) {
      loadBranchTransactions();
    }
  }, [open, isA2, branchId]);

  const loadBranchTransactions = async () => {
    try {
      setLoadingTxns(true);
      const res = await adminApi.getPersonalAccountTransactions({
        branch_id: branchId,
        per_page: 200,
      });
      const data = res?.data || res;
      const list: PersonalTxn[] = data?.transactions || (Array.isArray(data) ? data : []);
      setTransactions(list);

      // Auto update marks and observation: Ek bhi employee match par 0 marks, 0 match par 2 marks
      if (list.length === 0) {
        if (!scorePoint?.marks_obtained || scorePoint.marks_obtained === 0) {
          setMarksObtained('2.00');
        }
      } else {
        if (!marksObtained || marksObtained === '2' || marksObtained === '2.00') {
          setMarksObtained('0.00');
        }
      }
    } catch (err) {
      console.error('Failed to load branch A.2 transactions', err);
      toast({
        title: 'Transactions Load Error',
        description: 'Selected branch ke personal transactions load nahi ho paye.',
        variant: 'destructive',
      });
    } finally {
      setLoadingTxns(false);
    }
  };

  // Metrics calculation for A.2
  const { totalTxns, totalAmount, uniqueViolators, uniqueViolatorNames } = useMemo(() => {
    if (!transactions.length) {
      return { totalTxns: 0, totalAmount: 0, uniqueViolators: 0, uniqueViolatorNames: [] };
    }
    const total = transactions.reduce((sum, t) => sum + (parseFloat(String(t.transaction_amount || 0)) || 0), 0);
    const namesMap = new Map<string, string>();
    transactions.forEach((t) => {
      const code = t.employee_code || String(t.employee_id || '');
      const name = t.employee_name || (t.employee ? `${t.employee.employee_first_name || ''} ${t.employee.employee_last_name || ''}`.trim() : code);
      if (code && !namesMap.has(code)) {
        namesMap.set(code, name ? `${name} (${code})` : code);
      }
    });

    return {
      totalTxns: transactions.length,
      totalAmount: total,
      uniqueViolators: namesMap.size,
      uniqueViolatorNames: Array.from(namesMap.values()),
    };
  }, [transactions]);

  // Filtered transactions for search
  const filteredTxns = useMemo(() => {
    if (!txnSearch.trim()) return transactions;
    const q = txnSearch.toLowerCase();
    return transactions.filter((t) => {
      const empName = (t.employee_name || `${t.employee?.employee_first_name || ''} ${t.employee?.employee_last_name || ''}`).toLowerCase();
      const empCode = String(t.employee_code || '').toLowerCase();
      const mobile = String(t.mobile_number || '').toLowerCase();
      const vpa = String(t.payer_vpa || '').toLowerCase();
      const decentroId = String(t.decentro_transaction_id || '').toLowerCase();
      return (
        empName.includes(q) ||
        empCode.includes(q) ||
        mobile.includes(q) ||
        vpa.includes(q) ||
        decentroId.includes(q)
      );
    });
  }, [transactions, txnSearch]);

  const handleSave = async () => {
    if (!scorePoint || !branchId) return;

    let numMarks: number | undefined = undefined;
    if (marksObtained !== '') {
      const parsed = parseFloat(marksObtained);
      if (isNaN(parsed) || parsed < 0) {
        toast({
          title: 'Validation Error',
          description: `Kripya 0 se ${carry} ke beech valid number dalein.`,
          variant: 'destructive',
        });
        return;
      }
      if (parsed > carry) {
        numMarks = carry;
        setMarksObtained(String(carry));
        toast({
          title: 'Marks Adjusted',
          description: `Is checkpoint ke max marks ${carry} hain, isliye marks ${carry} set kiya gaya.`,
        });
      } else {
        numMarks = parsed;
      }
    }

    try {
      setSaving(true);
      const inspectionMonth = `${selectedYear}-${selectedMonth}`;
      const safeSection = scorePoint.section ? scorePoint.section.substring(0, 200) : 'General';

      await adminApi.createFeedbackThread(branchId, {
        score_point_code: scorePoint.code,
        section: safeSection,
        visitor_comment: visitorComment.trim() || undefined,
        immediate_action: immediateAction.trim() || undefined,
        inspection_month: inspectionMonth,
        marks_obtained: numMarks,
      } as any);

      toast({
        title: 'Success',
        description: `Checkpoint ${scorePoint.code} ke marks (${numMarks ?? 0}/${carry}) save ho gaye!`,
      });

      onOpenChange(false);
      onSave?.();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to save score and feedback';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const parsedMarks = parseFloat(marksObtained);
  const isOverCarry = !isNaN(parsedMarks) && parsedMarks > carry;
  const isCleanBranch = isA2 && totalTxns === 0 && !loadingTxns;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isA2 ? 'sm:max-w-4xl max-h-[92vh] flex flex-col p-6' : 'sm:max-w-lg'}>
        <DialogHeader className="pb-2 border-b">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>{scorePoint?.code}</span>
                <span className="text-muted-foreground font-normal">|</span>
                <span>{isA2 ? 'Collection Amount Deposited in Personal Account' : 'Audit Checkpoint Scoring'}</span>
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              {branchName && (
                <Badge variant="outline" className="text-xs bg-muted/60 flex items-center gap-1 font-semibold">
                  <Building2 className="w-3 h-3 text-primary" />
                  <span>{branchName}</span>
                </Badge>
              )}
              {isA2 ? (
                isCleanBranch ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>100% Compliant</span>
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{uniqueViolators} Violating Staff</span>
                  </Badge>
                )
              ) : (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                  Manual Score
                </Badge>
              )}
            </div>
          </div>
          <DialogDescription className="text-xs mt-1">
            {isA2
              ? `Selected Branch (${branchName || 'ID: ' + branchId}) ke liye A.2 personal UPI/bank collection transactions ka live audit view.`
              : 'Branch ko marks assign karein aur auditor observation note karein.'}
          </DialogDescription>
        </DialogHeader>

        {scorePoint && (
          <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
            {/* A.2 Specific UI */}
            {isA2 ? (
              <div className="space-y-4">
                {/* 4 Metric Badges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-muted/40 p-3 rounded-lg border">
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Carry Marks</p>
                    <p className="text-xl font-extrabold text-foreground mt-0.5">2.00</p>
                    <span className="text-[10px] text-muted-foreground">Max possible marks</span>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                    <p className="text-[11px] text-primary uppercase font-bold tracking-wider">Marks Obtained</p>
                    <p className={`text-xl font-extrabold mt-0.5 ${isCleanBranch ? 'text-emerald-600' : 'text-red-600'}`}>
                      {marksObtained !== '' ? Number(marksObtained).toFixed(2) : (isCleanBranch ? '2.00' : '0.00')} / 2.00
                    </p>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {isCleanBranch ? '100% Full Pass (0 Violations)' : 'Zero Tolerance: 0.00 Marks'}
                    </span>
                  </div>

                  <div className={`p-3 rounded-lg border ${totalTxns > 0 ? 'bg-amber-500/10 border-amber-300 dark:border-amber-700/50' : 'bg-muted/40'}`}>
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-amber-600" />
                      <span>Branch Txns</span>
                    </p>
                    <p className="text-xl font-extrabold text-foreground mt-0.5">{totalTxns}</p>
                    <span className="text-[10px] text-muted-foreground">
                      Total: ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className={`p-3 rounded-lg border ${uniqueViolators > 0 ? 'bg-red-500/10 border-red-300 dark:border-red-700/50' : 'bg-emerald-500/10 border-emerald-300 dark:border-emerald-700/50'}`}>
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      <span>Violating Staff</span>
                    </p>
                    <p className={`text-xl font-extrabold mt-0.5 ${uniqueViolators > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600'}`}>
                      {uniqueViolators}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {uniqueViolators > 0 ? 'Rule: 1+ staff = 0 Marks' : '0 Violations = 2 Marks'}
                    </span>
                  </div>
                </div>

                {/* Violating Alert Notice */}
                {totalTxns > 0 && (
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-lg p-3.5 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-red-900 dark:text-red-200 uppercase tracking-wide">
                        Zero Tolerance Policy (0 Marks Awarded)
                      </h4>
                      <p className="text-xs text-red-800/90 dark:text-red-300 mt-0.5 leading-relaxed">
                        Is branch me <span className="font-bold">{uniqueViolators} employee(s)</span> ka personal account / UPI QR me collection deposit hona match hua hai. Scoring policy ke hisaab se agar 1 bhi employee match karta hai to branch ko <span className="font-bold underline">0.00 / 2.00 Marks (Fail)</span> diye jaate hain.
                      </p>
                    </div>
                  </div>
                )}

                {/* Clean Branch Case */}
                {isCleanBranch && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                        Is branch me koi personal account transaction nahi mili hai!
                      </h4>
                      <p className="text-xs text-emerald-800/90 dark:text-emerald-300 mt-1 leading-relaxed">
                        Audit period ke dauran <span className="font-semibold">{branchName || 'is branch'}</span> me kisi bhi employee ke personal bank account ya UPI QR code me company ki collection deposit hone ka koi record nahi mila hai. Branch 100% compliant hai aur pure <span className="font-bold underline">2.00 / 2.00 Marks</span> award kiye gaye hain.
                      </p>
                    </div>
                  </div>
                )}

                {/* Violating Transactions Table for this Selected Branch */}
                {totalTxns > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Violating Transactions for {branchName || 'Selected Branch'} ({filteredTxns.length} records)</span>
                        </h4>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                        <Input
                          placeholder="Search employee, UPI, or Txn ID..."
                          value={txnSearch}
                          onChange={(e) => setTxnSearch(e.target.value)}
                          className="h-8 pl-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden bg-card">
                      <div className="max-h-[260px] overflow-y-auto">
                        <Table>
                          <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            <TableRow>
                              <TableHead className="w-10 text-center text-xs">#</TableHead>
                              <TableHead className="text-xs">Txn Date</TableHead>
                              <TableHead className="text-xs">Employee Details</TableHead>
                              <TableHead className="text-xs text-right">Amount (₹)</TableHead>
                              <TableHead className="text-xs">Payer VPA / Mobile</TableHead>
                              <TableHead className="text-xs">Decentro Txn ID</TableHead>
                              <TableHead className="text-xs text-center">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loadingTxns ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                                  Loading branch transactions...
                                </TableCell>
                              </TableRow>
                            ) : filteredTxns.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                                  Search match nahi mila.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredTxns.map((t, idx) => {
                                const empName = t.employee_name || (t.employee ? `${t.employee.employee_first_name || ''} ${t.employee.employee_last_name || ''}`.trim() : 'N/A');
                                const empCode = t.employee_code || t.employee?.employee_code || '-';
                                const designation = t.employee?.designation || '-';
                                const dept = t.department || t.employee?.department || 'CMS';
                                const formattedDate = t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                }) : '-';

                                return (
                                  <TableRow key={t.id || idx} className="hover:bg-muted/30">
                                    <TableCell className="text-center text-xs text-muted-foreground font-mono">
                                      {idx + 1}
                                    </TableCell>
                                    <TableCell className="text-xs whitespace-nowrap font-medium">
                                      {formattedDate}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                                        <span>{empName}</span>
                                        <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
                                          {empCode}
                                        </Badge>
                                      </div>
                                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                        <span>{designation}</span>
                                        <span>•</span>
                                        <span className="font-semibold text-primary/80">{dept}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-right font-mono font-bold text-red-600 dark:text-red-400">
                                      ₹{parseFloat(String(t.transaction_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      <div className="font-mono text-[11px] text-foreground">{t.payer_vpa || '-'}</div>
                                      <div className="text-[10px] text-muted-foreground">{t.mobile_number || '-'}</div>
                                    </TableCell>
                                    <TableCell className="text-[11px] font-mono text-muted-foreground truncate max-w-[140px]" title={t.decentro_transaction_id}>
                                      {t.decentro_transaction_id || '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-normal">
                                        Violation
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scoring Override & Auditor Feedback */}
                <div className="bg-muted/20 border rounded-lg p-3.5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Auditor Evaluation & Observation</span>
                    </h4>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Rule: 1 bhi employee match par 0 number, 0 match par 2 number
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <label className="text-xs font-semibold text-foreground">Assigned Marks (Out of {carry})</label>
                      <Input
                        type="number"
                        step="0.05"
                        min="0"
                        max={carry}
                        value={marksObtained}
                        onChange={(e) => setMarksObtained(e.target.value)}
                        placeholder={`0 se ${carry} ke beech marks`}
                        disabled={saving}
                        className="font-bold text-sm h-8 mt-1"
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-wrap items-center gap-2 pt-3 sm:pt-0">
                      <span className="text-xs text-muted-foreground mr-1">Quick Select:</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`h-7 text-xs px-3 font-semibold ${marksObtained === '0' || marksObtained === '0.00' ? 'bg-red-500/10 text-red-600 border-red-300' : ''}`}
                        onClick={() => setMarksObtained('0.00')}
                      >
                        0.00 (Fail - Violations Found)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`h-7 text-xs px-3 font-semibold ${marksObtained === '2' || marksObtained === '2.00' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300' : ''}`}
                        onClick={() => setMarksObtained('2.00')}
                      >
                        2.00 (Full Pass - Clean)
                      </Button>
                    </div>
                  </div>

                  {/* Auditor Visitor Comment */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Visitor / Auditor Comment</label>
                    <Textarea
                      value={visitorComment}
                      onChange={(e) => setVisitorComment(e.target.value)}
                      placeholder="Branch par inspection ke dauran kya mila..."
                      rows={2}
                      disabled={saving}
                      className="text-xs"
                    />
                  </div>

                  {/* Immediate Action */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Immediate Corrective Action</label>
                    <Textarea
                      value={immediateAction}
                      onChange={(e) => setImmediateAction(e.target.value)}
                      placeholder="Branch ko kya corrective action lena hai..."
                      rows={2}
                      disabled={saving}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Standard UI for Checkpoints other than A.2 */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded-lg border">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Checkpoint Code</p>
                    <p className="font-bold text-base text-primary font-mono">{scorePoint.code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Max Carry Marks</p>
                    <p className="font-bold text-base text-foreground">{carry} Marks</p>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Checkpoint Requirement</p>
                  <p className="font-medium text-xs leading-relaxed mt-1 p-2.5 bg-muted/20 rounded border border-border/50 text-foreground">
                    {scorePoint.section}
                  </p>
                </div>

                {/* Marks Input & Quick Selection Buttons */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold">Marks Obtained (Number Dein)</label>
                    <span className="text-xs font-medium text-muted-foreground">Range: 0 se {carry} Marks</span>
                  </div>

                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max={carry}
                    value={marksObtained}
                    onChange={(e) => setMarksObtained(e.target.value)}
                    placeholder={`0 se ${carry} ke beech marks daalein`}
                    disabled={saving}
                    className="font-bold text-base"
                  />

                  {isOverCarry && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Note: Aapne {parsedMarks} marks daale hain, is checkpoint ke max marks {carry} hain. Save par ye automatically {carry} set ho jayega.
                    </p>
                  )}

                  {/* Quick Preset Buttons / Policy Tier Calculation */}
                  <div className="pt-1">
                    <p className="text-xs text-muted-foreground font-semibold mb-1.5">Quick Select / Policy Tiers:</p>
                    
                    {/* Tier presets for Section H (TAT Login to Disb, 5 Marks) */}
                    {(scorePoint.code === 'H' || scorePoint.code === 'H.1') && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 hover:bg-emerald-500/20"
                          onClick={() => {
                            setMarksObtained('5.00');
                            if (!visitorComment) setVisitorComment('Average <= 10 days from login to disbursement in last quarter.');
                          }}
                        >
                          &le;10 Days (5.00 M | 100%)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted"
                          onClick={() => {
                            setMarksObtained('3.75');
                            if (!visitorComment) setVisitorComment('Average 11-20 days from login to disbursement.');
                          }}
                        >
                          11-20 Days (3.75 M | 75%)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted"
                          onClick={() => {
                            setMarksObtained('2.50');
                            if (!visitorComment) setVisitorComment('Average 21-30 days from login to disbursement.');
                          }}
                        >
                          21-30 Days (2.50 M | 50%)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted"
                          onClick={() => {
                            setMarksObtained('1.00');
                            if (!visitorComment) setVisitorComment('Average 31+ days from login to disbursement.');
                          }}
                        >
                          31+ Days (1.00 M | 20%)
                        </Button>
                      </div>
                    )}

                    {/* Tier presets for Section I (Target vs Achievement, 15 Marks) */}
                    {(scorePoint.code === 'I' || scorePoint.code === 'I.1') && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 hover:bg-emerald-500/20"
                          onClick={() => {
                            setMarksObtained('15.00');
                            if (!visitorComment) setVisitorComment('Achievement > 90% in last quarter.');
                          }}
                        >
                          &gt;90% (15.00 M | 100%)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted"
                          onClick={() => {
                            setMarksObtained('11.25');
                            if (!visitorComment) setVisitorComment('Achievement 60% to 90% in last quarter.');
                          }}
                        >
                          60-90% (11.25 M | 75%)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted"
                          onClick={() => {
                            setMarksObtained('7.50');
                            if (!visitorComment) setVisitorComment('Achievement 40% to 60% in last quarter.');
                          }}
                        >
                          40-60% (7.50 M | 50%)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted"
                          onClick={() => {
                            setMarksObtained('3.00');
                            if (!visitorComment) setVisitorComment('Achievement Below 40% in last quarter.');
                          }}
                        >
                          &lt;40% (3.00 M | 20%)
                        </Button>
                      </div>
                    )}

                    {/* Tier presets for Section J (Branch NPA %, 15 Marks) */}
                    {(scorePoint.code === 'J' || scorePoint.code === 'J.1') && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 hover:bg-emerald-500/20"
                          onClick={() => {
                            setMarksObtained('15.00');
                            if (!visitorComment) setVisitorComment('Branch NPA is <= 2% (Low Risk).');
                          }}
                        >
                          &le;2% Low (15.00 M | 100%)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted"
                          onClick={() => {
                            setMarksObtained('7.50');
                            if (!visitorComment) setVisitorComment('Branch NPA is 2% to 5% (Medium Risk).');
                          }}
                        >
                          2-5% Med (7.50 M | 50%)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted"
                          onClick={() => {
                            setMarksObtained('3.00');
                            if (!visitorComment) setVisitorComment('Branch NPA is 5% to 8% (High Risk).');
                          }}
                        >
                          5-8% High (3.00 M | 20%)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted text-red-600"
                          onClick={() => {
                            setMarksObtained('0.00');
                            if (!visitorComment) setVisitorComment('Branch NPA is > 8% (Very High Risk).');
                          }}
                        >
                          &gt;8% V.High (0.00 M | 0%)
                        </Button>
                      </div>
                    )}

                    {/* Tier presets for Section K (Manpower Attrition, 10 Marks) */}
                    {(scorePoint.code === 'K' || scorePoint.code === 'K.1') && (
                      <div className="grid grid-cols-3 gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 hover:bg-emerald-500/20"
                          onClick={() => {
                            setMarksObtained('10.00');
                            if (!visitorComment) setVisitorComment('Manpower attrition is < 5% in last quarter.');
                          }}
                        >
                          &lt;5% (10.00 M | 100%)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted"
                          onClick={() => {
                            setMarksObtained('5.00');
                            if (!visitorComment) setVisitorComment('Manpower attrition is 5% to 10% in last quarter.');
                          }}
                        >
                          5-10% (5.00 M | 50%)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted text-red-600"
                          onClick={() => {
                            setMarksObtained('0.00');
                            if (!visitorComment) setVisitorComment('Manpower attrition is >= 10% in last quarter.');
                          }}
                        >
                          &ge;10% (0.00 M | 0%)
                        </Button>
                      </div>
                    )}

                    {/* Tier presets for Section L (Application Utilization, 5 Marks) */}
                    {(scorePoint.code === 'L' || scorePoint.code === 'L.1') && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 hover:bg-emerald-500/20"
                          onClick={() => {
                            setMarksObtained('5.00');
                            if (!visitorComment) setVisitorComment('Application utilization > 80% (AIMS & Visitor App).');
                          }}
                        >
                          &gt;80% (5.00 M)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted"
                          onClick={() => {
                            setMarksObtained('3.75');
                            if (!visitorComment) setVisitorComment('Application utilization 60% to 80%.');
                          }}
                        >
                          60-80% (3.75 M)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted"
                          onClick={() => {
                            setMarksObtained('2.50');
                            if (!visitorComment) setVisitorComment('Application utilization 40% to 60%.');
                          }}
                        >
                          40-60% (2.50 M)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted"
                          onClick={() => {
                            setMarksObtained('1.25');
                            if (!visitorComment) setVisitorComment('Application utilization 20% to 40%.');
                          }}
                        >
                          20-40% (1.25 M)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted text-red-600"
                          onClick={() => {
                            setMarksObtained('0.00');
                            if (!visitorComment) setVisitorComment('Application utilization <= 20%.');
                          }}
                        >
                          &le;20% (0.00 M)
                        </Button>
                      </div>
                    )}

                    {/* Tier presets for Section M (Loan File Query Resolution, 10 Marks) */}
                    {(scorePoint.code === 'M' || scorePoint.code === 'M.1') && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 hover:bg-emerald-500/20"
                          onClick={() => {
                            setMarksObtained('10.00');
                            if (!visitorComment) setVisitorComment('Loan file query resolution > 80% in last quarter.');
                          }}
                        >
                          &gt;80% (10.00 M | 100%)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted"
                          onClick={() => {
                            setMarksObtained('7.50');
                            if (!visitorComment) setVisitorComment('Loan file query resolution 60% to 80%.');
                          }}
                        >
                          60-80% (7.50 M | 75%)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted"
                          onClick={() => {
                            setMarksObtained('5.00');
                            if (!visitorComment) setVisitorComment('Loan file query resolution 40% to 60%.');
                          }}
                        >
                          40-60% (5.00 M | 50%)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs hover:bg-muted"
                          onClick={() => {
                            setMarksObtained('2.00');
                            if (!visitorComment) setVisitorComment('Loan file query resolution <= 40%.');
                          }}
                        >
                          &le;40% (2.00 M | 20%)
                        </Button>
                      </div>
                    )}

                    {/* Standard Presets for Sections A to G */}
                    {!['H', 'H.1', 'I', 'I.1', 'J', 'J.1', 'K', 'K.1', 'L', 'L.1', 'M', 'M.1'].includes(scorePoint.code) && (
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2.5"
                          onClick={() => setMarksObtained('0')}
                        >
                          0 Marks (Fail)
                        </Button>
                        {carry > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2.5"
                            onClick={() => setMarksObtained(String((carry * 0.5).toFixed(1)))}
                          >
                            {(carry * 0.5).toFixed(1)} (Half)
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2.5 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                          onClick={() => setMarksObtained(String(carry))}
                        >
                          {carry} Marks (Full Pass)
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visitor Comment */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Auditor / Visitor Comment</label>
                  <Textarea
                    value={visitorComment}
                    onChange={(e) => setVisitorComment(e.target.value)}
                    placeholder="Branch par inspection ke dauran kya mila (e.g. register verified, ID card found, etc.)"
                    rows={2}
                    disabled={saving}
                  />
                </div>

                {/* Immediate Action */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Immediate Corrective Action</label>
                  <Textarea
                    value={immediateAction}
                    onChange={(e) => setImmediateAction(e.target.value)}
                    placeholder="Branch ya BM ko kya action lena hai (e.g. counter signature by BM, signage replace)"
                    rows={2}
                    disabled={saving}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-2 border-t mt-auto flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 font-semibold">
            {saving ? 'Saving...' : 'Save Score & Observation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
