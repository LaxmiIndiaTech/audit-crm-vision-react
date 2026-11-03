import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Employee } from '@/types/crm';
import { adminApi, CreateEmployeePayload, CreateEmployeeResponseData, UpdateEmployeeRolePayload, Branch, AdminBranchesResponseData } from '@/lib/api';
import { useApi, useApiForm } from '@/hooks/useApi';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmployeeModalsProps {
  // Add Modal
  isAddModalOpen: boolean;
  onAddModalChange: (open: boolean) => void;
  onEmployeeAdded?: () => void; // Callback to refresh employee list
  
  // Edit Modal
  isEditModalOpen: boolean;
  onEditModalChange: (open: boolean) => void;
  editingEmployee: Employee | null;
  editForm: {
    employee_first_name: string;
    employee_last_name: string;
    employee_code: string;
    email: string;
    mobile_number: string;
    department: string;
    is_active: boolean;
    role: string;
  };
  onEditFormChange: (field: string, value: string | boolean) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export const EmployeeModals: React.FC<EmployeeModalsProps> = ({
  isAddModalOpen,
  onAddModalChange,
  onEmployeeAdded,
  isEditModalOpen,
  onEditModalChange,
  editingEmployee,
  editForm,
  onEditFormChange,
  onSaveEdit,
  onCancelEdit
}) => {
  // Add Employee Form State
  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeCode: '',
    department: '',
    branchId: '' // Will be set when branches are loaded
  });

  // Use new standardized API hooks
  const branchesApi = useApi<AdminBranchesResponseData>();
  const createEmployeeApi = useApiForm<CreateEmployeeResponseData, CreateEmployeePayload>();
  const updateRoleApi = useApi<any>();

  // Fetch branches when the add modal opens
  useEffect(() => {
    if (isAddModalOpen) {
      fetchBranches();
    }
  }, [isAddModalOpen]);

  const fetchBranches = async () => {
    const response = await branchesApi.execute(() => adminApi.getBranches());
    
    // Set default branch if available and no branch is selected
    if (response.status === 'success' && response.data.branches?.length > 0 && !addForm.branchId) {
      setAddForm(prev => ({ ...prev, branchId: String(response.data.branches[0].id) }));
    } else if (response.status === 'failure' && !addForm.branchId) {
      // Set a fallback default if fetch fails
      setAddForm(prev => ({ ...prev, branchId: '2' }));
    }
  };

  const handleAddFormChange = (field: string, value: string) => {
    setAddForm(prev => ({ ...prev, [field]: value }));
    if (createEmployeeApi.error) createEmployeeApi.setError(null); // Clear error when user starts typing
  };

  const handleEditFormChange = (field: string, value: string | boolean) => {
    onEditFormChange(field, value);
    if (updateRoleApi.error) updateRoleApi.setError(null);
  };

  const handleAddEmployee = async () => {
    if (!addForm.firstName || !addForm.lastName || !addForm.email || !addForm.phone || !addForm.employeeCode || !addForm.branchId) {
      createEmployeeApi.setError('Please fill in all required fields');
      return;
    }

    const payload: CreateEmployeePayload = {
      branch_id: addForm.branchId,
      employee_first_name: addForm.firstName,
      employee_last_name: addForm.lastName,
      mobile_number: addForm.phone,
      email: addForm.email,
      employee_code: addForm.employeeCode,
      department: addForm.department || 'General'
    };

    await createEmployeeApi.submitForm(
      payload,
      (data) => adminApi.createEmployee(data),
      (data, message) => {
        // Success callback
        // Reset form
        setAddForm({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          employeeCode: '',
          department: '',
          branchId: ''
        });
        
        // Close modal and refresh list
        onAddModalChange(false);
        onEmployeeAdded?.();
      }
    );
  };

  const handleSaveEdit = async () => {
    if (!editingEmployee) return;
    
    // Call the parent component's save function which handles the API call
    onSaveEdit();
  };

  return (
    <>
      {/* Add Employee Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={onAddModalChange}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {createEmployeeApi.error && (
              <Alert variant="destructive">
                <AlertDescription>{createEmployeeApi.error}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input 
                  id="firstName" 
                  placeholder="Enter first name" 
                  value={addForm.firstName}
                  onChange={e => handleAddFormChange('firstName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input 
                  id="lastName" 
                  placeholder="Enter last name" 
                  value={addForm.lastName}
                  onChange={e => handleAddFormChange('lastName', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Enter email address" 
                value={addForm.email}
                onChange={e => handleAddFormChange('email', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input 
                  id="phone" 
                  placeholder="Enter phone number" 
                  value={addForm.phone}
                  onChange={e => handleAddFormChange('phone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="employeeCode">Employee Code *</Label>
                <Input 
                  id="employeeCode" 
                  placeholder="Enter employee code" 
                  value={addForm.employeeCode}
                  onChange={e => handleAddFormChange('employeeCode', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select 
                value={addForm.department} 
                onValueChange={v => handleAddFormChange('department', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Management">Management</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Audit">Audit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="branch">Branch *</Label>
              <Select 
                value={addForm.branchId} 
                onValueChange={(value) => handleAddFormChange('branchId', value)}
                disabled={branchesApi.loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={branchesApi.loading ? "Loading branches..." : "Select a branch"} />
                </SelectTrigger>
                <SelectContent>
                  {branchesApi.data?.branches?.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.branch_name} ({branch.city.city_name}, {branch.state.state_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => onAddModalChange(false)}
                disabled={createEmployeeApi.isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddEmployee}
                disabled={createEmployeeApi.isSubmitting || !addForm.firstName || !addForm.lastName || !addForm.email || !addForm.phone || !addForm.employeeCode}
              >
                {createEmployeeApi.isSubmitting ? 'Creating...' : 'Add Employee'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(o) => { if (!o) onCancelEdit(); else onEditModalChange(o); }}>
        <DialogContent aria-describedby="edit-employee-description">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <p id="edit-employee-description" className="text-sm text-muted-foreground">
              Update employee information and role
            </p>
          </DialogHeader>
          {editingEmployee && (
            <div className="space-y-4">
              {updateRoleApi.error && (
                <Alert variant="destructive">
                  <AlertDescription>{updateRoleApi.error}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_first_name">First Name</Label>
                  <Input 
                    id="edit_first_name" 
                    value={editForm.employee_first_name} 
                    onChange={e => handleEditFormChange('employee_first_name', e.target.value)} 
                  />
                </div>
                <div>
                  <Label htmlFor="edit_last_name">Last Name</Label>
                  <Input 
                    id="edit_last_name" 
                    value={editForm.employee_last_name} 
                    onChange={e => handleEditFormChange('employee_last_name', e.target.value)} 
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_employee_code">Employee Code</Label>
                <Input 
                  id="edit_employee_code" 
                  value={editForm.employee_code} 
                  onChange={e => handleEditFormChange('employee_code', e.target.value)} 
                />
              </div>
              <div>
                <Label htmlFor="edit_email">Email</Label>
                <Input 
                  id="edit_email" 
                  type="email" 
                  value={editForm.email} 
                  onChange={e => handleEditFormChange('email', e.target.value)} 
                />
              </div>
              <div>
                <Label htmlFor="edit_phone">Phone</Label>
                <Input 
                  id="edit_phone" 
                  value={editForm.mobile_number} 
                  onChange={e => handleEditFormChange('mobile_number', e.target.value)} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Department</Label>
                  <Input 
                    value={editForm.department} 
                    onChange={e => handleEditFormChange('department', e.target.value)} 
                    placeholder="Enter department"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={editForm.role} onValueChange={v => handleEditFormChange('role', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editForm.is_active ? 'active' : 'inactive'} onValueChange={v => handleEditFormChange('is_active', v === 'active')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={onCancelEdit}
                  disabled={updateRoleApi.loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveEdit} 
                  disabled={!editForm.employee_first_name || !editForm.email || updateRoleApi.loading}
                >
                  {updateRoleApi.loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};