import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';
import { Edit, Eye, Shield, User, Mail, Phone } from 'lucide-react';
import { Employee } from '@/types/crm';
import { ApiError } from '@/lib/api';

interface EmployeeTableProps {
  employees: Employee[];
  isLoading: boolean;
  error: Error | null;
  searchTerm: string;
  roleFilter: string;
  statusFilter: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewEmployee: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  selectedEmployee: Employee | null;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  isLoading,
  error,
  searchTerm,
  roleFilter,
  statusFilter,
  page,
  totalPages,
  onPageChange,
  onViewEmployee,
  onEditEmployee,
  selectedEmployee
}) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'employee':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const current = Math.min(page, totalPages);

  return (
    <>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!isLoading && employees.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="py-10 text-center text-muted-foreground">
                      {(
                        (searchTerm && searchTerm.trim().length > 0) ||
                        roleFilter !== 'all' ||
                        statusFilter !== 'all'
                      ) ? 'No results match your filters' : 'No employees found'}
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">ID: {employee.id}</p>
                        <p className="text-sm text-muted-foreground">Code: {employee.employee_code}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {employee.email}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {employee.phone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(employee.role)}>
                      <div className="flex items-center">
                        {getRoleIcon(employee.role)}
                        <span className="ml-1 capitalize">{employee.role}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(employee.status)}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(employee.lastLogin)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => onViewEmployee(employee)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Employee Details</DialogTitle>
                          </DialogHeader>
                          {selectedEmployee && (
                            <div className="space-y-4">
                              <div className="flex items-center space-x-4">
                                <Avatar className="w-16 h-16">
                                  <AvatarFallback className="text-lg">
                                    {getInitials(selectedEmployee.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="text-lg font-semibold">{selectedEmployee.name}</h3>
                                  <Badge className={getRoleColor(selectedEmployee.role)}>
                                    <div className="flex items-center">
                                      {getRoleIcon(selectedEmployee.role)}
                                      <span className="ml-1 capitalize">{selectedEmployee.role}</span>
                                    </div>
                                  </Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Email</Label>
                                  <p className="text-sm text-muted-foreground">{selectedEmployee.email}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Phone</Label>
                                  <p className="text-sm text-muted-foreground">{selectedEmployee.phone}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Department</Label>
                                  <p className="text-sm text-muted-foreground">{selectedEmployee.department}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Status</Label>
                                  <Badge className={getStatusColor(selectedEmployee.status)}>
                                    {selectedEmployee.status}
                                  </Badge>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Last Login</Label>
                                  <p className="text-sm text-muted-foreground">{formatDateTime(selectedEmployee.lastLogin)}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm" onClick={() => onEditEmployee(employee)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {totalPages > 1 && (
        <Pagination className="pt-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  if (current > 1) onPageChange(current - 1); 
                }} 
                className={current === 1 ? 'pointer-events-none opacity-50' : ''} 
              />
            </PaginationItem>
            {(() => {
              const windowSize = 5;
              let start = current;
              if (totalPages <= windowSize) {
                start = 1;
              } else if (current > totalPages - windowSize + 1) {
                start = Math.max(1, totalPages - windowSize + 1);
              }
              const end = Math.min(totalPages, start + windowSize - 1);
              const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
              return (
                <>
                  {pages.map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink 
                        href="#" 
                        isActive={p === current} 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          onPageChange(p); 
                        }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  {end < totalPages && (
                    <>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); onPageChange(totalPages); }}>
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                </>
              );
            })()}
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  if (current < totalPages) onPageChange(current + 1); 
                }} 
                className={current === totalPages ? 'pointer-events-none opacity-50' : ''} 
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
};