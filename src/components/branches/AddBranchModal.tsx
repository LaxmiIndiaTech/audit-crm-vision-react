import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { adminApi, CreateBranchPayload, AdminCity, ApiError } from '@/lib/api';
import { useApiForm } from '@/hooks/useApi';
import { UiBranchForm } from './BranchModals';

interface AddBranchModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBranchAdded?: () => void;
}

export const AddBranchModal: React.FC<AddBranchModalProps> = ({
  isOpen,
  onOpenChange,
  onBranchAdded,
}) => {
  const [addForm, setAddForm] = useState<UiBranchForm>({
    branch_name: '',
    branch_code: '',
    address: '',
    pin_code: '',
    city_id: '',
    is_active: true,
    meta: {},
  });
  const createBranchApi = useApiForm<any, CreateBranchPayload>();
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [citiesLoaded, setCitiesLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAddForm({
        branch_name: '',
        branch_code: '',
        address: '',
        pin_code: '',
        city_id: '',
        is_active: true,
        meta: {},
      });
    }
  }, [isOpen]);

  // Lazy-load cities only when modal opens and we haven't loaded yet
  useEffect(() => {
    if (!isOpen || citiesLoaded) return;
    let active = true;
    (async () => {
      try {
        const res = await adminApi.getCities({ page: 1, per_page: 200 });
        if (!active) return;
        setCities(res.data.cities || []);
        setCitiesLoaded(true);
      } catch (e) {
        console.error('Failed to load cities', e instanceof ApiError ? e.message : e);
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen, citiesLoaded]);

  const handleAddChange = (field: keyof UiBranchForm, value: string | number) => {
    setAddForm(prev => ({ ...prev, [field]: value }));
    if (createBranchApi.error) createBranchApi.setError(null);
  };

  const handleAddMetaChange = (field: keyof NonNullable<UiBranchForm['meta']>, value: string) => {
    setAddForm(prev => ({ ...prev, meta: { ...(prev.meta || {}), [field]: value } }));
    if (createBranchApi.error) createBranchApi.setError(null);
  };

  const handleCreate = async () => {
    if (
      !addForm.branch_name ||
      !addForm.branch_code ||
      !addForm.address ||
      !addForm.pin_code ||
      !addForm.city_id
    ) {
      createBranchApi.setError('Please fill in all required fields');
      return;
    }
    const payload: CreateBranchPayload = {
      branch_name: addForm.branch_name,
      branch_code: addForm.branch_code.toUpperCase(),
      address: addForm.address,
      pin_code: addForm.pin_code,
      city_id: Number(addForm.city_id),
      is_active: !!addForm.is_active,
      meta: addForm.meta || {},
    };
    await createBranchApi.submitForm(
      payload,
      (data) => adminApi.createBranch(data),
      () => {
        onOpenChange(false);
        onBranchAdded?.();
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Branch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Branch</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {createBranchApi.error && (
              <Alert variant="destructive">
                <AlertDescription>{createBranchApi.error}</AlertDescription>
              </Alert>
            )}

            {/* Basic Info Section */}
            <div className="space-y-4">
              <div>
                <Label>Branch Name *</Label>
                <Input
                  value={addForm.branch_name}
                  onChange={(e) => handleAddChange('branch_name', e.target.value)}
                  placeholder="Enter branch name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Branch Code *</Label>
                  <Input
                    value={addForm.branch_code}
                    onChange={(e) => handleAddChange('branch_code', e.target.value.toUpperCase())}
                    placeholder="e.g., SK"
                  />
                </div>
                <div>
                  <Label>PIN Code *</Label>
                  <Input
                    value={addForm.pin_code}
                    onChange={(e) => handleAddChange('pin_code', e.target.value)}
                    placeholder="e.g., 110018"
                  />
                </div>
              </div>
              <div>
                <Label>Address *</Label>
                <Input
                  value={addForm.address}
                  onChange={(e) => handleAddChange('address', e.target.value)}
                  placeholder="Enter full address"
                />
              </div>
              <div>
                <Label>City *</Label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm bg-white"
                  value={addForm.city_id}
                  onChange={(e) => handleAddChange('city_id', Number(e.target.value))}
                >
                  <option value="">Select city</option>
                  {cities
                    .filter((c) => c.is_active !== false)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.city_name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex items-center justify-between py-2 bg-slate-50 px-3 rounded">
                <Label htmlFor="branch-active" className="mb-0">
                  Active Status
                </Label>
                <Switch
                  id="branch-active"
                  checked={!!addForm.is_active}
                  onCheckedChange={(checked) =>
                    setAddForm((prev) => ({ ...prev, is_active: checked }))
                  }
                />
              </div>
            </div>

            {/* Branch Incharge Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <div className="w-1 h-5 bg-blue-500 rounded"></div>
                <h4 className="font-semibold text-sm">Branch In-Charge Details</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded">
                <div>
                  <Label>In-Charge Name</Label>
                  <Input
                    value={addForm.meta?.branch_in_charge_name || ''}
                    onChange={(e) => handleAddMetaChange('branch_in_charge_name', e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label>In-Charge Email</Label>
                  <Input
                    type="email"
                    value={addForm.meta?.branch_in_charge_email || ''}
                    onChange={(e) => handleAddMetaChange('branch_in_charge_email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    maxLength={10}
                    value={addForm.meta?.branch_in_charge_phone_number || ''}
                    onChange={(e) => handleAddMetaChange('branch_in_charge_phone_number', e.target.value)}
                    placeholder="10-digit number"
                  />
                </div>
                <div>
                  <Label>Employee Code</Label>
                  <Input
                    value={addForm.meta?.branch_in_charge_employee_code || ''}
                    onChange={(e) => handleAddMetaChange('branch_in_charge_employee_code', e.target.value)}
                    placeholder="e.g., EMP12345"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={addForm.meta?.branch_in_charge_address || ''}
                    onChange={(e) => handleAddMetaChange('branch_in_charge_address', e.target.value)}
                    placeholder="Residential address"
                  />
                </div>
              </div>
            </div>

            {/* CM/ASM Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <div className="w-1 h-5 bg-purple-500 rounded"></div>
                <h4 className="font-semibold text-sm">CM/ASM Details</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-purple-50 p-4 rounded">
                <div>
                  <Label>CM/ASM Name</Label>
                  <Input
                    value={addForm.meta?.cm_asm_name || ''}
                    onChange={(e) => handleAddMetaChange('cm_asm_name', e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={addForm.meta?.cm_asm_email || ''}
                    onChange={(e) => handleAddMetaChange('cm_asm_email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label>Mobile Number</Label>
                  <Input
                    type="tel"
                    maxLength={10}
                    value={addForm.meta?.cm_asm_mobile_number || ''}
                    onChange={(e) => handleAddMetaChange('cm_asm_mobile_number', e.target.value)}
                    placeholder="10-digit number"
                  />
                </div>
                <div>
                  <Label>CM/ASM Code</Label>
                  <Input
                    value={addForm.meta?.cm_asm_code || ''}
                    onChange={(e) => handleAddMetaChange('cm_asm_code', e.target.value)}
                    placeholder="Code/ID"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={addForm.meta?.cm_asm_address || ''}
                    onChange={(e) => handleAddMetaChange('cm_asm_address', e.target.value)}
                    placeholder="Residential address"
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createBranchApi.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              createBranchApi.isSubmitting ||
              !addForm.branch_name ||
              !addForm.branch_code ||
              !addForm.pin_code ||
              !addForm.address ||
              !addForm.city_id
            }
          >
            {createBranchApi.isSubmitting ? 'Creating...' : 'Create Branch'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
