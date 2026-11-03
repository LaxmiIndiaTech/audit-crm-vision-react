import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BranchInspectionData } from '@/lib/api';

interface ScorecardMetricsProps {
  inspectionData: BranchInspectionData | null;
}

export const ScorecardMetrics: React.FC<ScorecardMetricsProps> = ({ inspectionData }) => {
  if (!inspectionData?.performance_metrics) return null;

  const metrics = inspectionData.performance_metrics;

  return (
    <div className="grid md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{metrics.total_receipts.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Total Receipts</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">₹{parseFloat(metrics.total_amount).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Total Amount</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{metrics.average_processing_days.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">Avg Processing Days</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{metrics.receipts_with_scores.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Receipts with Scores</p>
        </CardContent>
      </Card>
    </div>
  );
};
