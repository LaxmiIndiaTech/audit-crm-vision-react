import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { adminApi, ApiError, CrmEmployee, UpdateEmployeePayload } from '@/lib/api';
import { Employee } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';
import { 
  EmployeeStatsCards, 
  EmployeeFilters, 
  EmployeeTable, 
  EmployeeModals 
} from '@/components/employees';

// Map backend CrmEmployee to UI Employee shape
const mapCrmEmployeeToEmployee = (e: CrmEmployee): Employee => {
  if (!e || !e.id) {
    console.error('Invalid employee data received:', e);
    throw new Error('Invalid employee data: missing ID');
  }
  
  return {
    id: String(e.id),
    employee_code: e.employee_code || '',
    name: `${e.employee_first_name || ''} ${e.employee_last_name || ''}`.trim(),
    email: e.email || '',
    phone: e.mobile_number || '',
    role: (e.roles?.[0] as Employee['role']) || 'employee',
    department: e.department || '',
    status: e.is_active ? 'active' : 'inactive',
    lastLogin: e.login_at ?? new Date().toISOString(),
  };
};

const Employees = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({ 
    employee_first_name: '', 
    employee_last_name: '', 
    employee_code: '', 
    email: '', 
    mobile_number: '', 
    department: '', 
    is_active: true,
    role: '' // Keep role for role update functionality
  });
  const [page, setPage] = useState(1);
  const pageSize = 3;
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [adminCount, setAdminCount] = useState<number>(0);
  const [activeCount, setActiveCount] = useState<number>(0);

  // Fetch employees with React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-employees', page, pageSize, searchTerm, roleFilter, statusFilter],
    queryFn: async () => {
      const res = await adminApi.getEmployees({
        page,
        per_page: pageSize,
        q: searchTerm || undefined,
        role: roleFilter,
        status: statusFilter,
      });
      setTotalCount(res.data.count || res.data.employees.length);
      setAdminCount(res.data.admin_employees ?? 0);
      setActiveCount(res.data.active_employees ?? 0);
      if (res.data.pagination?.total_pages) setTotalPages(res.data.pagination.total_pages);
      else setTotalPages(Math.max(1, Math.ceil((res.data.count || 0) / pageSize)));
      return res.data.employees.map(mapCrmEmployeeToEmployee);
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Initialize employees state after fetch to allow local edits
  React.useEffect(() => {
    if (data) setEmployees(data);
  }, [data]);

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateEmployeePayload }) => {
      return adminApi.updateEmployee(id, payload);
    },
    onSuccess: (response) => {      
      if (response.data && response.data.employee) {
        const updatedEmployee = mapCrmEmployeeToEmployee(response.data.employee);
        setEmployees(prev => prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
      } else {
        queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      }
    },
    onError: (error) => {
      console.error('Failed to update employee:', error);
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to update employee details",
        variant: "destructive",
      });
    },
  });

  // Edit employee functions
  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    const nameParts = emp.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    setEditForm({
      employee_first_name: firstName,
      employee_last_name: lastName,
      employee_code: emp.employee_code,
      email: emp.email,
      mobile_number: emp.phone,
      department: emp.department,
      is_active: emp.status === 'active',
      role: emp.role
    });
    setIsEditModalOpen(true);
  };

  const saveEdit = async () => {
    if (!editingEmployee) return;
    
    try {
      const payload: UpdateEmployeePayload = {
        employee_first_name: editForm.employee_first_name,
        employee_last_name: editForm.employee_last_name,
        employee_code: parseInt(editForm.employee_code) || 0,
        email: editForm.email,
        mobile_number: editForm.mobile_number,
        department: editForm.department,
        is_active: editForm.is_active,
      };
      
      await updateEmployeeMutation.mutateAsync({ id: editingEmployee.id, payload });
      
      // If role has changed, update role separately
      if (editForm.role && editForm.role !== editingEmployee.role) {
        const rolePayload = {
          id: parseInt(editingEmployee.id),
          role: editForm.role
        };
        await adminApi.updateEmployeeRole(rolePayload);
      }
      
      // Show success toast
      const updatedName = `${editForm.employee_first_name} ${editForm.employee_last_name}`.trim();
      let successMessage = `Employee ${updatedName} updated successfully`;
      
      // Add role update info if role was changed
      if (editForm.role && editForm.role !== editingEmployee.role) {
        successMessage += ` and role changed to ${editForm.role}`;
      }
      
      toast({
        title: "Success",
        description: successMessage,
        variant: "default",
      });
      
      // Close the modal after successful update
      setIsEditModalOpen(false);
      setEditingEmployee(null);
      
      // Refresh the employee list to get updated data
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      
    } catch (error) {
      console.error('Failed to update employee:', error);
      
      // Show error toast
      toast({
        title: "Error",
        description: error instanceof ApiError 
          ? error.message 
          : error instanceof Error 
          ? error.message 
          : "Failed to update employee. Please try again.",
        variant: "destructive",
      });
      
      // Modal stays open to show error or retry
    }
  };

  const cancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingEmployee(null);
  };

  const handleEditFormChange = (field: keyof typeof editForm, value: string | boolean) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle employee added - refresh the list
  const handleEmployeeAdded = () => {
    toast({
      title: "Success",
      description: "Employee added successfully",
      variant: "default",
    });
    queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
  };

  // Reset page when filters change
  React.useEffect(() => { setPage(1); }, [searchTerm, roleFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage team members and permissions</p>
        </div>
        {/* Loading/Error indicators */}
        {isLoading && <span className="text-sm text-muted-foreground">Loading employees…</span>}
        {error instanceof ApiError && (
          <span className="text-sm text-destructive">{error.message || 'Failed to load employees'}</span>
        )}
        <EmployeeModals
          isAddModalOpen={isAddModalOpen}
          onAddModalChange={setIsAddModalOpen}
          onEmployeeAdded={handleEmployeeAdded}
          isEditModalOpen={isEditModalOpen}
          onEditModalChange={setIsEditModalOpen}
          editingEmployee={editingEmployee}
          editForm={editForm}
          onEditFormChange={handleEditFormChange}
          onSaveEdit={saveEdit}
          onCancelEdit={cancelEdit}
        />
      </div>

      {/* Stats */}
      <EmployeeStatsCards
        totalCount={totalCount}
        adminCount={adminCount}
        activeCount={activeCount}
        isLoading={isLoading}
      />

      {/* Filters */}
      <EmployeeFilters
        searchTerm={searchTerm}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onRoleFilterChange={setRoleFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Table and Pagination */}
      <EmployeeTable
        employees={employees}
        isLoading={isLoading}
        error={error}
        searchTerm={searchTerm}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onViewEmployee={setSelectedEmployee}
        onEditEmployee={openEdit}
        selectedEmployee={selectedEmployee}
      />
    </div>
  );
};

export default Employees;