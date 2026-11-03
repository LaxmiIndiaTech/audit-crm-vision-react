import React from 'react';
import { BranchInspectionData } from '@/lib/api';

interface ScorecardBranchInfoProps {
  inspectionData: BranchInspectionData | null;
}

export const ScorecardBranchInfo: React.FC<ScorecardBranchInfoProps> = ({ inspectionData }) => {
  if (!inspectionData) return null;

  const info = inspectionData.branch_info;
  return (
    <div className="grid md:grid-cols-3 gap-4 text-sm mt-4 p-4 bg-muted/20 rounded-lg">
      <div>
        <p className="text-muted-foreground">Branch Name</p>
        <p className="font-medium">{info.branch_name}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Company Name</p>
        <p className="font-medium">{info.company_name}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Inspection Date</p>
        <p className="font-medium">{info.inspection_date}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Branch Address</p>
        <p className="font-medium">{info.branch_address}</p>
      </div>
      <div>
        <p className="text-muted-foreground">In charge & Code</p>
        <p className="font-medium">{info.in_charge_code}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Inspection Officials</p>
        <p className="font-medium">{info.inspection_officials}</p>
      </div>
    </div>
  );
};
