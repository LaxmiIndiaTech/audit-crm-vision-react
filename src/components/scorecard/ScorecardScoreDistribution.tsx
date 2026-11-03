import React from 'react';
import { BranchInspectionData } from '@/lib/api';

interface ScorecardScoreDistributionProps {
  inspectionData: BranchInspectionData | null;
}

export const ScorecardScoreDistribution: React.FC<ScorecardScoreDistributionProps> = ({ inspectionData }) => {
  if (!inspectionData?.performance_metrics.score_distribution || 
      Object.keys(inspectionData.performance_metrics.score_distribution).length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium mb-3">Score Distribution</h4>
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
        {Object.entries(inspectionData.performance_metrics.score_distribution)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([score, count]) => (
            <div key={score} className="text-center p-2 bg-muted/20 rounded">
              <div className="text-lg font-bold">{count}</div>
              <div className="text-xs text-muted-foreground">Score {score}</div>
            </div>
          ))}
      </div>
    </div>
  );
};
