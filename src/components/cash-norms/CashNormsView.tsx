import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Banknote, Loader2 } from "lucide-react";
import { adminApi, CashChequeReceipt } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const CashNormsView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { receipt?: CashChequeReceipt } };
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";

  const [receipt, setReceipt] = useState<CashChequeReceipt | null>(
    location.state?.receipt || null
  );
  const [loading, setLoading] = useState<boolean>(!location.state?.receipt);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchById = async () => {
      if (!id || receipt) return;
      try {
        setLoading(true);
        setError(null);
        // Fetch directly by ID
        const res = await adminApi.getCashChequeReceiptById(String(id));
        const rec = res.data;
        if (!cancelled) setReceipt(rec ?? null);
        if (!rec && !cancelled) setError("Receipt not found");
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load receipt");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchById();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (
      isEmployee &&
      user?.branchName &&
      receipt?.branch_name &&
      receipt.branch_name !== user.branchName
    ) {
      navigate("/cash-norms");
    }
  }, [isEmployee, user?.branchName, receipt?.branch_name, navigate]);

  const currency = (v: string | number | null | undefined) => {
    const n =
      typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : 0;
    if (isNaN(n)) return "0";
    return n.toLocaleString();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="responsive-heading">Cash & Cheque Receipt</h1>
          <p className="text-muted-foreground text-lg">
            Detailed view for the receipt ID: {id}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/cash-norms")}
          className="hover-lift"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Receipts
        </Button>
      </div>

      <Card className="crm-card-premium animate-slide-up">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                  <Banknote className="w-6 h-6 text-white" />
                </div>
                Receipt Details
              </CardTitle>
              <CardDescription className="text-base">
                Reference ID: {id}
              </CardDescription>
            </div>
            {receipt?.scoring_rule && (
              <div className="flex items-stretch gap-3">
                <div className="px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 min-w-[120px] text-center">
                  <p className="text-xs text-muted-foreground font-medium">
                    Score
                  </p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                    {receipt.scoring_rule.score}
                  </p>
                  <p className="text-sm font-semibold">
                    {receipt.scoring_rule.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && (
            <div className="py-8 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading receipt…
            </div>
          )}
          {error && !loading && (
            <div className="py-8 text-center text-destructive">{error}</div>
          )}
          {receipt && !loading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    Loan No
                  </p>
                  <p className="text-lg font-semibold">{receipt.loan_no}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    Customer
                  </p>
                  <p className="text-lg font-semibold">
                    {receipt.customer_name}{" "}
                    <span className="text-sm text-muted-foreground">
                      ({receipt.customer_mobile_no})
                    </span>
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    Branch
                  </p>
                  <p className="text-lg font-semibold">
                    {receipt.branch_name || receipt.branch?.branch_name || "-"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    State
                  </p>
                  <p className="text-lg font-semibold">
                    {receipt.state_name || receipt.state?.state_name || "-"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    Collected By
                  </p>
                  <p className="text-lg font-semibold">
                    {receipt.collected_by_name || "-"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    Payment Channel
                  </p>
                  <p className="text-lg font-semibold">
                    {receipt.payment_channel || "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2 p-4 bg-gradient-to-br from-card to-card-secondary rounded-xl border border-border/50">
                  <p className="text-sm text-muted-foreground font-medium">
                    Created Date
                  </p>
                  <p className="text-lg font-semibold">
                    {receipt.created_date ?? "-"}
                  </p>
                </div>
                <div className="space-y-2 p-4 bg-gradient-to-br from-card to-card-secondary rounded-xl border border-border/50">
                  <p className="text-sm text-muted-foreground font-medium">
                    Payment Date
                  </p>
                  <p className="text-lg font-semibold">
                    {receipt.payment_date ?? "-"}
                  </p>
                </div>
                <div className="space-y-2 p-4 bg-gradient-to-br from-card to-card-secondary rounded-xl border border-border/50">
                  <p className="text-sm text-muted-foreground font-medium">
                    Payment Month
                  </p>
                  <p className="text-lg font-semibold">
                    {receipt.payment_month ?? "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg-grid-cols-3 gap-6">
                <div className="space-y-2 p-4 bg-gradient-to-br from-success/10 to-success/5 rounded-xl border border-success/20">
                  <p className="text-sm text-muted-foreground font-medium">
                    EMI Amount Paid
                  </p>
                  <p className="text-2xl font-bold text-success">
                    ₹ {currency(receipt.emi_amount_paid)}
                  </p>
                </div>
                <div className="space-y-2 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                  <p className="text-sm text-muted-foreground font-medium">
                    Late Payment Charges
                  </p>
                  <p className="text-xl font-bold">
                    ₹ {currency(receipt.late_payment_charges_paid)}
                  </p>
                </div>
                <div className="space-y-2 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                  <p className="text-sm text-muted-foreground font-medium">
                    Bounce Charges
                  </p>
                  <p className="text-xl font-bold">
                    ₹ {currency(receipt.bounce_charges_paid)}
                  </p>
                </div>
                <div className="space-y-2 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                  <p className="text-sm text-muted-foreground font-medium">
                    Penalty Charges
                  </p>
                  <p className="text-xl font-bold">
                    ₹ {currency(receipt.penalty_charges_paid)}
                  </p>
                </div>
                <div className="space-y-2 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                  <p className="text-sm text-muted-foreground font-medium">
                    Other Charges
                  </p>
                  <p className="text-xl font-bold">
                    ₹ {currency(receipt.other_charges_paid)}
                  </p>
                </div>
                <div className="space-y-2 p-4 bg-gradient-to-br from-success/10 to-success/5 rounded-xl border border-success/20">
                  <p className="text-sm text-muted-foreground font-medium">
                    Total Amount Paid
                  </p>
                  <p className="text-2xl font-bold text-success">
                    ₹ {currency(receipt.total_amount_paid)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    Payment Mode
                  </p>
                  <p className="text-lg font-semibold">
                    {receipt.payment_mode}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    Payment Status
                  </p>
                  <p className="text-lg font-semibold">
                    {receipt.payment_status}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    LMS Receipt ID
                  </p>
                  <p className="text-lg font-semibold">
                    {receipt.lms_receipt_id ?? "-"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    LMS Req Updated At
                  </p>
                  <p className="text-lg font-semibold">
                    {receipt.lms_req_id_updated_at ?? "-"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    Deposit Status
                  </p>
                  <p className="text-lg font-semibold">
                    {receipt.deposit_status ?? "-"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    Deposit Amount
                  </p>
                  <p className="text-lg font-semibold">
                    {receipt.deposit_amount
                      ? `₹ ${currency(receipt.deposit_amount)}`
                      : "-"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    Deposit Date
                  </p>
                  <p className="text-lg font-semibold">
                    {receipt.deposit_date ?? "-"}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CashNormsView;
