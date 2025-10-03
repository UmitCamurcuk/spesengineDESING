import React, { useState } from 'react';
import { X, FileText, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';

interface Change {
  field: string;
  oldValue: string | number | boolean;
  newValue: string | number | boolean;
}

interface ChangeConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  changes: Change[];
  title?: string;
  loading?: boolean;
  entityName?: string;
}

export const ChangeConfirmDialog: React.FC<ChangeConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  changes,
  title = 'Confirm Changes',
  loading = false,
  entityName = 'item',
}) => {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleConfirm = () => {
    if (!comment.trim()) {
      setError('Comment is required to save changes');
      return;
    }

    if (comment.trim().length < 3) {
      setError('Comment must be at least 3 characters');
      return;
    }

    onConfirm(comment.trim());
  };

  const handleClose = () => {
    setComment('');
    setError('');
    onClose();
  };

  const formatValue = (value: string | number | boolean) => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === '' || value === null || value === undefined) {
      return '—';
    }
    return String(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-popover rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 fade-in duration-200 border border-border">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b border-border">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and comment on your changes to {entityName}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Changes Summary */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">
                Changes Summary
              </h4>
              <Badge variant="secondary" size="sm">
                {changes.length} {changes.length === 1 ? 'change' : 'changes'}
              </Badge>
            </div>

            <div className="space-y-2">
              {changes.map((change, index) => (
                <div
                  key={index}
                  className="p-3 bg-muted border border-border rounded-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground mb-1.5">
                        {change.field}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-0.5">Old Value</div>
                          <div className="text-sm text-foreground font-mono bg-background px-2 py-1 rounded border border-border">
                            {formatValue(change.oldValue)}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-muted-foreground">→</div>
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-0.5">New Value</div>
                          <div className="text-sm text-primary font-mono bg-primary/10 px-2 py-1 rounded border border-primary/20">
                            {formatValue(change.newValue)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comment Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-semibold text-foreground">
                Change Comment
              </h4>
              <Badge variant="error" size="sm">Required</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Describe the reason for these changes. This will be saved in the change history.
            </p>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError('');
              }}
              placeholder="e.g., Updated product price based on market research, Fixed typo in description, etc."
              rows={4}
              className={cn(
                'w-full px-3 py-2 text-sm bg-background text-foreground border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none',
                error
                  ? 'border-error focus:border-error focus:ring-error/20'
                  : 'border-input focus:border-ring focus:ring-ring/20'
              )}
              disabled={loading}
            />
            {error && (
              <div className="flex items-center gap-1.5 mt-2 text-error">
                <AlertCircle className="h-3.5 w-3.5" />
                <p className="text-xs">{error}</p>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-2 p-3 bg-info-background border border-primary/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-info flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-foreground font-medium">
                Why is a comment required?
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Comments help track the history of changes and provide context for future reference.
                This ensures transparency and accountability in your data management.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-muted">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            loading={loading}
            disabled={!comment.trim() || loading}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
