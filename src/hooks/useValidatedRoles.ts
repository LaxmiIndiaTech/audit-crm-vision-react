import { authApi, ApiError } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import secureStorage from "react-secure-storage";

export interface UseValidatedRolesResult {
  roles: string[] | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useValidatedRoles = (enabled: boolean = true): UseValidatedRolesResult => {
  const token = typeof window !== 'undefined' ? (secureStorage.getItem('crm_token') as string | null) : null;
  const query = useQuery<string[], ApiError>({
    queryKey: ['validatedRoles', token],
    queryFn: async () => {
      const res = await authApi.validateEmployeeRoles();
      return res.data?.roles ?? [];
    },
    enabled: enabled && !!token,
    // Reduce chatter: cache and reuse for a while
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (React Query v5: gcTime replaces cacheTime)
    refetchOnWindowFocus: false,
  });

  return {
    roles: query.data ?? null,
    // Treat fetching as loading to avoid using potentially stale cached roles for gating
    isLoading: query.isLoading || query.isFetching,
    error: query.error ? (query.error.message || 'Failed to validate access rights') : null,
    refresh: async () => { await query.refetch(); },
  };
};

export default useValidatedRoles;
