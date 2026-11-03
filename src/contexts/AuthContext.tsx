import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef } from 'react';
import { User, AuthState, LoginCredentials, UserRole, OtpLoginCredentials } from '@/types/auth';
import { authApi, ApiError, formatMobileNumber, validateMobileNumber, VerifyOtpResponse } from '@/lib/api';
import secureStorage from "react-secure-storage"

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithOtp: (credentials: OtpLoginCredentials) => Promise<void>;
  requestOtp: (phone: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR' }
  | { type: 'LOGOUT' }
  | { type: 'HYDRATE_END' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        user: action.payload,
        isAuthenticated: true,
        isLoading: false
      };
    case 'LOGIN_ERROR':
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false
      };
    case 'LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false
      };
    case 'HYDRATE_END':
      return { ...state, isLoading: false };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true
};

// Mock authentication - replace with real API
const mockUsers = [
  {
    id: '1',
    email: 'admin@crm.com',
    password: 'admin123',
    name: 'John Admin',
    role: 'admin' as UserRole,
    department: 'Management',
    createdAt: '2024-01-01',
    phone: '9871218483',
    branchId: 'b1',
    branchName: 'Head Office'
  },
  {
    id: '2',
    email: 'employee@crm.com',
    password: 'employee123',
    name: 'Mike Employee',
    role: 'employee' as UserRole,
    department: 'Customer Service',
    createdAt: '2024-02-01',
    phone: '9871218482',
    branchId: 'b2',
    branchName: 'East Hub'
  },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  // store OTP codes in memory (phone -> code) just for mock
  const otpStore = useRef<Record<string, { code: string; expires: number }>>({});

  useEffect(() => {
    // Check for existing session & token
    try {
      const token = secureStorage.getItem('crm_token') as string | null;
      const expiry = secureStorage.getItem('crm_token_expiry') as string | null;
      const storedUser = secureStorage.getItem('crm_user') as string | null;

      // If expiry is present and in the past, clear token & user
      const expiryMs = expiry ? parseInt(expiry, 10) : 0;
      if (expiryMs && expiryMs <= Date.now()) {
        secureStorage.removeItem('crm_token');
        secureStorage.removeItem('crm_token_expiry');
        secureStorage.removeItem('crm_user');
        dispatch({ type: 'HYDRATE_END' });
        return;
      }

      if (token && expiryMs && expiryMs > Date.now() && storedUser) {
        const user = JSON.parse(storedUser);
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } else if (storedUser) {
        // No valid token -> don't auto-auth
        secureStorage.removeItem('crm_user');
      }
    } catch {
      // if anything goes wrong, clear corrupt entries
      secureStorage.removeItem('crm_token');
      secureStorage.removeItem('crm_token_expiry');
      secureStorage.removeItem('crm_user');
    }
    // End hydration phase regardless of outcome
    dispatch({ type: 'HYDRATE_END' });
  }, []);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = mockUsers.find(
      u => u.email === credentials.email && u.password === credentials.password
    );
    
    if (user) {
      const { password, ...userWithoutPassword } = user;
      const authenticatedUser = {
        ...userWithoutPassword,
        lastLogin: new Date().toISOString()
      };
      
      secureStorage.setItem('crm_user', JSON.stringify(authenticatedUser));
      dispatch({ type: 'LOGIN_SUCCESS', payload: authenticatedUser });
    } else {
      dispatch({ type: 'LOGIN_ERROR' });
      throw new Error('Invalid credentials');
    }
  };

  const requestOtp = async (phone: string): Promise<string> => {
    try {
      // Validate phone number
      if (!validateMobileNumber(phone)) {
        throw new Error('Please enter a valid mobile number');
      }

      // Format phone number
      const formattedPhone = formatMobileNumber(phone);
      
      // Call real API
      const response = await authApi.requestOtp(formattedPhone);
      
      // Extract OTP from the API response
      const otpCode = response.data?.otp_code;
      
      if (!otpCode) {
        throw new Error('OTP not received from server');
      }
      
      // Store the OTP for verification (in production, this would be handled server-side)
      otpStore.current[formattedPhone] = { 
        code: otpCode, 
        expires: Date.now() + 5 * 60 * 1000 
      };
      
      console.log('[API Response]', response);
      console.log('[OTP Received]', otpCode, 'for', formattedPhone);
      console.log('[API Message]', response.message);
      
      return otpCode; // Return the actual OTP from API
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to send OTP. Please try again.');
    }
  };

  const loginWithOtp = async (credentials: OtpLoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const formattedPhone = formatMobileNumber(credentials.phone);
      const record = otpStore.current[formattedPhone];
      
      if (!record || record.expires < Date.now()) {
        dispatch({ type: 'LOGIN_ERROR' });
        throw new Error('OTP expired or not requested');
      }
      
      if (record.code !== credentials.otp) {
        dispatch({ type: 'LOGIN_ERROR' });
        throw new Error('Invalid OTP');
      }
      
      // Call verify_otp API
  const verifyRes: VerifyOtpResponse = await authApi.verifyOtp(formattedPhone, credentials.otp);
  const token = verifyRes.data?.token;
  const tokenType = verifyRes.data?.token_type || 'Bearer';
  const expiresIn = verifyRes.data?.expires_in;
      
      if (!token) {
        dispatch({ type: 'LOGIN_ERROR' });
        throw new Error('Verification failed: token missing');
      }
      
      // Persist token (basic example); can be extended to cookies/headers
      secureStorage.setItem('crm_token', `${tokenType} ${token}`);
      if (typeof expiresIn === 'number') {
        secureStorage.setItem('crm_token_expiry', String(Date.now() + expiresIn * 1000));
      }
      
      // Map CRM employee data to our User shape
      const emp = verifyRes.data?.employee;
  const primaryRole = (emp?.roles && emp.roles.length > 0) ? (emp.roles[0] as UserRole) : 'employee';
      const authenticatedUser: User = {
        id: String(emp?.id ?? 'self'),
        email: emp?.email ?? '',
        phone: emp?.mobile_number ?? formattedPhone,
        name: `${emp?.employee_first_name ?? ''} ${emp?.employee_last_name ?? ''}`.trim() || 'User',
        role: primaryRole,
        roles: emp?.roles ?? [],
        avatar: undefined,
        department: emp?.department,
        branchId: emp?.branch ? String(emp.branch.id) : undefined,
        branchName: emp?.branch?.branch_name,
        createdAt: emp?.login_at ?? new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      
  // Persist mapped user and raw employee for future use
  secureStorage.setItem('crm_user', JSON.stringify(authenticatedUser));
  if (emp) secureStorage.setItem('crm_employee', JSON.stringify(emp));
      dispatch({ type: 'LOGIN_SUCCESS', payload: authenticatedUser });
      
      // Invalidate used OTP
      delete otpStore.current[formattedPhone];
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR' });
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('OTP verification failed');
    }
  };

  const logout = () => {
    try {
      secureStorage.removeItem('crm_token');
      secureStorage.removeItem('crm_token_expiry');
      secureStorage.removeItem('crm_user');
      secureStorage.removeItem('crm_employee');
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
  loginWithOtp,
  requestOtp,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};