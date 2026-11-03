import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminApi, ApiError, Branch } from '@/lib/api';
import { CommentsSection } from '@/components/scorecard/CommentsSection';

const Feedback: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isEmployee = user?.role === 'employee';
  
  // State management
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  
  // Load branches
  const loadBranches = async () => {
    try {
      setBranchesLoading(true);
      const response = await adminApi.getBranches({ per_page: 100 });
      const branchList = Array.isArray(response.data) ? response.data : response.data?.branches || [];
      setBranches(branchList);
      
      // Set default selected branch
      if (branchList.length > 0 && !selectedBranchId) {
        const defaultId = isEmployee && user?.branchId ? String(user.branchId) : String(branchList[0].id);
        setSelectedBranchId(defaultId);
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load branches';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setBranchesLoading(false);
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    loadBranches();
  }, []);
  
  // Set initial branch when branches are loaded
  useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      const defaultId = isEmployee && user?.branchId ? String(user.branchId) : String(branches[0].id);
      setSelectedBranchId(defaultId);
    }
  }, [branches, isEmployee, user?.branchId, selectedBranchId]);
  
  // When user context changes (e.g., login), ensure branchId is aligned
  useEffect(() => {
    if (isEmployee && user?.branchId) {
      setSelectedBranchId(String(user.branchId));
    }
  }, [isEmployee, user?.branchId]);

  const selectedBranch = branches.find(b => String(b.id) === selectedBranchId);

  return (
    <div className="space-y-6">
      {/* Page Header with Filters */}
      <Card className="crm-card">
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Feedback & Comments</CardTitle>
              <CardDescription>
                {isEmployee 
                  ? 'View and respond to audit feedback for your branch'
                  : 'Manage audit comments and track branch responses'}
              </CardDescription>
            </div>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              {!isEmployee && (
                <div className="w-full md:w-52">
                  <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                    <SelectTrigger aria-label="Select Branch">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchesLoading ? (
                        <SelectItem value="loading" disabled>Loading branches...</SelectItem>
                      ) : branches.length === 0 ? (
                        <SelectItem value="no-branches" disabled>No branches available</SelectItem>
                      ) : branches.map(b => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.branch_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          
          {/* Branch Information */}
          {selectedBranch && (
            <div className="grid md:grid-cols-3 gap-4 text-sm mt-2 p-4 bg-muted/20 rounded-lg">
              <div>
                <p className="text-muted-foreground">Branch Name</p>
                <p className="font-medium">{selectedBranch.branch_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Branch Code</p>
                <p className="font-medium">{selectedBranch.branch_code}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">
                  {selectedBranch.city?.city_name && selectedBranch.state?.state_name 
                    ? `${selectedBranch.city.city_name}, ${selectedBranch.state.state_name}`
                    : 'N/A'}
                </p>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Comments & Feedback Section */}
      {selectedBranchId && (
        <CommentsSection
          branchId={selectedBranchId}
          isEmployee={isEmployee}
        />
      )}
    </div>
  );
};

export default Feedback;
