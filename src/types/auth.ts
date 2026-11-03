export type UserRole = 'admin' | 'employee' | 'super_admin';

export interface User {
  id: string;
  email: string;
  phone?: string; // optional phone number for OTP auth
  name: string;
  role: UserRole;
  roles?: string[]; // roles from backend for fine-grained access
  avatar?: string;
  department?: string;
  // Branch scoping for employee dashboards
  branchId?: string;
  branchName?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// OTP based login credentials (mobile number + one-time password)
export interface OtpLoginCredentials {
  phone: string;
  otp: string;
}