import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { adminApi, AdminCity, ApiError } from '@/lib/api';
import { UiBranchForm } from './BranchModals';

interface EditBranchModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingBranch: {
    id: number;
    branch_name: string;
    branch_code: string;
    address: string;
    pin_code: string;
    city_id: number;
    is_active: boolean;
    meta?: Record<string, any>;
  } | null;
  editForm: UiBranchForm;
  onEditFormChange: (field: keyof UiBranchForm, value: string | number | boolean) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export const EditBranchModal: React.FC<EditBranchModalProps> = ({
  isOpen,
  onOpenChange,
  editingBranch,
  editForm,
  onEditFormChange,
  onSaveEdit,
  onCancelEdit,
}) => {
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [citiesLoaded, setCitiesLoaded] = useState(false);

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

  const handleMetaChange = (field: keyof NonNullable<UiBranchForm['meta']>, value: string) => {
    onEditFormChange('meta', { ...(editForm.meta || {}), [field]: value } as any);
  };

  if (!editingBranch) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) onCancelEdit();
        else onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Branch</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <div>
                <Label>Branch Name *</Label>
                <Input
                  value={editForm.branch_name}
                  onChange={(e) => onEditFormChange('branch_name', e.target.value)}
                  placeholder="Enter branch name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Branch Code *</Label>
                  <Input
                    value={editForm.branch_code}
                    onChange={(e) => onEditFormChange('branch_code', e.target.value.toUpperCase())}
                    placeholder="e.g., SK"
                  />
                </div>
                <div>
                  <Label>PIN Code *</Label>
                  <Input
                    value={editForm.pin_code}
                    onChange={(e) => onEditFormChange('pin_code', e.target.value)}
                    placeholder="e.g., 110018"
                  />
                </div>
              </div>
              <div>
                <Label>Address *</Label>
                <Input
                  value={editForm.address}
                  onChange={(e) => onEditFormChange('address', e.target.value)}
                  placeholder="Enter full address"
                />
              </div>
              <div>
                <Label>City *</Label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm bg-white"
                  value={editForm.city_id}
                  onChange={(e) => onEditFormChange('city_id', Number(e.target.value))}
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
                <Label htmlFor="branch-active-edit" className="mb-0">
                  Active Status
                </Label>
                <Switch
                  id="branch-active-edit"
                  checked={!!editForm.is_active}
                  onCheckedChange={(checked) => onEditFormChange('is_active', checked)}
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
                    value={editForm.meta?.branch_in_charge_name || ''}
                    onChange={(e) => handleMetaChange('branch_in_charge_name', e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label>In-Charge Email</Label>
                  <Input
                    type="email"
                    value={editForm.meta?.branch_in_charge_email || ''}
                    onChange={(e) => handleMetaChange('branch_in_charge_email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    maxLength={10}
                    value={editForm.meta?.branch_in_charge_phone_number || ''}
                    onChange={(e) => handleMetaChange('branch_in_charge_phone_number', e.target.value)}
                    placeholder="10-digit number"
                  />
                </div>
                <div>
                  <Label>Employee Code</Label>
                  <Input
                    value={editForm.meta?.branch_in_charge_employee_code || ''}
                    onChange={(e) => handleMetaChange('branch_in_charge_employee_code', e.target.value)}
                    placeholder="e.g., EMP12345"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={editForm.meta?.branch_in_charge_address || ''}
                    onChange={(e) => handleMetaChange('branch_in_charge_address', e.target.value)}
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
                    value={editForm.meta?.cm_asm_name || ''}
                    onChange={(e) => handleMetaChange('cm_asm_name', e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editForm.meta?.cm_asm_email || ''}
                    onChange={(e) => handleMetaChange('cm_asm_email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label>Mobile Number</Label>
                  <Input
                    type="tel"
                    maxLength={10}
                    value={editForm.meta?.cm_asm_mobile_number || ''}
                    onChange={(e) => handleMetaChange('cm_asm_mobile_number', e.target.value)}
                    placeholder="10-digit number"
                  />
                </div>
                <div>
                  <Label>CM/ASM Code</Label>
                  <Input
                    value={editForm.meta?.cm_asm_code || ''}
                    onChange={(e) => handleMetaChange('cm_asm_code', e.target.value)}
                    placeholder="Code/ID"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={editForm.meta?.cm_asm_address || ''}
                    onChange={(e) => handleMetaChange('cm_asm_address', e.target.value)}
                    placeholder="Residential address"
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onCancelEdit}>
            Cancel
          </Button>
          <Button onClick={onSaveEdit}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
