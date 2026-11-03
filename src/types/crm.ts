export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  createdAt: string;
  contactPerson: string;
  industry: string;
  revenue?: number;
  company?: string;
  lastContact?: string;
  totalTickets?: number;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customerId: string;
  customerName: string;
  assignedTo: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
  category: string;
  dueDate?: string;
  tags?: string[];
}

export interface Employee {
  id: string;
  employee_code: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'employee' | 'super_admin';
  department: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  avatar?: string;
  ticketsAssigned?: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'employee' | 'super_admin';
  action: string;
  module: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  details: {
    before?: any;
    after?: any;
    metadata?: any;
  };
  resourceId?: string;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
}

export interface DashboardStats {
  totalCustomers: number;
  activeTickets: number;
  newComplaints: number;
  employeeCount: number;
  recentActivity: AuditLog[];
}

// Branch entity for branch listing/upload feature
export interface Branch {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  manager?: string;
  status?: 'active' | 'inactive';
  createdAt?: string; // optional timestamp from file or generated
}

export interface StateMaster {
  id: string;
  name: string;
  code: string; // e.g. CA, NY
  status?: 'active' | 'inactive';
  createdAt?: string;
}

export interface CityMaster {
  id: string;
  name: string;
  stateCode: string; // reference to StateMaster.code
  status?: 'active' | 'inactive';
  createdAt?: string;
}

// Scoring rule for Cash & Cheque norms (difference between received and deposited date in days)
export interface CashChequeScoringRule {
  id: string;
  minDays: number; // inclusive
  maxDays: number; // inclusive (use large number e.g. 9999 for open upper bound)
  score: number; // e.g. 0-10
  description?: string;
}