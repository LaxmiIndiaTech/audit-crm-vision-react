import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { adminApi, CreateStatePayload } from '@/lib/api';
import { useApi, useApiForm } from '@/hooks/useApi';

export interface UiStateForm {
  id?: number;
  state_name: string;
  state_code: string;
  is_active: boolean;
}

interface StateModalsProps {
  // Add Modal
  isAddModalOpen: boolean;
  onAddModalChange: (open: boolean) => void;
  onStateAdded?: () => void;

  // Edit Modal
  isEditModalOpen: boolean;
  onEditModalChange: (open: boolean) => void;
  editingState: { id: number; state_name: string; state_code: string; is_active: boolean } | null;
  editForm: UiStateForm;
  onEditFormChange: (field: keyof UiStateForm, value: string | boolean) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export const StateModals: React.FC<StateModalsProps> = ({
  isAddModalOpen,
  onAddModalChange,
  onStateAdded,
  isEditModalOpen,
  onEditModalChange,
  editingState,
  editForm,
  onEditFormChange,
  onSaveEdit,
  onCancelEdit,
}) => {
  const [addForm, setAddForm] = useState<UiStateForm>({ state_name: '', state_code: '', is_active: true });
  const createStateApi = useApiForm<any, CreateStatePayload>();

  useEffect(() => {
    if (!isAddModalOpen) setAddForm({ state_name: '', state_code: '', is_active: true });
  }, [isAddModalOpen]);

  const handleAddChange = (field: keyof UiStateForm, value: string) => {
    setAddForm(prev => ({ ...prev, [field]: value }));
    if (createStateApi.error) createStateApi.setError(null);
  };

  const handleCreate = async () => {
    if (!addForm.state_name || !addForm.state_code) {
      createStateApi.setError('Please fill in all required fields');
      return;
    }
    const payload: CreateStatePayload = {
      state_name: addForm.state_name,
      state_code: addForm.state_code,
    };
    await createStateApi.submitForm(
      payload,
      (data) => adminApi.createState(data),
      () => {
        onAddModalChange(false);
        onStateAdded?.();
      }
    );
  };

  return (
    <>
      {/* Add State Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={onAddModalChange}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add State
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add State</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {createStateApi.error && (
              <Alert variant="destructive">
                <AlertDescription>{createStateApi.error}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label>State Name *</Label>
              <Input value={addForm.state_name} onChange={e => handleAddChange('state_name', e.target.value)} />
            </div>
            <div>
              <Label>State Code *</Label>
              <Input value={addForm.state_code} onChange={e => handleAddChange('state_code', e.target.value.toUpperCase())} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onAddModalChange(false)} disabled={createStateApi.isSubmitting}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createStateApi.isSubmitting || !addForm.state_name || !addForm.state_code}>
                {createStateApi.isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit State Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(o) => { if (!o) onCancelEdit(); else onEditModalChange(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit State</DialogTitle>
          </DialogHeader>
          {editingState && (
            <div className="space-y-4">
              <div>
                <Label>State Name *</Label>
                <Input value={editForm.state_name} onChange={e => onEditFormChange('state_name', e.target.value)} />
              </div>
              <div>
                <Label>State Code *</Label>
                <Input value={editForm.state_code} onChange={e => onEditFormChange('state_code', e.target.value.toUpperCase())} />
              </div>
              <div className="flex items-center justify-between py-1">
                <Label htmlFor="state-active">Active</Label>
                <Switch
                  id="state-active"
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
