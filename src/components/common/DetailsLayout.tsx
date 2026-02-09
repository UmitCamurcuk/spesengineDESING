import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Edit, Save, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Tabs, TabPanel } from '../ui/Tabs';
import { TabConfig } from '../../types/common';
import { useLanguage } from '../../contexts/LanguageContext';
import { useEditActionContext } from '../../contexts/EditActionContext';
import { Dialog } from '../ui/Dialog';
import { cn } from '../../utils/cn';

interface DetailsLayoutProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon: React.ReactNode;
  tabs: TabConfig[];
  defaultTab?: string;
  backUrl?: string;
  headerActions?: React.ReactNode;
  editMode?: boolean;
  hasChanges?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  inlineActions?: boolean;
  onDelete?: () => void | Promise<void>;
  deleteButtonLabel?: string;
  deleteDialogTitle?: string;
  deleteDialogDescription?: string;
  deleteConfirmLabel?: string;
  deleteCancelLabel?: string;
  deleteLoading?: boolean;
  canDelete?: boolean;
  iconContainerClassName?: string;
}

export const DetailsLayout: React.FC<DetailsLayoutProps> = ({
  title,
  subtitle,
  icon,
  tabs,
  defaultTab,
  backUrl,
  headerActions,
  editMode = false,
  hasChanges = false,
  onEdit,
  onSave,
  onCancel,
  inlineActions = true,
  onDelete,
  deleteButtonLabel,
  deleteDialogTitle,
  deleteDialogDescription,
  deleteConfirmLabel,
  deleteCancelLabel,
  deleteLoading = false,
  canDelete = true,
  iconContainerClassName,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { register } = useEditActionContext();
  const visibleTabs = useMemo(() => tabs.filter((tab) => !tab.hidden), [tabs]);
  const initialTabId = useMemo(() => {
    if (defaultTab && visibleTabs.some((tab) => tab.id === defaultTab)) {
      return defaultTab;
    }
    return visibleTabs[0]?.id;
  }, [defaultTab, visibleTabs]);

  const [activeTab, setActiveTab] = useState(initialTabId);

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(initialTabId);
    }
  }, [activeTab, initialTabId, visibleTabs]);

  const activeTabConfig = visibleTabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabConfig?.component;

  const tabsWithBadges = visibleTabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    icon: <tab.icon className="h-4 w-4" />,
    badge: tab.badge,
    disabled: tab.requiresEdit && !editMode && tab.id !== 'details',
  }));

  const editHandlerRef = useRef(onEdit);
  const cancelHandlerRef = useRef(onCancel);
  const saveHandlerRef = useRef(onSave);

  useEffect(() => {
    editHandlerRef.current = onEdit;
  }, [onEdit]);

  useEffect(() => {
    cancelHandlerRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    saveHandlerRef.current = onSave;
  }, [onSave]);

  const triggerEdit = useCallback(() => {
    editHandlerRef.current?.();
  }, []);

  const triggerCancel = useCallback(() => {
    cancelHandlerRef.current?.();
  }, []);

  const triggerSave = useCallback(() => {
    saveHandlerRef.current?.();
  }, []);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = useCallback(() => {
    if (!onDelete) {
      return;
    }
    try {
      const result = onDelete();
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        (result as Promise<unknown>)
          .then(() => {
            setDeleteDialogOpen(false);
          })
          .catch(() => {
            // keep dialog open on failure
          });
      } else {
        setDeleteDialogOpen(false);
      }
    } catch {
      // keep dialog open if delete handler throws
    }
  }, [onDelete]);

  const openDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  useEffect(() => {
    const shouldRegister = !inlineActions && (onEdit || (onDelete && canDelete));
    if (!shouldRegister) {
      register(null);
      return;
    }

    register({
      isEditing: editMode,
      canEdit: Boolean(onEdit) && !editMode,
      canSave: Boolean(onSave) && hasChanges,
      onEdit: onEdit ? triggerEdit : undefined,
      onCancel: onCancel ? triggerCancel : undefined,
      onSave: onSave ? triggerSave : undefined,
      onDeleteRequest: onDelete ? openDeleteDialog : undefined,
      canDelete,
      deleteLabel: deleteButtonLabel,
      deleteLoading,
    });
  }, [
    canDelete,
    deleteButtonLabel,
    deleteLoading,
    editMode,
    hasChanges,
    inlineActions,
    onEdit,
    onDelete,
    onSave,
    onCancel,
    register,
    triggerCancel,
    triggerEdit,
    triggerSave,
    openDeleteDialog,
  ]);

  useEffect(() => () => register(null), [register]);

  const defaultHeaderActions = useMemo(() => {
    if (!inlineActions) {
      return null;
    }
    const actions: React.ReactNode[] = [];

    if (!editMode && onEdit) {
      actions.push(
        <Button key="edit" size="sm" variant="outline" onClick={onEdit} className="flex items-center gap-2">
          <Edit className="h-4 w-4" />
          {t('common.edit')}
        </Button>,
      );
    }

    if (!editMode && onDelete && canDelete) {
      actions.push(
        <Button
          key="delete"
          size="sm"
          variant="outline"
          className="border-error text-error hover:bg-error/5 flex items-center gap-2"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={deleteLoading}
        >
          <Trash2 className="h-4 w-4" />
          {deleteButtonLabel ?? t('common.delete', { defaultValue: 'Delete' })}
        </Button>,
      );
    }

    if (editMode && inlineActions) {
      const editButtons: React.ReactNode[] = [];
      if (onSave) {
        editButtons.push(
          <Button key="save" size="sm" onClick={onSave} disabled={!hasChanges} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {t('common.save')}
          </Button>,
        );
      }
      if (onCancel) {
        editButtons.push(
          <Button key="cancel" size="sm" variant="outline" onClick={onCancel} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            {t('common.cancel')}
          </Button>,
        );
      }
      if (editButtons.length > 0) {
        actions.push(
          <div key="edit-actions" className="flex flex-wrap gap-2">
            {editButtons}
          </div>,
        );
      }
    }

    if (actions.length === 0) {
      return null;
    }

    return <div className="flex flex-wrap gap-2">{actions}</div>;
  }, [
    inlineActions,
    editMode,
    onEdit,
    onDelete,
    canDelete,
    deleteLoading,
    deleteButtonLabel,
    inlineActions,
    onSave,
    hasChanges,
    onCancel,
    t,
  ]);

  const resolvedHeaderActions = headerActions ?? defaultHeaderActions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          {backUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(backUrl)}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
        <div className="flex items-center space-x-3 w-full">
          <div
            className={cn(
              'w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden',
              iconContainerClassName,
            )}
          >
            {icon}
          </div>
          <div className="min-w-0 space-y-1">
            {typeof title === 'string' ? (
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            ) : (
              title
            )}
            {subtitle &&
              (typeof subtitle === 'string' ? (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              ) : (
                subtitle
              ))}
          </div>
        </div>
        </div>

        <div className="flex items-center space-x-3">{resolvedHeaderActions}</div>
      </div>

      {tabsWithBadges.length > 0 ? (
        <Card padding="none" className="overflow-hidden flex flex-col min-h-[calc(100vh-240px)]">
          <div className="px-6 pt-6">
            <Tabs
              tabs={tabsWithBadges}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="underline"
              wrap={false}
            />
          </div>

          <TabPanel className="px-6 pb-6 flex-1">
            {ActiveComponent && (
              <ActiveComponent
                editMode={editMode}
                {...activeTabConfig.props}
              />
            )}
          </TabPanel>
        </Card>
      ) : (
        <Card>
          <div className="px-6 py-8 text-sm text-muted-foreground">
            {t('common.no_results')}
          </div>
        </Card>
      )}

      {onDelete && (
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
          type="danger"
          title={
            deleteDialogTitle ??
            t('common.delete_confirmation_title', { defaultValue: 'Delete Record?' })
          }
          description={
            deleteDialogDescription ??
            t('common.delete_confirmation_message', {
              defaultValue: 'This action cannot be undone. Are you sure you want to continue?',
            })
          }
          confirmText={deleteConfirmLabel ?? t('common.delete', { defaultValue: 'Delete' })}
          cancelText={deleteCancelLabel ?? t('common.cancel', { defaultValue: 'Cancel' })}
        />
      )}
    </div>
  );
};
