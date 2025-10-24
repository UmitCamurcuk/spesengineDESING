import React from 'react';
import { Button } from './Button';
import { Modal } from './Modal';
import { HistoryChange } from '../../types/common';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatHistoryFieldLabel, formatHistoryValue } from '../../utils/historyFormat';

interface ChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  changes: HistoryChange[];
  title?: string;
}

const isImageValue = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith('data:')) {
    return normalized.startsWith('data:image');
  }
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(normalized) || normalized.startsWith('/uploads/');
};

const renderChangeMedia = (value: unknown, label: string) => {
  if (!isImageValue(value)) {
    return null;
  }

  const apiBase = import.meta.env.VITE_ASSET_BASE_URL || import.meta.env.VITE_API_BASE_URL;
  const src = value.startsWith('http') ? value : `${apiBase}${value}`;

  return (
    <img
      src={src}
      alt={label}
      className="h-16 w-16 rounded-md object-cover border border-border"
      referrerPolicy="no-referrer"
    />
  );
};

export const ChangesModal: React.FC<ChangesModalProps> = ({
  isOpen,
  onClose,
  changes,
  title,
}) => {
  const { t } = useLanguage();
  const resolvedTitle = title ?? t('profile.history_modal_title');

  if (!changes || changes.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="md" title={resolvedTitle}>
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">{t('profile.history_modal_no_changes')}</p>
        </div>
      </Modal>
    );
  }

  const changeCountLabel =
    changes.length === 1
      ? t('profile.history_modal_change_count_single')
      : `${changes.length} ${t('profile.history_modal_change_count_multiple')}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={resolvedTitle}>
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">{changeCountLabel}</p>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {changes.map((change, index) => {
            const fieldLabel = formatHistoryFieldLabel(change.field, t);
            const beforeValue = formatHistoryValue(change.field, change.oldValue, t);
            const afterValue = formatHistoryValue(change.field, change.newValue, t);
            const beforeMedia = renderChangeMedia(change.oldValue, `${change.field}-before`);
            const afterMedia = renderChangeMedia(change.newValue, `${change.field}-after`);

            return (
              <div key={`${change.field}-${index}`} className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">
                    {t('profile.history_modal_field_prefix')}: {fieldLabel}
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                      {t('profile.history_modal_before')}
                    </div>
                    <div className="bg-error/10 border border-error/20 rounded-md p-3">
                      <div className="text-error line-through text-sm whitespace-pre-wrap break-words">
                        {beforeMedia ?? beforeValue}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                      {t('profile.history_modal_after')}
                    </div>
                    <div className="bg-success/10 border border-success/20 rounded-md p-3">
                      <div className="text-success text-sm whitespace-pre-wrap break-words">
                        {afterMedia ?? afterValue}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button onClick={onClose}>{t('profile.history_modal_close')}</Button>
        </div>
      </div>
    </Modal>
  );
};
