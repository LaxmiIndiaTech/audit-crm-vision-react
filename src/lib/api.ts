/**
 * API Configuration and Utilities
 */
import secureStorage from "react-secure-storage";

// Environment configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://crmlifc.amandevops.com',
  VERSION: import.meta.env.VITE_API_VERSION || 'v1',
  TIMEOUT: 10000, // 10 seconds
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REQUEST_OTP: `/${API_CONFIG.VERSION}/auth/request_otp`,
    VERIFY_OTP: `/${API_CONFIG.VERSION}/auth/verify_otp`,
    VALIDATE_ROLES: `/${API_CONFIG.VERSION}/auth/validate_employee_roles`,
  },
  ADMIN: {
    EMPLOYEES: `/${API_CONFIG.VERSION}/admin/employees`,
    BRANCHES: `/${API_CONFIG.VERSION}/admin/branches`,
    UPDATE_EMPLOYEE_ROLE: `/${API_CONFIG.VERSION}/admin/employees/add_employee_role`,
    UPDATE_EMPLOYEE: (id: string) => `/${API_CONFIG.VERSION}/admin/employees/${id}`,
    STATES: `/${API_CONFIG.VERSION}/admin/states`,
    UPDATE_STATE: (id: string | number) => `/${API_CONFIG.VERSION}/admin/states/${id}`,
    CITIES: `/${API_CONFIG.VERSION}/admin/cities`,
    UPDATE_CITY: (id: string | number) => `/${API_CONFIG.VERSION}/admin/cities/${id}`,
    SCORING_RULES: `/${API_CONFIG.VERSION}/admin/scoring_rules`,
    SCORING_RULE: (id: string | number) => `/${API_CONFIG.VERSION}/admin/scoring_rules/${id}`,
    SCORING_RULES_SYNC: `/${API_CONFIG.VERSION}/admin/scoring_rules/sync`,
    CASH_CHEQUE_RECEIPTS: `/${API_CONFIG.VERSION}/admin/cash_cheque_receipts`,
    DASHBOARD_STATS: `/${API_CONFIG.VERSION}/admin/dashboard/stats`,
    BRANCH_INSPECTION: (branchId: string | number) => `/${API_CONFIG.VERSION}/admin/dashboard/${branchId}/branch_inspection`,
    SEND_INSPECTION_REPORT: (branchId: string | number) => `/${API_CONFIG.VERSION}/admin/dashboard/${branchId}/send_inspection_report`,
    FEEDBACK_THREADS: (branchId: string | number) => `/${API_CONFIG.VERSION}/admin/branches/${branchId}/feedback_threads`,
    FEEDBACK_REPLY: (threadId: string | number) => `/${API_CONFIG.VERSION}/admin/feedback_threads/${threadId}/replies`,
    PERSONAL_ACCOUNT_TRANSACTIONS: `/${API_CONFIG.VERSION}/admin/personal_account_transactions`,
    RE_EVALUATE_INSPECTION: (inspectionId: string | number) => `/${API_CONFIG.VERSION}/admin/inspections/${inspectionId}/re_evaluate`,
    HOLIDAYS: `/${API_CONFIG.VERSION}/admin/holidays`,
    HOLIDAY: (id: string | number) => `/${API_CONFIG.VERSION}/admin/holidays/${id}`,
    HOLIDAYS_IMPORT: `/${API_CONFIG.VERSION}/admin/holidays/import`,
    HOLIDAYS_RECALCULATE: `/${API_CONFIG.VERSION}/admin/holidays/recalculate`,
    TAT_RECORDS: `/${API_CONFIG.VERSION}/admin/tat_records`,
    TAT_RECORDS_IMPORT: `/${API_CONFIG.VERSION}/admin/tat_records/import`,
    TAT_BRANCH_SUMMARY: (branchId: string | number) => `/${API_CONFIG.VERSION}/admin/tat_records/branch_summary/${branchId}`,
  },
} as const;

// Standardized API Response types
export interface ApiSuccessResponse<T = any> {
  status: 'success';
  data: T;
  message: string;
}

export interface ApiFailureResponse {
  status: 'failure';
  data: {};
  errors: string[];
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiFailureResponse;

// Type guards for response types
export const isSuccessResponse = <T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> => {
  return response.status === 'success';
};

export const isFailureResponse = <T>(response: ApiResponse<T>): response is ApiFailureResponse => {
  return response.status === 'failure';
};

// Response utility functions
export const createSuccessResponse = <T>(data: T, message: string): ApiSuccessResponse<T> => ({
  status: 'success',
  data,
  message,
});

export const createFailureResponse = (errors: string[]): ApiFailureResponse => ({
  status: 'failure',
  data: {},
  errors,
});

// Helper to format single error into the standardized format
export const createSingleErrorResponse = (error: string): ApiFailureResponse => 
  createFailureResponse([error]);

// Enhanced error handling utilities
export const handleApiError = (error: unknown): ApiFailureResponse => {
  if (error instanceof ApiError) {
    return createSingleErrorResponse(error.message);
  }
  
  if (error instanceof Error) {
    return createSingleErrorResponse(error.message);
  }
  
  return createSingleErrorResponse('An unexpected error occurred');
};

// Wrapper for API calls that automatically handles errors and returns standardized responses
export const safeApiCall = async <T>(
  apiCall: () => Promise<T>
): Promise<ApiResponse<T extends ApiSuccessResponse<infer U> ? U : T>> => {
  try {
    const result = await apiCall();
    
    // If the result is already a standardized response, return it
    if (typeof result === 'object' && result !== null && 'status' in result) {
      return result as any;
    }
    
    // Otherwise, wrap it in a success response
    return createSuccessResponse(result, 'Operation completed successfully') as any;
  } catch (error) {
    return handleApiError(error);
  }
};

// Utility to extract data from API response with proper error handling
export const extractApiData = <T>(
  response: ApiResponse<T>
): { data: T | null; error: string | null } => {
  if (isSuccessResponse(response)) {
    return { data: response.data, error: null };
  }
  
  const errorMessage = response.errors.length > 0 
    ? response.errors.join(', ')
    : 'An error occurred';
    
  return { data: null, error: errorMessage };
};

export interface OtpRequestPayload {
  mobile_number: string;
}

export interface OtpRequestResponseData {
  otp_code: string;
}

export interface OtpRequestResponse {
  status: 'success';
  data: OtpRequestResponseData;
  message: string;
}

// Verify OTP
export interface VerifyOtpPayload {
  mobile_number: string;
  otp: string;
}

export interface VerifyOtpResponseData {
  token: string;
  token_type: string; // e.g., "Bearer"
  expires_in: number; // seconds
  employee: CrmEmployee;
}

export interface VerifyOtpResponse {
  status: 'success';
  data: VerifyOtpResponseData;
  message: string;
}

// Validate Roles
export interface ValidateRolesResponseData {
  roles: string[];
}

export interface ValidateRolesResponse {
  status: 'success';
  data: ValidateRolesResponseData;
  message: string;
}

// CRM Employee types from backend
export interface CrmEmployeeBranch {
  id: number;
  branch_name: string;
  branch_code: string;
  address: string;
  pin_code: string;
  is_active: boolean;
}

export interface CrmEmployeeCity {
  id: number;
  city_name: string;
  city_slug: string;
  city_code: string;
  branch_count: number;
  is_active: boolean;
  meta: Record<string, any>;
}

export interface CrmEmployeeState {
  id: number;
  state_name: string;
  state_code: string;
  country: string;
  is_active: boolean;
}

export interface CrmEmployee {
  id: number;
  employee_first_name: string;
  employee_last_name: string;
  employee_code: string;
  email: string;
  mobile_number: string;
  department: string;
  login_at: string;
  deactivated_at: string | null;
  is_active: boolean;
  roles?: string[];
  branch: CrmEmployeeBranch;
  city: CrmEmployeeCity;
  state: CrmEmployeeState;
}

// Admin: Employees list
export interface AdminPagination {
  page: number;
  per_page: number;
  total_pages: number;
  next_page: number | null;
  prev_page: number | null;
}

export interface AdminEmployeesResponseData {
  employees: CrmEmployee[];
  count: number;
  active_employees: number;
  admin_employees: number;
  pagination?: AdminPagination;
}

export interface AdminEmployeesResponse {
  status: 'success';
  data: AdminEmployeesResponseData;
  message: string;
}

// Create Employee types
export interface CreateEmployeePayload {
  branch_id: string;
  employee_first_name: string;
  employee_last_name: string;
  mobile_number: string;
  email: string;
  employee_code: string;
  department: string;
}

export interface CreateEmployeeResponseData {
  employee: CrmEmployee;
}

export interface CreateEmployeeResponse {
  status: 'success';
  data: CreateEmployeeResponseData;
  message: string;
}

// Admin: Update Employee Role
export interface UpdateEmployeeRolePayload {
  id: number;
  role: string;
}

export interface UpdateEmployeeRoleResponse {
  status: 'success';
  data: {};
  message: string;
}

// Admin: Update Employee
export interface UpdateEmployeePayload {
  employee_first_name: string;
  employee_last_name: string;
  employee_code: number;
  email: string;
  mobile_number: string;
  department: string;
  is_active: boolean;
}

export interface UpdateEmployeeResponseData {
  employee: CrmEmployee;
}

export interface UpdateEmployeeResponse {
  status: 'success';
  data: UpdateEmployeeResponseData;
  message: string;
}

// Admin: Branches list
export interface BranchCity {
  id: number;
  city_name: string;
  city_slug: string;
  city_code: string;
  branch_count: number;
  is_active: boolean;
  meta: Record<string, any>;
}

export interface BranchState {
  id: number;
  state_name: string;
  state_code: string;
  country: string;
  is_active: boolean;
}

export interface Branch {
  id: number;
  branch_name: string;
  branch_code: string;
  address: string;
  pin_code: string;
  is_active: boolean;
  city: BranchCity;
  state: BranchState;
  meta?: Record<string, any>;
}

export interface AdminBranchesPagination {
  page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
  next_page: number | null;
  prev_page: number | null;
}

export interface AdminBranchesResponseData {
  branches: Branch[];
  pagination?: AdminBranchesPagination;
}

export interface AdminBranchesResponse {
  status: 'success';
  data: AdminBranchesResponseData;
  message: string;
}

export interface CreateBranchPayload {
  branch_name: string;
  branch_code: string;
  address: string;
  pin_code: string;
  city_id: string | number;
  is_active: boolean;
  meta?: Record<string, any>;
}

export interface UpdateBranchPayload {
  branch_name: string;
  branch_code: string;
  address: string;
  pin_code: string;
  city_id: string | number;
  is_active: boolean;
  meta?: Record<string, any>;
}

// Admin: States list and CRUD
export interface AdminState {
  id: number;
  state_name: string;
  state_code: string;
  country: string;
  is_active: boolean;
}

export interface AdminStatesPagination {
  page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
  next_page: number | null;
  prev_page: number | null;
}

export interface AdminStatesResponseData {
  states: AdminState[];
  pagination: AdminStatesPagination;
}

export interface AdminStatesResponse {
  status: 'success';
  data: AdminStatesResponseData;
  message: string;
}

export interface CreateStatePayload {
  state_name: string;
  state_code: string;
}

export interface UpdateStatePayload {
  state_name: string;
  is_active: boolean;
  state_code: string;
}

export interface CreateStateResponse {
  status: 'success';
  data: AdminState;
  message: string;
}

export interface UpdateStateResponse {
  status: 'success';
  data: AdminState;
  message: string;
}

// Admin: Cities list and CRUD
export interface AdminCityState {
  id: number;
  state_name: string;
  state_code: string;
  country: string;
  is_active: boolean;
}

export interface AdminCityMeta {
  [key: string]: any;
}

export interface AdminCity {
  id: number;
  city_name: string;
  city_slug: string;
  city_code: string;
  branch_count: number;
  is_active: boolean;
  meta: AdminCityMeta;
  state: AdminCityState;
}

export interface AdminCitiesPagination {
  page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
  next_page: number | null;
  prev_page: number | null;
}

export interface AdminCitiesResponseData {
  cities: AdminCity[];
  pagination: AdminCitiesPagination;
}

export interface AdminCitiesResponse {
  status: 'success';
  data: AdminCitiesResponseData;
  message: string;
}

export interface CreateCityPayload {
  city_name: string;
  city_code: string;
  state_id: number;
}

export interface UpdateCityPayload {
  city_name: string;
  city_code: string;
  state_id: number;
  is_active: boolean;
  city_slug?: string;
}

export interface CreateCityResponse {
  status: 'success';
  data: AdminCity;
  message: string;
}

export interface UpdateCityResponse {
  status: 'success';
  data: AdminCity;
  message: string;
}
export interface ReceiptBranchMeta {
  branch_in_charge_name?: string;
  branch_in_charge_phone_number?: number | string;
  branch_in_charge_address?: string;
  branch_in_charge_email?: string;
  branch_in_charge_employee_code?: string;
  cm_asm_name?: string;
  cm_asm_code?: number | string;
  cm_asm_email?: string;
  cm_asm_mobile_number?: number | string;
  cm_asm_address?: string;
  [key: string]: any;
}

export interface ReceiptBranchInfo {
  id: number;
  branch_name: string;
  branch_code: string;
  address: string;
  pin_code: string;
  is_active: boolean;
  meta?: ReceiptBranchMeta;
}

export interface ReceiptEmployeeInfo {
  id: number;
  employee_first_name: string;
  employee_last_name: string;
  employee_code: string;
  email: string;
  mobile_number: string;
  department: string;
  login_at: string | null;
  deactivated_at: string | null;
  is_active: boolean;
  roles?: string[];
}

export interface ReceiptStateInfo {
  id: number;
  state_name: string;
  state_code: string;
  country: string;
  is_active: boolean;
}
export interface ReceiptScoringRoleInfo {
  id: number;
  min_days: number;
  max_days: number;
  description: string;
  score: number;
  is_active: boolean;
}

export interface CashChequeReceipt {
  id: number;
  loan_no: string;
  customer_name: string;
  customer_mobile_no: string;
  created_date: string;
  payment_date: string;
  payment_month: string;
  emi_amount_paid: string;
  late_payment_charges_paid: string;
  bounce_charges_paid: string;
  penalty_charges_paid: string;
  other_charges_paid: string;
  total_amount_paid: string;
  charges: any | null;
  payment_mode: string;
  payment_status: string;
  payment_channel: string;
  receipt_purpose: string | null;
  lms_receipt_id: number | null;
  lms_req_id_updated_at: string | null;
  deposit_amount: string | number | null;
  deposit_status: string | null;
  deposit_date: string | null;
  gap_in_days?: number | null;
  tat_status?: string | null;
  is_over_tat?: boolean;
  scoring_rules_id?: number | null;
  branch_name: string;
  collected_by_name: string | null;
  collected_by_id: number | null;
  state_name: string | null;
  created_at: string;
  updated_at: string;
  branch?: ReceiptBranchInfo;
  employee?: ReceiptEmployeeInfo;
  state?: ReceiptStateInfo;
  scoring_rule?: ReceiptScoringRoleInfo;
}

export interface AdminReceiptsPagination {
  page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
  next_page: number | null;
  prev_page: number | null;
}

export interface AdminReceiptsResponseData {
  receipts: CashChequeReceipt[];
  pagination: AdminReceiptsPagination;
}

export interface HolidayItem {
  id: number;
  holiday_date: string;
  holiday_name: string;
  state_id?: number | null;
  state_name?: string | null;
  type: string;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HolidayListResponse {
  status: string;
  data: {
    holidays: HolidayItem[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_count: number;
      per_page: number;
    };
    summary: {
      total_year: number;
      upcoming: number;
    };
  };
}

// Dashboard Stats interfaces
export interface DashboardStatItem {
  total: number;
  active?: number;
  mapped?: number;
  label: string;
  description: string;
}

export interface DashboardStatsData {
  branches: DashboardStatItem;
  states: DashboardStatItem;
  cities: DashboardStatItem;
  employees: DashboardStatItem;
}

export interface DashboardStatsResponse {
  status: 'success';
  data: DashboardStatsData;
  message: string;
}

// Branch Inspection interfaces
export interface BranchInspectionInfo {
  branch_name: string;
  branch_address: string;
  company_name: string;
  in_charge_code: string;
  cm_asm_code: string;
  inspection_date: string;
  inspection_officials: string;
}

export interface InspectionChecklistItem {
  code: string;
  section: string;
  description: string;
  marks_carry: number;
  marks_obtained: number;
  percentage: number;
  total_receipts?: number;
  scored_receipts?: number;
  average_score?: number;
  visitorComment?: string;
  immediateAction?: string;
  lastReply?: string;
  department?: string;
}

export interface InspectionDataItem {
  section: string;
  section_code?: string;
  marks_carry: number;
  marks_obtained: number;
  percentage: number;
  total_receipts: number;
  scored_receipts: number;
  average_score: number;
  checklist_items?: InspectionChecklistItem[];
}

export interface PerformanceMetrics {
  total_receipts: number;
  total_amount: string;
  average_processing_days: number;
  score_distribution: Record<string, number>;
  receipts_with_scores: number;
}

export interface LatestFeedback {
  feedback_thread: {
    id: number;
    score_point_code: string;
    section: string;
    visitor_comment: string | null;
    immediate_action: string | null;
    inspection_month: string;
    created_at: string;
    updated_at: string;
  };
  last_reply: {
    id: number;
    author_type: string;
    author_name: string;
    text: string;
    created_at: string;
    employee?: {
      id: number;
      employee_first_name: string;
      employee_last_name: string;
      employee_code: string;
      email: string;
    };
  } | null;
}

export interface BranchInspectionData {
  inspection_id?: number;
  branch_info: BranchInspectionInfo;
  inspection_data: InspectionDataItem[];
  performance_metrics: PerformanceMetrics;
  latest_feedback?: LatestFeedback;
  checklist_data?: InspectionChecklistItem[];
  summary?: {
    process_marks_carry: number;
    process_marks_obtained: number;
    process_score_pct: number;
    final_grade: string;
  };
}

export interface BranchInspectionResponse {
  status: 'success';
  data: BranchInspectionData;
  message: string;
}

// Feedback Thread interfaces
export interface FeedbackReply {
  id: number;
  author_type: 'admin' | 'branch' | 'super_admin';
  author_name: string;
  text: string;
  created_at: string;
}

export interface FeedbackBranchMeta {
  branch_in_charge_name?: string;
  branch_in_charge_phone_number?: string;
  branch_in_charge_address?: string;
  branch_in_charge_email?: string;
  branch_in_charge_employee_code?: string;
  cm_asm_name?: string;
  cm_asm_mobile_number?: string;
  cm_asm_address?: string;
  cm_asm_email?: string;
  cm_asm_code?: string;
}

export interface FeedbackBranch {
  id: number;
  branch_name: string;
  branch_code: string;
  address: string;
  pin_code: string;
  is_active: boolean;
  meta: FeedbackBranchMeta;
}

export interface FeedbackThread {
  id: number;
  score_point_code: string;
  section: string;
  visitor_comment: string | null;
  immediate_action: string | null;
  inspection_month: string;
  created_at: string;
  updated_at: string;
  replies: FeedbackReply[];
  branch: FeedbackBranch;
}

export interface FeedbackStats {
  total: number;
  with_replies: number;
  pending: number;
}

export interface FeedbackPagination {
  page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
  next_page: number | null;
  prev_page: number | null;
}

export interface FeedbackThreadsResponseData {
  feedback_threads: FeedbackThread[];
  stats: FeedbackStats;
  pagination: FeedbackPagination;
}

export interface FeedbackThreadsResponse {
  status: 'success';
  data: FeedbackThreadsResponseData;
  message: string;
}

export interface CreateFeedbackThreadPayload {
  score_point_code: string;
  section: string;
  visitor_comment?: string;
  immediate_action?: string;
  inspection_month: string;
  marks_obtained?: number;
}

export interface CreateFeedbackReplyPayload {
  text: string;
}

export interface FeedbackReplyResponse {
  status: 'success';
  data: FeedbackReply;
  message: string;
}

export interface AdminReceiptsResponse {
  status: 'success';
  data: AdminReceiptsResponseData;
  message: string;
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// HTTP client configuration
const createHeaders = (additionalHeaders: Record<string, string> = {}): Headers => {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  
  // Add any additional headers
  Object.entries(additionalHeaders).forEach(([key, value]) => {
    headers.append(key, value);
  });
  
  return headers;
};

// Generic API request function
export const makeApiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    method: 'GET',
    headers: createHeaders(),
    redirect: 'follow',
    signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
  };

  const requestOptions = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, requestOptions);
    
    // Parse response text first
    const responseText = await response.text();
    
    // Try to parse as JSON, fallback to text
    let responseData: ApiResponse<any>;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // If parsing fails, create a generic error response
      responseData = createFailureResponse(['Invalid response format']);
    }

    // Check if the API returned a failure status
    if (responseData.status === 'failure') {
      const errorMessage = responseData.errors?.length 
        ? responseData.errors.join(', ')
        : 'API request failed';
      
      throw new ApiError(
        errorMessage,
        response.status,
        'API_FAILURE'
      );
    }

    // Check HTTP status for non-200 responses
    if (!response.ok) {
      const errorMessage = isSuccessResponse(responseData) 
        ? responseData.message 
        : `HTTP ${response.status}`;
      throw new ApiError(
        errorMessage,
        response.status,
        'HTTP_ERROR'
      );
    }

    return responseData as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, 'TIMEOUT');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new ApiError('Network error. Please check your connection.', 0, 'NETWORK_ERROR');
      }
    }
    
    throw new ApiError('An unexpected error occurred', 500, 'UNKNOWN_ERROR');
  }
};

// Specific API functions
export const authApi = {
  /**
   * Request OTP for mobile number
   */
  requestOtp: async (mobileNumber: string): Promise<OtpRequestResponse> => {
    // Validate mobile number format
    const cleanNumber = mobileNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      throw new ApiError('Please enter a valid mobile number', 400, 'INVALID_MOBILE');
    }

    const payload: OtpRequestPayload = {
      mobile_number: cleanNumber,
    };

    return makeApiRequest<OtpRequestResponse>(
      API_ENDPOINTS.AUTH.REQUEST_OTP,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Verify OTP (placeholder for future implementation)
   */
  verifyOtp: async (mobileNumber: string, otp: string): Promise<VerifyOtpResponse> => {
    const payload: VerifyOtpPayload = {
      mobile_number: mobileNumber.replace(/\D/g, ''),
      otp: otp,
    };

    return makeApiRequest<VerifyOtpResponse>(
      API_ENDPOINTS.AUTH.VERIFY_OTP,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Validate employee roles using the current auth token
   */
  validateEmployeeRoles: async (): Promise<ValidateRolesResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    return makeApiRequest<ValidateRolesResponse>(
      API_ENDPOINTS.AUTH.VALIDATE_ROLES,
      {
        method: 'GET',
        headers: createHeaders({ Authorization: token }),
      }
    );
  },
};

export const adminApi = {
  /**
   * Get list of employees (admin-only)
   */
  getEmployees: async (params?: { page?: number; per_page?: number; q?: string; role?: string; status?: string }): Promise<AdminEmployeesResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    let endpoint: string = API_ENDPOINTS.ADMIN.EMPLOYEES as string;
    if (params) {
      const search = new URLSearchParams();
      if (typeof params.page === 'number') search.set('page', String(params.page));
      if (typeof params.per_page === 'number') search.set('per_page', String(params.per_page));
      if (params.q && params.q.trim()) search.set('q', params.q.trim());
      if (params.role && params.role !== 'all') search.set('role', params.role);
      if (params.status && params.status !== 'all') search.set('status', params.status);
      const qs = search.toString();
      if (qs) endpoint = `${endpoint}?${qs}`;
    }

    return makeApiRequest<AdminEmployeesResponse>(
      endpoint,
      {
        method: 'GET',
        headers: createHeaders({ Authorization: token }),
      }
    );
  },
  /**
   * Import cash/cheque receipts via CSV upload (admin-only)
   * Note: Uses multipart/form-data, do not set Content-Type header manually.
   */
  importCashChequeReceipts: async (
    file: File,
    options?: { async?: boolean }
  ): Promise<ApiSuccessResponse<any>> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    const search = new URLSearchParams();
    if (options?.async) search.set('async', 'true');
    const endpoint = `${API_ENDPOINTS.ADMIN.CASH_CHEQUE_RECEIPTS}/import${search.toString() ? `?${search.toString()}` : ''}`;

    const form = new FormData();
    form.append('file', file);

    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: new Headers({ Authorization: token }),
      body: form,
      redirect: 'follow',
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    });

    const text = await response.text();
    let data: ApiResponse<any>;
    try {
      data = JSON.parse(text);
    } catch {
      data = createFailureResponse(['Invalid response format']);
    }

    if (data.status === 'failure') {
      const errorMessage = data.errors?.length ? data.errors.join(', ') : 'API request failed';
      throw new ApiError(errorMessage, response.status, 'API_FAILURE');
    }
    if (!response.ok) {
      const errorMessage = isSuccessResponse(data) ? data.message : `HTTP ${response.status}`;
      throw new ApiError(errorMessage, response.status, 'HTTP_ERROR');
    }

    return data as ApiSuccessResponse<any>;
  },

  /**
   * Create a new employee (admin-only)
   */
  createEmployee: async (payload: CreateEmployeePayload): Promise<CreateEmployeeResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    return makeApiRequest<CreateEmployeeResponse>(
      API_ENDPOINTS.ADMIN.EMPLOYEES,
      {
        method: 'POST',
        headers: createHeaders({ Authorization: token }),
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Get list of branches (admin-only)
   */
  getBranches: async (params?: { page?: number; per_page?: number; q?: string }): Promise<AdminBranchesResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    let endpoint: string = API_ENDPOINTS.ADMIN.BRANCHES as string;
    if (params) {
      const search = new URLSearchParams();
      if (typeof params.page === 'number') search.set('page', String(params.page));
      if (typeof params.per_page === 'number') search.set('per_page', String(params.per_page));
      if (params.q && params.q.trim()) search.set('q', params.q.trim());
      const qs = search.toString();
      if (qs) endpoint = `${endpoint}?${qs}`;
    }

    return makeApiRequest<AdminBranchesResponse>(
      endpoint,
      {
        method: 'GET',
        headers: createHeaders({ Authorization: token }),
      }
    );
  },

  /**
   * Create a branch (admin-only)
   */
  createBranch: async (payload: CreateBranchPayload): Promise<ApiSuccessResponse<Branch>> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    return makeApiRequest<ApiSuccessResponse<Branch>>(
      API_ENDPOINTS.ADMIN.BRANCHES,
      {
        method: 'POST',
        headers: createHeaders({ Authorization: token }),
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Update a branch (admin-only)
   */
  updateBranch: async (id: string | number, payload: UpdateBranchPayload): Promise<ApiSuccessResponse<Branch>> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    return makeApiRequest<ApiSuccessResponse<Branch>>(
      `${API_ENDPOINTS.ADMIN.BRANCHES}/${id}`,
      {
        method: 'PUT',
        headers: createHeaders({ Authorization: token }),
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Update employee role (admin-only)
   */
  updateEmployeeRole: async (payload: UpdateEmployeeRolePayload): Promise<UpdateEmployeeRoleResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    return makeApiRequest<UpdateEmployeeRoleResponse>(
      API_ENDPOINTS.ADMIN.UPDATE_EMPLOYEE_ROLE,
      {
        method: 'POST',
        headers: createHeaders({ Authorization: token }),
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Update employee details (admin-only)
   */
  updateEmployee: async (id: string, payload: UpdateEmployeePayload): Promise<UpdateEmployeeResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    const endpoint = API_ENDPOINTS.ADMIN.UPDATE_EMPLOYEE(id);

    return makeApiRequest<UpdateEmployeeResponse>(
      endpoint,
      {
        method: 'PUT',
        headers: createHeaders({ Authorization: token }),
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Get list of states (admin-only)
   */
  getStates: async (params?: { page?: number; per_page?: number; q?: string }): Promise<AdminStatesResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    let endpoint: string = API_ENDPOINTS.ADMIN.STATES as string;
    if (params) {
      const search = new URLSearchParams();
      if (typeof params.page === 'number') search.set('page', String(params.page));
      if (typeof params.per_page === 'number') search.set('per_page', String(params.per_page));
      if (params.q && params.q.trim()) search.set('q', params.q.trim());
      const qs = search.toString();
      if (qs) endpoint = `${endpoint}?${qs}`;
    }

    return makeApiRequest<AdminStatesResponse>(
      endpoint,
      {
        method: 'GET',
        headers: createHeaders({ Authorization: token }),
      }
    );
  },

  /**
   * Create a state (admin-only)
   */
  createState: async (payload: CreateStatePayload): Promise<CreateStateResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    return makeApiRequest<CreateStateResponse>(
      API_ENDPOINTS.ADMIN.STATES,
      {
        method: 'POST',
        headers: createHeaders({ Authorization: token }),
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Update a state (admin-only)
   */
  updateState: async (id: string | number, payload: UpdateStatePayload): Promise<UpdateStateResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    return makeApiRequest<UpdateStateResponse>(
      API_ENDPOINTS.ADMIN.UPDATE_STATE(id),
      {
        method: 'PUT',
        headers: createHeaders({ Authorization: token }),
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Get list of cities (admin-only)
   */
  getCities: async (params?: { page?: number; per_page?: number; q?: string }): Promise<AdminCitiesResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    let endpoint: string = API_ENDPOINTS.ADMIN.CITIES as string;
    if (params) {
      const search = new URLSearchParams();
      if (typeof params.page === 'number') search.set('page', String(params.page));
      if (typeof params.per_page === 'number') search.set('per_page', String(params.per_page));
      if (params.q && params.q.trim()) search.set('q', params.q.trim());
      const qs = search.toString();
      if (qs) endpoint = `${endpoint}?${qs}`;
    }

    return makeApiRequest<AdminCitiesResponse>(
      endpoint,
      {
        method: 'GET',
        headers: createHeaders({ Authorization: token }),
      }
    );
  },

  /**
   * Create a city (admin-only)
   */
  createCity: async (payload: CreateCityPayload): Promise<CreateCityResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    return makeApiRequest<CreateCityResponse>(
      API_ENDPOINTS.ADMIN.CITIES,
      {
        method: 'POST',
        headers: createHeaders({ Authorization: token }),
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Update a city (admin-only)
   */
  updateCity: async (id: string | number, payload: UpdateCityPayload): Promise<UpdateCityResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    return makeApiRequest<UpdateCityResponse>(
      API_ENDPOINTS.ADMIN.UPDATE_CITY(id),
      {
        method: 'PUT',
        headers: createHeaders({ Authorization: token }),
        body: JSON.stringify(payload),
      }
    );
  },
  /**
   * Get cash/cheque receipts (admin-only)
   */
  getCashChequeReceipts: async (params?: {
    page?: number;
    per_page?: number;
    payment_date_from?: string;
    payment_date_to?: string;
    branch_id?: number | string;
    city_id?: number | string;
    state_id?: number | string;
    employee_id?: number | string;
    payment_status?: string;
    deposit_status?: string;
    payment_mode?: string;
    payment_channel?: string;
    amount_min?: number | string;
    amount_max?: number | string;
    q?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    month?: number;
    year?: number;
    month_filter_field?: 'deposit_date' | 'payment_date' | 'created_date';
  }): Promise<AdminReceiptsResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    let endpoint: string = API_ENDPOINTS.ADMIN.CASH_CHEQUE_RECEIPTS as string;
    if (params) {
      const search = new URLSearchParams();
      if (typeof params.page === 'number') search.set('page', String(params.page));
      if (typeof params.per_page === 'number') search.set('per_page', String(params.per_page));
      if (params.payment_date_from) search.set('payment_date_from', params.payment_date_from);
      if (params.payment_date_to) search.set('payment_date_to', params.payment_date_to);
      if (params.branch_id != null && params.branch_id !== '') search.set('branch_id', String(params.branch_id));
      if (params.city_id != null && params.city_id !== '') search.set('city_id', String(params.city_id));
      if (params.state_id != null && params.state_id !== '') search.set('state_id', String(params.state_id));
      if (params.employee_id != null && params.employee_id !== '') search.set('employee_id', String(params.employee_id));
      if (params.payment_status) search.set('payment_status', params.payment_status);
      if (params.deposit_status) search.set('deposit_status', params.deposit_status);
      if (params.payment_mode) search.set('payment_mode', params.payment_mode);
      if (params.payment_channel) search.set('payment_channel', params.payment_channel);
      if (params.amount_min != null && params.amount_min !== '') search.set('amount_min', String(params.amount_min));
      if (params.amount_max != null && params.amount_max !== '') search.set('amount_max', String(params.amount_max));
      if (params.q && params.q.trim()) search.set('q', params.q.trim());
      if (params.sort_by) search.set('sort_by', params.sort_by);
      if (params.sort_dir) search.set('sort_dir', params.sort_dir);
      if (params.month != null) search.set('month', String(params.month));
      if (params.year != null) search.set('year', String(params.year));
      if (params.month_filter_field) search.set('month_filter_field', params.month_filter_field);
      const qs = search.toString();
      if (qs) endpoint = `${endpoint}?${qs}`;
    }

    return makeApiRequest<AdminReceiptsResponse>(endpoint, {
      method: 'GET',
      headers: createHeaders({ Authorization: token }),
    });
  },
  /**
   * Get a single cash/cheque receipt by ID (admin-only)
   */
  getCashChequeReceiptById: async (
    id: string | number
  ): Promise<ApiSuccessResponse<CashChequeReceipt>> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    const raw = await makeApiRequest<ApiSuccessResponse<any>>(
      `${API_ENDPOINTS.ADMIN.CASH_CHEQUE_RECEIPTS}/${id}`,
      {
        method: 'GET',
        headers: createHeaders({ Authorization: token }),
      }
    );

    const receipt: CashChequeReceipt =
      (raw as any).data?.receipt ||
      (raw as any).data?.cash_cheque_receipt ||
      (raw as any).data;

    if (!receipt || typeof receipt !== 'object') {
      throw new ApiError('Invalid receipt response', 500, 'INVALID_RESPONSE');
    }

    return createSuccessResponse<CashChequeReceipt>(receipt, (raw as any).message ?? 'OK');
  },
  /**
   * Get scoring rules (paginated)
   */
  getScoringRules: async (params?: { page?: number; per_page?: number }): Promise<any> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }
    let endpoint: string = API_ENDPOINTS.ADMIN.SCORING_RULES as string;
    if (params) {
      const search = new URLSearchParams();
      if (typeof params.page === 'number') search.set('page', String(params.page));
      if (typeof params.per_page === 'number') search.set('per_page', String(params.per_page));
      const qs = search.toString();
      if (qs) endpoint = `${endpoint}?${qs}`;
    }
    return makeApiRequest<any>(endpoint, {
      method: 'GET',
      headers: createHeaders({ Authorization: token }),
    });
  },
  /**
   * Create single scoring rule
   */
  createScoringRule: async (payload: any): Promise<any> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    return makeApiRequest<any>(API_ENDPOINTS.ADMIN.SCORING_RULES, {
      method: 'POST',
      headers: createHeaders({ Authorization: token }),
      body: JSON.stringify(payload),
    });
  },
  /**
   * Update single scoring rule
   */
  updateScoringRule: async (id: string | number, payload: any): Promise<any> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    return makeApiRequest<any>(API_ENDPOINTS.ADMIN.SCORING_RULE(id), {
      method: 'PUT',
      headers: createHeaders({ Authorization: token }),
      body: JSON.stringify(payload),
    });
  },
  /**
   * Bulk sync scoring rules
   */
  syncScoringRules: async (payload: any): Promise<any> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    return makeApiRequest<any>(API_ENDPOINTS.ADMIN.SCORING_RULES_SYNC, {
      method: 'POST',
      headers: createHeaders({ Authorization: token }),
      body: JSON.stringify(payload),
    });
  },

  /**
   * Get dashboard statistics (admin-only)
   */
  getDashboardStats: async (): Promise<DashboardStatsResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    return makeApiRequest<DashboardStatsResponse>(
      API_ENDPOINTS.ADMIN.DASHBOARD_STATS,
      {
        method: 'GET',
        headers: createHeaders({ Authorization: token }),
      }
    );
  },

  /**
   * Get branch inspection report (admin-only)
   * Uses GET request with optional date query parameter
   */
  getBranchInspection: async (branchId: string | number, date?: string): Promise<BranchInspectionResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    // Build endpoint URL with optional date parameter
    let endpoint = API_ENDPOINTS.ADMIN.BRANCH_INSPECTION(branchId);
    if (date) {
      endpoint += `?date=${encodeURIComponent(date)}`;
    }

    return makeApiRequest<BranchInspectionResponse>(
      endpoint,
      {
        method: 'GET',
        headers: createHeaders({ Authorization: token }),
      }
    );
  },

  /**
   * Export branch inspection report as PDF (admin-only)
   * Downloads PDF file for the specified branch and date
   */
  exportBranchInspectionPDF: async (branchId: string | number, date: string): Promise<Blob> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    // Build endpoint URL with date and format parameters
    const endpoint = `${API_ENDPOINTS.ADMIN.BRANCH_INSPECTION(branchId)}?date=${encodeURIComponent(date)}&format=pdf`;
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: createHeaders({ Authorization: token }),
        redirect: 'follow',
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
      });

      if (!response.ok) {
        throw new ApiError(
          `Failed to export PDF: ${response.statusText}`,
          response.status,
          'EXPORT_FAILED'
        );
      }

      return await response.blob();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408, 'TIMEOUT');
        }
        if (error.message.includes('Failed to fetch')) {
          throw new ApiError('Network error. Please check your connection.', 0, 'NETWORK_ERROR');
        }
      }
      
      throw new ApiError('Failed to export PDF', 500, 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get feedback threads for a branch (admin-only)
   * Supports filtering by month
   */
  getFeedbackThreads: async (
    branchId: string | number,
    params?: { month?: string; page?: number; per_page?: number }
  ): Promise<FeedbackThreadsResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    let endpoint = API_ENDPOINTS.ADMIN.FEEDBACK_THREADS(branchId);
    if (params) {
      const search = new URLSearchParams();
      if (params.month) search.set('month', params.month);
      if (typeof params.page === 'number') search.set('page', String(params.page));
      if (typeof params.per_page === 'number') search.set('per_page', String(params.per_page));
      const qs = search.toString();
      if (qs) endpoint = `${endpoint}?${qs}`;
    }

    return makeApiRequest<FeedbackThreadsResponse>(
      endpoint,
      {
        method: 'GET',
        headers: createHeaders({ Authorization: token }),
      }
    );
  },

  /**
   * Create a new feedback thread (admin-only)
   */
  createFeedbackThread: async (
    branchId: string | number,
    payload: CreateFeedbackThreadPayload
  ): Promise<ApiSuccessResponse<FeedbackThread>> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    return makeApiRequest<ApiSuccessResponse<FeedbackThread>>(
      API_ENDPOINTS.ADMIN.FEEDBACK_THREADS(branchId),
      {
        method: 'POST',
        headers: createHeaders({ Authorization: token }),
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Add a reply to a feedback thread
   */
  addFeedbackReply: async (
    threadId: string | number,
    payload: CreateFeedbackReplyPayload
  ): Promise<FeedbackReplyResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    return makeApiRequest<FeedbackReplyResponse>(
      API_ENDPOINTS.ADMIN.FEEDBACK_REPLY(threadId),
      {
        method: 'POST',
        headers: createHeaders({ Authorization: token }),
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Send inspection report to specified email addresses
   */
  sendInspectionReport: async (
    branchId: string | number,
    payload: { email: string[]; date: string }
  ): Promise<ApiSuccessResponse<{ message: string }>> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) {
      throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    }

    return makeApiRequest<ApiSuccessResponse<{ message: string }>>(
      API_ENDPOINTS.ADMIN.SEND_INSPECTION_REPORT(branchId),
      {
        method: 'POST',
        headers: createHeaders({ Authorization: token }),
        body: JSON.stringify(payload),
      }
    );
  },
  getPersonalAccountTransactions: async (params?: { page?: number; per_page?: number; branch_id?: number | string; mobile_number?: string }): Promise<any> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.per_page) search.set('per_page', String(params.per_page));
    if (params?.branch_id) search.set('branch_id', String(params.branch_id));
    if (params?.mobile_number) search.set('mobile_number', params.mobile_number);
    const qs = search.toString();
    const endpoint = `${API_ENDPOINTS.ADMIN.PERSONAL_ACCOUNT_TRANSACTIONS}${qs ? `?${qs}` : ''}`;
    return makeApiRequest(endpoint, {
      method: 'GET',
      headers: createHeaders({ Authorization: token }),
    });
  },
  importPersonalAccountTransactions: async (file: File, branchId?: number | string): Promise<any> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    const form = new FormData();
    form.append('file', file);
    if (branchId) form.append('branch_id', String(branchId));
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ADMIN.PERSONAL_ACCOUNT_TRANSACTIONS}/import`;
    const response = await fetch(url, {
      method: 'POST',
      headers: new Headers({ Authorization: token }),
      body: form,
    });
    return response.json();
  },
  reEvaluateInspection: async (inspectionId: number | string): Promise<any> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    const endpoint = API_ENDPOINTS.ADMIN.RE_EVALUATE_INSPECTION(inspectionId);
    return makeApiRequest(endpoint, {
      method: 'POST',
      headers: createHeaders({ Authorization: token }),
    });
  },
  getHolidays: async (params?: { year?: number; month?: number; search?: string; page?: number; per_page?: number }): Promise<HolidayListResponse> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    const search = new URLSearchParams();
    if (params?.year) search.set('year', String(params.year));
    if (params?.month) search.set('month', String(params.month));
    if (params?.search) search.set('search', params.search);
    if (params?.page) search.set('page', String(params.page));
    if (params?.per_page) search.set('per_page', String(params.per_page));
    const qs = search.toString();
    const endpoint = `${API_ENDPOINTS.ADMIN.HOLIDAYS}${qs ? `?${qs}` : ''}`;
    return makeApiRequest<HolidayListResponse>(endpoint, {
      method: 'GET',
      headers: createHeaders({ Authorization: token }),
    });
  },
  createHoliday: async (payload: { holiday_date: string; holiday_name: string; state_id?: number | null; type?: string; description?: string }): Promise<any> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    return makeApiRequest(API_ENDPOINTS.ADMIN.HOLIDAYS, {
      method: 'POST',
      headers: createHeaders({ Authorization: token }),
      body: JSON.stringify(payload),
    });
  },
  deleteHoliday: async (id: number | string): Promise<any> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    return makeApiRequest(API_ENDPOINTS.ADMIN.HOLIDAY(id), {
      method: 'DELETE',
      headers: createHeaders({ Authorization: token }),
    });
  },
  importHolidays: async (file: File): Promise<any> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    const form = new FormData();
    form.append('file', file);
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ADMIN.HOLIDAYS_IMPORT}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: new Headers({ Authorization: token }),
      body: form,
    });
    return response.json();
  },
  recalculateWorkingDays: async (): Promise<any> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    if (!token) throw new ApiError('Not authenticated', 401, 'NO_TOKEN');
    return makeApiRequest(API_ENDPOINTS.ADMIN.HOLIDAYS_RECALCULATE, {
      method: 'POST',
      headers: createHeaders({ Authorization: token }),
    });
  },
  importTatRecords: async (file: File, branchId?: number | string): Promise<any> => {
    const token = secureStorage.getItem('crm_token') as string | null;
    const form = new FormData();
    form.append('file', file);
    if (branchId) form.append('branch_id', String(branchId));
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ADMIN.TAT_RECORDS_IMPORT}`;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = token;
    const response = await fetch(url, {
      method: 'POST',
      headers: new Headers(headers),
      body: form,
    });
    return response.json();
  },
  getTatRecords: async (params?: { q?: string; branch_id?: number | string; product_name?: string; page?: number; per_page?: number }): Promise<any> => {
    const search = new URLSearchParams();
    if (params?.q) search.set('q', params.q);
    if (params?.branch_id) search.set('branch_id', String(params.branch_id));
    if (params?.product_name) search.set('product_name', params.product_name);
    if (params?.page) search.set('page', String(params.page));
    if (params?.per_page) search.set('per_page', String(params.per_page));
    const qs = search.toString();
    const endpoint = `${API_ENDPOINTS.ADMIN.TAT_RECORDS}${qs ? `?${qs}` : ''}`;
    return makeApiRequest(endpoint, {
      method: 'GET',
    });
  },
  getBranchTatSummary: async (branchId: number | string): Promise<any> => {
    const endpoint = API_ENDPOINTS.ADMIN.TAT_BRANCH_SUMMARY(branchId);
    return makeApiRequest(endpoint, {
      method: 'GET',
    });
  },
};

// Utility functions
export const validateMobileNumber = (mobile: string): boolean => {
  const cleanNumber = mobile.replace(/\D/g, '');
  return cleanNumber.length >= 10 && cleanNumber.length <= 15;
};

export const formatMobileNumber = (mobile: string): string => {
  const cleanNumber = mobile.replace(/\D/g, '');
  if (cleanNumber.length === 10) {
    return cleanNumber;
  }
  if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
    return cleanNumber.substring(2);
  }
  return cleanNumber;
};