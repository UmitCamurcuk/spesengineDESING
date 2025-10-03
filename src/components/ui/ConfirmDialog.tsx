import React from 'react';
import { AlertTriangle, Trash2, Info, CheckCircle } from 'lucide-react';
import { Dialog, DialogType } from './Dialog';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = (props) => {
  return <Dialog {...props} />;
};

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
  loading?: boolean;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  itemName,
  itemType = 'item',
  loading = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      type="danger"
      title={`Delete ${itemType}?`}
      description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmText="Delete"
      cancelText="Cancel"
      loading={loading}
    />
  );
};
