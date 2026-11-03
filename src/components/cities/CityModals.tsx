import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { adminApi, CreateCityPayload, UpdateCityPayload, AdminState, ApiError } from '@/lib/api';
import { useApiForm } from '@/hooks/useApi';

export interface UiCityForm {
  id?: number;
  city_name: string;
  city_code: string;
  state_id: number | '';
  is_active: boolean;
}

interface CityModalsProps {
  // Add Modal
  isAddModalOpen: boolean;
  onAddModalChange: (open: boolean) => void;
  onCityAdded?: () => void;

  // Edit Modal
  isEditModalOpen: boolean;
  onEditModalChange: (open: boolean) => void;
  editingCity: { id: number; city_name: string; city_code: string; state_id: number; is_active: boolean } | null;
  editForm: UiCityForm;
  onEditFormChange: (field: keyof UiCityForm, value: string | number | boolean) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export const CityModals: React.FC<CityModalsProps> = ({
  isAddModalOpen,
  onAddModalChange,
  onCityAdded,
  isEditModalOpen,
  onEditModalChange,
  editingCity,
  editForm,
  onEditFormChange,
  onSaveEdit,
  onCancelEdit,
}) => {
  const [addForm, setAddForm] = useState<UiCityForm>({ city_name: '', city_code: '', state_id: '', is_active: true });
  const [states, setStates] = useState<AdminState[]>([]);
  const createCityApi = useApiForm<any, CreateCityPayload>();

  useEffect(() => {
    if (!isAddModalOpen) setAddForm({ city_name: '', city_code: '', state_id: '', is_active: true });
  }, [isAddModalOpen]);

  useEffect(() => {
    // Fetch states only when a modal is opened and we don't already have them
    if ((isAddModalOpen || isEditModalOpen) && states.length === 0) {
      const fetchStates = async () => {
        try {
          const res = await adminApi.getStates({ page: 1, per_page: 100 });
          setStates(res.data.states);
        } catch (e) {
          // non-blocking: leave states empty on error
          console.error('Failed to load states', e instanceof ApiError ? e.message : e);
        }
      };
      fetchStates();
    }
  }, [isAddModalOpen, isEditModalOpen, states.length]);

  const handleAddChange = (field: keyof UiCityForm, value: string | number) => {
    setAddForm(prev => ({ ...prev, [field]: value }));
    if (createCityApi.error) createCityApi.setError(null);
  };

  const handleCreate = async () => {
    if (!addForm.city_name || !addForm.city_code || !addForm.state_id) {
      createCityApi.setError('Please fill in all required fields');
      return;
    }
    const payload: CreateCityPayload = {
      city_name: addForm.city_name,
      city_code: String(addForm.city_code).toUpperCase(),
      state_id: Number(addForm.state_id),
    };
    await createCityApi.submitForm(
      payload,
      (data) => adminApi.createCity(data),
      () => {
        onAddModalChange(false);
        onCityAdded?.();
      }
    );
  };

  return (
    <>
      {/* Add City Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={onAddModalChange}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add City
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add City</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {createCityApi.error && (
              <Alert variant="destructive">
                <AlertDescription>{createCityApi.error}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label>City Name *</Label>
              <Input value={addForm.city_name} onChange={e => handleAddChange('city_name', e.target.value)} />
            </div>
            <div>
              <Label>City Code *</Label>
              <Input value={addForm.city_code} onChange={e => handleAddChange('city_code', e.target.value.toUpperCase())} />
            </div>
            <div>
              <Label>State *</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={addForm.state_id}
                onChange={e => handleAddChange('state_id', Number(e.target.value))}
              >
                <option value="">Select state</option>
                {states.filter(s => s.is_active !== false).map(s => (
                  <option key={s.id} value={s.id}>{s.state_name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onAddModalChange(false)} disabled={createCityApi.isSubmitting}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createCityApi.isSubmitting || !addForm.city_name || !addForm.city_code || !addForm.state_id}>
                {createCityApi.isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit City Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(o) => { if (!o) onCancelEdit(); else onEditModalChange(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit City</DialogTitle>
          </DialogHeader>
          {editingCity && (
            <div className="space-y-4">
              <div>
                <Label>City Name *</Label>
                <Input value={editForm.city_name} onChange={e => onEditFormChange('city_name', e.target.value)} />
              </div>
              <div>
                <Label>City Code *</Label>
                <Input value={editForm.city_code} onChange={e => onEditFormChange('city_code', e.target.value.toUpperCase())} />
              </div>
              <div>
                <Label>State *</Label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={editForm.state_id}
                  onChange={e => onEditFormChange('state_id', Number(e.target.value))}
                >
                  <option value="">Select state</option>
                  {states.filter(s => s.is_active !== false).map(s => (
                    <option key={s.id} value={s.id}>{s.state_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between py-1">
                <Label htmlFor="city-active">Active</Label>
                <Switch
                  id="city-active"
                  checked={!!editForm.is_active}
                  onCheckedChange={(checked) => onEditFormChange('is_active', checked)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onCancelEdit}>Cancel</Button>
                <Button onClick={onSaveEdit}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
