import React, { useRef, useState } from 'react';
import { adminApi, ApiError, AdminState, UpdateStatePayload } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { StateFilters, StateTable, StateModals } from '@/components/states';

const States = () => {
  const { toast } = useToast();
  const [states, setStates] = useState<AdminState[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<AdminState | null>(null);
  const [editForm, setEditForm] = useState<{ state_name: string; state_code: string; is_active: boolean }>({ state_name: '', state_code: '', is_active: true });
  const [page, setPage] = useState(1);
  const pageSize = 3;
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const inFlightRef = useRef(false);
  const loadStates = async (opts?: { page?: number; per_page?: number; q?: string }) => {
    try {
      if (inFlightRef.current) return; // avoid overlapping fetches
      inFlightRef.current = true;
      setLoading(true);
      setError(null);
      const res = await adminApi.getStates({
        page: opts?.page ?? page,
        per_page: opts?.per_page ?? pageSize,
        q: (opts?.q ?? searchTerm) || undefined,
      });
      setStates(res.data.states);
      const pg = res.data.pagination;
      if (pg) {
        setTotalPages(pg.total_pages || 1);
        setTotalCount(pg.total_count || res.data.states.length);
      } else {
        setTotalPages(Math.max(1, Math.ceil(res.data.states.length / pageSize)));
        setTotalCount(res.data.states.length);
      }
      return res.data;
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Failed to load states';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return { states: [] } as any;
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  // Debounced single fetch effect
  React.useEffect(() => {
    const handle = setTimeout(() => {
      loadStates({ page, per_page: pageSize, q: searchTerm });
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, searchTerm]);

  // Reset page on search change; fetch handled by debounced effect above
  React.useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const openEdit = (st: AdminState) => {
    setEditingState(st);
    setEditForm({ state_name: st.state_name, state_code: st.state_code, is_active: st.is_active ?? true });
    setIsEditModalOpen(true);
  };

  const onEditFormChange = (field: 'state_name' | 'state_code' | 'is_active', value: string | boolean) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    if (!editingState) return;
    try {
      const payload: UpdateStatePayload = { state_name: editForm.state_name, state_code: editForm.state_code, is_active: editForm.is_active };
      const res = await adminApi.updateState(editingState.id, payload);
      // Update in-place
      setStates(prev => prev.map(s => s.id === res.data.id ? res.data : s));
      toast({ title: 'Success', description: 'State updated successfully' });
      setIsEditModalOpen(false);
      setEditingState(null);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Failed to update state';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleStateAdded = async () => {
    toast({ title: 'Success', description: 'State created successfully' });
    await loadStates({ page: 1, per_page: pageSize, q: searchTerm });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">States</h1>
          <p className="text-muted-foreground">Manage state master data.</p>
        </div>
        {/* Add / Edit Modals */}
        <StateModals
          isAddModalOpen={isAddModalOpen}
          onAddModalChange={setIsAddModalOpen}
          onStateAdded={handleStateAdded}
          isEditModalOpen={isEditModalOpen}
          onEditModalChange={setIsEditModalOpen}
          editingState={editingState ? { id: editingState.id, state_name: editingState.state_name, state_code: editingState.state_code, is_active: editingState.is_active } : null}
          editForm={editForm}
          onEditFormChange={onEditFormChange}
          onSaveEdit={saveEdit}
          onCancelEdit={() => { setIsEditModalOpen(false); setEditingState(null); }}
        />
      </div>

      {/* Filters */}
      <StateFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Table */}
      <StateTable
        states={states}
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

export default States;
