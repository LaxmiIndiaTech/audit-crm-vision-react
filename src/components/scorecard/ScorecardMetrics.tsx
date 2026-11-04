import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BranchInspectionData } from '@/lib/api';
import { Award, CheckCircle2, TrendingUp, Layers } from 'lucide-react';

interface ScorecardMetricsProps {
  inspectionData: BranchInspectionData | null;
}

export const ScorecardMetrics: React.FC<ScorecardMetricsProps> = ({ inspectionData }) => {
  if (!inspectionData) return null;

  const summary = (inspectionData as any)?.summary;
  const metrics = inspectionData.performance_metrics;

  const totalCarry = summary?.total_marks_carry ?? 100;
  const totalObtained = summary?.total_marks_obtained ?? 0;
  const totalPct = summary?.total_score_pct ?? 0;
  const grade = summary?.final_grade || 'Unsatisfactory';

  const processCarry = summary?.process_marks_carry ?? 40;
  const processObtained = summary?.process_marks_obtained ?? 0;
  const processPct = summary?.process_score_pct ?? 0;

  const perfCarry = summary?.performance_marks_carry ?? 60;
  const perfObtained = summary?.performance_marks_obtained ?? 0;
  const perfPct = summary?.performance_score_pct ?? 0;

  const getGradeBadge = (g: string) => {
    switch (g.toLowerCase()) {
      case 'excellent':
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">Excellent (&gt;90%)</Badge>;
      case 'good':
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">Good (65-90%)</Badge>;
      case 'satisfactory':
        return <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs">Satisfactory (50-65%)</Badge>;
      default:
        return <Badge variant="destructive" className="font-bold text-xs">Unsatisfactory (&le;50%)</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Overall Audit Score & Grade */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Award className="w-4 h-4 text-primary" />
              <span>Overall Audit Score</span>
            </span>
            {getGradeBadge(grade)}
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-foreground">
              {Number(totalObtained).toFixed(2)}{' '}
              <span className="text-sm font-medium text-muted-foreground">/ {Number(totalCarry).toFixed(0)}</span>
            </div>
            <p className="text-xs font-semibold text-primary mt-0.5">
              {Number(totalPct).toFixed(1)}% Overall Score
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Process Score (Part I: Sections A to G) */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Part I: Process (A-G)</span>
            </span>
            <Badge variant="outline" className="text-[10px] font-semibold">40 Marks Max</Badge>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-foreground">
              {Number(processObtained).toFixed(2)}{' '}
              <span className="text-sm font-medium text-muted-foreground">/ {Number(processCarry).toFixed(0)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {Number(processPct).toFixed(1)}% Compliance Score
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Performance Score (Part II: Sections H to M) */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Part II: Performance (H-M)</span>
            </span>
            <Badge variant="outline" className="text-[10px] font-semibold">60 Marks Max</Badge>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-foreground">
              {Number(perfObtained).toFixed(2)}{' '}
              <span className="text-sm font-medium text-muted-foreground">/ {Number(perfCarry).toFixed(0)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {Number(perfPct).toFixed(1)}% Performance Score
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Inspection Metrics */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <span>Audit Scope</span>
            </span>
            <Badge variant="outline" className="text-[10px] font-semibold">31 Checkpoints</Badge>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-foreground">
              {metrics ? metrics.total_receipts.toLocaleString() : '0'}{' '}
              <span className="text-xs font-normal text-muted-foreground">Receipts</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Avg TAT: {metrics ? metrics.average_processing_days.toFixed(1) : '0'} Days
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
