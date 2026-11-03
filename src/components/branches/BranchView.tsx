import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Branch } from '@/types/crm';

// NOTE: Without backend state we can't fetch; in real app you'd load by id.
// For now we reconstruct a placeholder using id param.

const BranchView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const branch: Branch = {
    id: id || 'unknown',
    name: `Branch ${id}`,
    city: 'N/A',
    state: 'N/A',
    manager: 'N/A',
    phone: 'N/A',
    status: 'active'
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="responsive-heading">Branch Details</h1>
          <p className="text-muted-foreground text-lg">Complete information for the selected branch location.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/branches')} className="hover-lift">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Branches
        </Button>
      </div>

      <Card className="crm-card-premium animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            {branch.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Branch ID</p>
              <p className="text-lg font-semibold text-gradient-primary">{branch.id}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">City</p>
              <p className="text-lg font-semibold">{branch.city}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">State</p>
              <p className="text-lg font-semibold">{branch.state}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Manager</p>
              <p className="text-lg font-semibold">{branch.manager}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Phone</p>
              <p className="text-lg font-semibold">{branch.phone}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Status</p>
              <div className={`status-badge ${branch.status === 'active' ? 'status-closed' : 'status-open'}`}>
                {branch.status}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchView;
