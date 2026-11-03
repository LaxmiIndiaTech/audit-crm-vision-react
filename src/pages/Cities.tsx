import React, { useState } from 'react';
import { adminApi, ApiError, AdminCity, UpdateCityPayload } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CityFilters, CityTable, CityModals } from '@/components/cities';

const Cities = () => {
  const { toast } = useToast();
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<AdminCity | null>(null);
  const [editForm, setEditForm] = useState<{ city_name: string; city_code: string; state_id: number | ''; is_active: boolean }>({ city_name: '', city_code: '', state_id: '', is_active: true });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const inFlightRef = React.useRef(false);
  const loadCities = async (opts?: { page?: number; per_page?: number; q?: string }) => {
    try {
      if (inFlightRef.current) return; // avoid overlap
      inFlightRef.current = true;
      setLoading(true);
      setError(null);
      const res = await adminApi.getCities({
        page: opts?.page ?? page,
        per_page: opts?.per_page ?? pageSize,
        q: (opts?.q ?? searchTerm) || undefined,
      });
      setCities(res.data.cities);
      const pg = res.data.pagination;
      setTotalPages(pg?.total_pages || 1);
      return res.data;
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Failed to load cities';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return { cities: [] } as any;
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  // Initial fetch is handled by the debounced effect below

  // Debounced fetch on page/searchTerm
  React.useEffect(() => {
    const controller = new AbortController();
    const handle = setTimeout(() => {
      loadCities({ page, per_page: pageSize, q: searchTerm });
    }, 250);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, searchTerm]);

  // Reset page on search change only
  React.useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const openEdit = (ct: AdminCity) => {
    setEditingCity(ct);
    setEditForm({ city_name: ct.city_name, city_code: ct.city_code, state_id: ct.state?.id ?? '', is_active: ct.is_active ?? true });
    setIsEditModalOpen(true);
  };

  const onEditFormChange = (field: 'city_name' | 'city_code' | 'state_id' | 'is_active', value: string | number | boolean) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    if (!editingCity || !editForm.city_name || !editForm.city_code || !editForm.state_id) return;
    try {
      const payload: UpdateCityPayload = {
        city_name: editForm.city_name,
        city_code: String(editForm.city_code).toUpperCase(),
        state_id: Number(editForm.state_id),
        is_active: !!editForm.is_active,
      };
      const res = await adminApi.updateCity(editingCity.id, payload);
      const updatedCity: any = (res as any)?.data?.city ?? (res as any)?.data;
      setCities(prev => prev.map(c => c.id === updatedCity.id ? updatedCity : c));
      toast({ title: 'Success', description: 'City updated successfully' });
      setIsEditModalOpen(false);
      setEditingCity(null);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Failed to update city';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleCityAdded = async () => {
    toast({ title: 'Success', description: 'City created successfully' });
    await loadCities({ page: 1, per_page: pageSize, q: searchTerm });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cities</h1>
          <p className="text-muted-foreground">Manage city master data.</p>
        </div>
        <CityModals
          isAddModalOpen={isAddModalOpen}
          onAddModalChange={setIsAddModalOpen}
          onCityAdded={handleCityAdded}
          isEditModalOpen={isEditModalOpen}
          onEditModalChange={setIsEditModalOpen}
          editingCity={editingCity ? { id: editingCity.id, city_name: editingCity.city_name, city_code: editingCity.city_code, state_id: editingCity.state?.id ?? 0, is_active: editingCity.is_active } : null}
          editForm={editForm}
          onEditFormChange={onEditFormChange}
          onSaveEdit={saveEdit}
          onCancelEdit={() => { setIsEditModalOpen(false); setEditingCity(null); }}
        />
      </div>

      <CityFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <CityTable
        cities={cities}
        isLoading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={openEdit}
      />
    </div>
  );
};

export default Cities;
