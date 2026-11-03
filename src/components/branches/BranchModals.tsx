import React from "react";
import { AddBranchModal } from "./AddBranchModal";
import { EditBranchModal } from "./EditBranchModal";

export interface UiBranchForm {
  id?: number;
  branch_name: string;
  branch_code: string;
  address: string;
  pin_code: string;
  city_id: number | "";
  is_active: boolean;
  meta?: {
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
  };
}

interface BranchModalsProps {
  // Add Modal
  isAddModalOpen: boolean;
  onAddModalChange: (open: boolean) => void;
  onBranchAdded?: () => void;

  // Edit Modal
  isEditModalOpen: boolean;
  onEditModalChange: (open: boolean) => void;
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
  onEditFormChange: (
    field: keyof UiBranchForm,
    value: string | number | boolean,
  ) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export const BranchModals: React.FC<BranchModalsProps> = ({
  isAddModalOpen,
  onAddModalChange,
  onBranchAdded,
  isEditModalOpen,
  onEditModalChange,
  editingBranch,
  editForm,
  onEditFormChange,
  onSaveEdit,
  onCancelEdit,
}) => {
  return (
    <>
      <AddBranchModal
        isOpen={isAddModalOpen}
        onOpenChange={onAddModalChange}
        onBranchAdded={onBranchAdded}
      />
      <EditBranchModal
        isOpen={isEditModalOpen}
        onOpenChange={onEditModalChange}
        editingBranch={editingBranch}
        editForm={editForm}
        onEditFormChange={onEditFormChange}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
      />
    </>
  );
};
