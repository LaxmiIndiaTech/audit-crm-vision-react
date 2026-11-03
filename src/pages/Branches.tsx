import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { adminApi, ApiError, Branch as ApiBranch, UpdateBranchPayload } from '@/lib/api';
import { BranchFilters, BranchTable, BranchModals } from '@/components/branches';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';

const Branches = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [branches, setBranches] = useState<ApiBranch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<ApiBranch | null>(null);
  const [editForm, setEditForm] = useState<{ branch_name: string; branch_code: string; address: string; pin_code: string; city_id: number | ''; is_active: boolean; meta?: Record<string, any> }>({ branch_name: '', branch_code: '', address: '', pin_code: '', city_id: '', is_active: true, meta: {} });
  const [page, setPage] = useState(1);
  const pageSize = 3;
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const inFlightRef = useRef(false);
  const loadBranches = async (opts?: { page?: number; per_page?: number; q?: string }) => {
    try {
      if (inFlightRef.current) return; // avoid overlapping fetches
      inFlightRef.current = true;
      setLoading(true);
      setError(null);
      const res = await adminApi.getBranches({
        page: opts?.page ?? page,
        per_page: opts?.per_page ?? pageSize,
        q: (opts?.q ?? searchTerm) || undefined,
      });
      const data = res.data as any;
      const list: ApiBranch[] = (data?.branches ?? (Array.isArray(data) ? data : [])) as ApiBranch[];
      setBranches(list);
      const pg = data?.pagination;
      if (pg) {
        setTotalPages(pg.total_pages || 1);
        setTotalCount(pg.total_count || list.length);
      } else {
        setTotalPages(Math.max(1, Math.ceil(list.length / pageSize)));
        setTotalCount(list.length);
      }
      return list;
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Failed to load branches';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return [] as ApiBranch[];
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  // Debounced fetch
  React.useEffect(() => {
    const handle = setTimeout(() => {
      loadBranches({ page, per_page: pageSize, q: searchTerm });
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, searchTerm]);

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const openEdit = (b: ApiBranch) => {
    setEditingBranch(b);
    setEditForm({
      branch_name: b.branch_name,
      branch_code: b.branch_code,
      address: b.address,
      pin_code: b.pin_code,
      city_id: b.city?.id ?? '',
      is_active: b.is_active ?? true,
      meta: b.meta || {},
    });
    setIsEditModalOpen(true);
  };

  const onEditFormChange = (field: 'branch_name' | 'branch_code' | 'address' | 'pin_code' | 'city_id' | 'is_active' | 'meta', value: any) => {
    if (field === 'meta') {
      setEditForm(prev => ({ ...prev, meta: { ...(prev.meta || {}), ...(value || {}) } }));
    } else {
      setEditForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const saveEdit = async () => {
    if (!editingBranch || !editForm.branch_name || !editForm.branch_code || !editForm.address || !editForm.pin_code || !editForm.city_id) return;
    try {
      const payload: UpdateBranchPayload = {
        branch_name: editForm.branch_name,
        branch_code: String(editForm.branch_code).toUpperCase(),
        address: editForm.address,
        pin_code: editForm.pin_code,
        city_id: Number(editForm.city_id),
        is_active: !!editForm.is_active,
        meta: editForm.meta || {},
      };
      const res = await adminApi.updateBranch(editingBranch.id, payload);
      const updated = (res as any)?.data ?? (res as any); // support both shapes
      setBranches(prev => prev.map(b => b.id === updated.id ? updated : b));
      toast({ title: 'Success', description: 'Branch updated successfully' });
      setIsEditModalOpen(false);
      setEditingBranch(null);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Failed to update branch';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleBranchAdded = async () => {
    toast({ title: 'Success', description: 'Branch created successfully' });
    await loadBranches({ page: 1, per_page: pageSize, q: searchTerm });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branches</h1>
          <p className="text-muted-foreground">Manage branch master data.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => navigate('/branches/upload')} 
            variant="outline"
            className="gap-2"
          >
            <FileUp className="h-4 w-4" />
            Upload CSV
          </Button>
          <BranchModals
            isAddModalOpen={isAddModalOpen}
            onAddModalChange={setIsAddModalOpen}
            onBranchAdded={handleBranchAdded}
            isEditModalOpen={isEditModalOpen}
            onEditModalChange={setIsEditModalOpen}
            editingBranch={editingBranch ? { id: editingBranch.id, branch_name: editingBranch.branch_name, branch_code: editingBranch.branch_code, address: editingBranch.address, pin_code: editingBranch.pin_code, city_id: editingBranch.city?.id ?? 0, is_active: editingBranch.is_active, meta: editingBranch.meta || {} } : null}
            editForm={editForm}
            onEditFormChange={onEditFormChange}
            onSaveEdit={saveEdit}
            onCancelEdit={() => { setIsEditModalOpen(false); setEditingBranch(null); }}
          />
        </div>
      </div>

      <BranchFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <BranchTable
        branches={branches}
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

export default Branches;
