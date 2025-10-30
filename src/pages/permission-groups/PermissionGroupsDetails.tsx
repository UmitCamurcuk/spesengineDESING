import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FolderTree,
  FileText,
  Layers,
  Code,
  BookOpen,
  History as HistoryIcon,
  Loader2,
  Search,
  Shield,
  Plus,
} from 'lucide-react';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { permissionGroupsService } from '../../api/services/permission-groups.service';
import { permissionsService } from '../../api/services/permissions.service';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { PERMISSIONS } from '../../config/permissions';
import type {
  PermissionGroupRecord,
  PermissionRecord,
  LanguageOption,
  PermissionGroupUpdateRequest,
  LocalizationRecord,
} from '../../api/types/api.types';
import type { TabConfig } from '../../types/common';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { APITester } from '../../components/common/APITester';
import { Documentation } from '../../components/common/Documentation';
import { HistoryTable } from '../../components/common/HistoryTable';
import { ChangeConfirmDialog } from '../../components/ui/ChangeConfirmDialog';

type GroupForm = {
  translations: {
    name: Record<string, string>;
    description: Record<string, string>;
  };
  displayOrder: number;
  logo: string;
};

type ChangeItem = {
  field: string;
  oldValue: string | number | boolean;
  newValue: string | number | boolean;
};

const fallbackLanguages: LanguageOption[] = [
  { code: 'tr', label: 'Turkish', required: true },
  { code: 'en', label: 'English', required: false },
];

const normalizeLanguageCode = (code: string): string => {
  const trimmed = code.trim();
  if (!trimmed.includes('-')) {
    return trimmed.toLowerCase();
  }
  const [language, region] = trimmed.split('-', 2);
  return `${language.toLowerCase()}-${(region ?? '').toUpperCase()}`;
};

const getTranslationValue = (record: LocalizationRecord | null, languageCode: string): string => {
  if (!record) {
    return '';
  }
  const normalized = normalizeLanguageCode(languageCode);
  for (const [key, value] of Object.entries(record.translations ?? {})) {
    if (normalizeLanguageCode(key) === normalized) {
      return value;
    }
  }
  return '';
};

const buildTranslationState = (
  languages: LanguageOption[],
  record: LocalizationRecord | null,
): Record<string, string> => {
  const result: Record<string, string> = {};
  languages.forEach((language) => {
    const normalized = normalizeLanguageCode(language.code);
    result[normalized] = getTranslationValue(record, language.code);
  });
  return result;
};

const cloneGroupForm = (form: GroupForm): GroupForm => ({
  translations: {
    name: { ...form.translations.name },
    description: { ...form.translations.description },
  },
  displayOrder: form.displayOrder,
  logo: form.logo,
});

const normalizeGroupForm = (form: GroupForm): GroupForm => ({
  translations: {
    name: Object.fromEntries(
      Object.entries(form.translations.name).map(([key, value]) => [key, value.trim()]),
    ),
    description: Object.fromEntries(
      Object.entries(form.translations.description).map(([key, value]) => [key, value.trim()]),
    ),
  },
  displayOrder: form.displayOrder,
  logo: form.logo.trim(),
});

const translationsEqual = (a: Record<string, string>, b: Record<string, string>): boolean => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] ?? '').trim() !== (b[key] ?? '').trim()) {
      return false;
    }
  }
  return true;
};

const groupFormsEqual = (a: GroupForm, b: GroupForm): boolean => {
  const normalizedA = normalizeGroupForm(a);
  const normalizedB = normalizeGroupForm(b);
  return (
    normalizedA.displayOrder === normalizedB.displayOrder &&
    normalizedA.logo === normalizedB.logo &&
    translationsEqual(normalizedA.translations.name, normalizedB.translations.name) &&
    translationsEqual(normalizedA.translations.description, normalizedB.translations.description)
  );
};

interface GroupDetailsTabProps {
  form: GroupForm;
  editMode: boolean;
  onChange: (updater: (prev: GroupForm) => GroupForm) => void;
  languages: LanguageOption[];
  metadata: {
    id: string;
    createdAt: string;
    updatedAt: string;
  };
}

const GroupDetailsTab: React.FC<GroupDetailsTabProps> = ({ form, editMode, onChange, languages, metadata }) => {
  const { t } = useLanguage();

  const handleTranslationChange = (
    field: 'name' | 'description',
    languageCode: string,
    value: string,
  ) => {
    const normalized = normalizeLanguageCode(languageCode);
    onChange((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [field]: {
          ...prev.translations[field],
          [normalized]: value,
        },
      },
    }));
  };

  const handleFieldChange = (field: keyof GroupForm, value: string | number) => {
    onChange((prev) => ({
      ...prev,
      [field]: field === 'displayOrder' ? Number(value) : value,
    }));
  };

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <CardHeader
          title={t('permissionGroups.details.basic_information')}
          subtitle={t('permissionGroups.details.basic_information_subtitle')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('permissionGroups.fields.display_order')}
            type="number"
            value={form.displayOrder}
            onChange={(event) => handleFieldChange('displayOrder', event.target.value)}
            disabled={!editMode}
          />
          <Input
            label={t('permissionGroups.fields.logo_url')}
            value={form.logo}
            onChange={(event) => handleFieldChange('logo', event.target.value)}
            placeholder="https://example.com/logo.svg"
            disabled={!editMode}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mt-4">
          <div>
            <span className="font-medium text-foreground block">
              {t('permissionGroups.fields.identifier')}
            </span>
            <code className="text-xs font-mono bg-muted px-2 py-1 rounded-lg mt-1 block">
              {metadata.id}
            </code>
          </div>
          <div>
            <span className="font-medium text-foreground block">
              {t('permissionGroups.fields.created_at')}
            </span>
            <span className="mt-1 block">{new Date(metadata.createdAt).toLocaleString()}</span>
          </div>
          <div>
            <span className="font-medium text-foreground block">
              {t('permissionGroups.fields.updated_at')}
            </span>
            <span className="mt-1 block">{new Date(metadata.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader
          title={t('permissionGroups.fields.name_translations')}
          subtitle={t('permissionGroups.fields.name_translations_subtitle')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {languages.map((language) => {
            const normalized = normalizeLanguageCode(language.code);
            return (
              <Input
                key={`name-${normalized}`}
                label={`${t('permissionGroups.fields.name')} (${language.label})`}
                value={form.translations.name[normalized] ?? ''}
                onChange={(event) => handleTranslationChange('name', language.code, event.target.value)}
                disabled={!editMode}
              />
            );
          })}
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader
          title={t('permissionGroups.fields.description_translations')}
          subtitle={t('permissionGroups.fields.description_translations_subtitle')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {languages.map((language) => {
            const normalized = normalizeLanguageCode(language.code);
            return (
              <div key={`description-${normalized}`}>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {t('permissionGroups.fields.description')} ({language.label})
                </label>
                <textarea
                  value={form.translations.description[normalized] ?? ''}
                  onChange={(event) => handleTranslationChange('description', language.code, event.target.value)}
                  rows={editMode ? 4 : 3}
                  className="w-full px-3 py-2 text-sm bg-background text-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:bg-muted resize-none"
                  disabled={!editMode}
                />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

interface GroupPermissionsTabProps {
  editMode: boolean;
  permissions: PermissionRecord[];
  assignedIds: string[];
  baselineAssigned: Set<string>;
  reassignmentTargets: Record<string, string>;
  onToggle: (permission: PermissionRecord, enabled: boolean) => void;
  onReassign: (permissionId: string, groupId: string) => void;
  groups: PermissionGroupRecord[];
  currentGroupId: string;
}

interface AddPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: PermissionRecord[];
  assignedIds: string[];
  onSelect: (permissionIds: string[]) => void;
}

const AddPermissionsModal: React.FC<AddPermissionsModalProps> = ({
  isOpen,
  onClose,
  permissions,
  assignedIds,
  onSelect,
}) => {
  const { t, resolveLocalization } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [namespaceFilter, setNamespaceFilter] = useState('');

  const assignedSet = useMemo(() => new Set(assignedIds), [assignedIds]);

  // Filter out already assigned permissions
  const availablePermissions = useMemo(() => {
    return permissions.filter((perm) => !assignedSet.has(perm.id));
  }, [permissions, assignedSet]);

  // Filter and search
  const filteredPermissions = useMemo(() => {
    let filtered = availablePermissions;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((perm) => {
        const code = perm.code?.toLowerCase() || '';
        const name = perm.name?.toLowerCase() || '';
        const localizationName = resolveLocalization(perm.nameLocalizationId)?.toLowerCase() || '';
        return code.includes(query) || name.includes(query) || localizationName.includes(query);
      });
    }

    if (namespaceFilter) {
      filtered = filtered.filter((perm) => {
        const parts = perm.code?.split('.') || [];
        return parts[0]?.toLowerCase() === namespaceFilter.toLowerCase();
      });
    }

    return filtered.sort((a, b) => a.code.localeCompare(b.code));
  }, [availablePermissions, searchQuery, namespaceFilter, resolveLocalization]);

  // Extract unique namespaces
  const namespaces = useMemo(() => {
    const nsSet = new Set<string>();
    availablePermissions.forEach((perm) => {
      const parts = perm.code?.split('.') || [];
      if (parts[0]) {
        nsSet.add(parts[0]);
      }
    });
    return Array.from(nsSet).sort();
  }, [availablePermissions]);

  const handleToggleSelection = (permissionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredPermissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPermissions.map((p) => p.id)));
    }
  };

  const handleAdd = () => {
    if (selectedIds.size > 0) {
      onSelect(Array.from(selectedIds));
      setSelectedIds(new Set());
      setSearchQuery('');
      setNamespaceFilter('');
      onClose();
    }
  };

  const columns = useMemo(() => [
    {
      key: 'select',
      title: '',
      width: '50px',
      align: 'center' as const,
      render: (_: any, permission: PermissionRecord) => (
        <Checkbox
          checked={selectedIds.has(permission.id)}
          onChange={() => handleToggleSelection(permission.id)}
          size="sm"
        />
      ),
    },
    {
      key: 'code',
      title: t('permissions.fields.code') || 'Kod',
      sortable: true,
      render: (_: any, permission: PermissionRecord) => (
        <code className="text-xs font-mono text-foreground">{permission.code}</code>
      ),
    },
    {
      key: 'name',
      title: t('permissions.fields.name') || 'İsim',
      sortable: true,
      render: (_: any, permission: PermissionRecord) => (
        <span className="text-xs text-foreground">
          {permission.name?.trim() ||
            resolveLocalization(permission.nameLocalizationId) ||
            permission.nameLocalizationId ||
            '—'}
        </span>
      ),
    },
  ], [selectedIds, t, resolveLocalization]);

  // Reset selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set());
      setSearchQuery('');
      setNamespaceFilter('');
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('permissionGroups.permissions.add_permissions') || 'İzin Ekle'}
      size="xl"
      className="max-h-[90vh]"
    >
      <div className="flex flex-col max-h-[calc(90vh-120px)]">
        <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-2">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder={t('permissionGroups.permissions.search_placeholder') || 'İzin ara...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-3.5 w-3.5" />}
                className="h-8"
              />
            </div>
            {namespaces.length > 0 && (
              <div className="min-w-[180px]">
                <Select
                  value={namespaceFilter}
                  onChange={(e) => setNamespaceFilter(e.target.value)}
                  options={[
                    { value: '', label: t('permissionGroups.permissions.all_namespaces') || 'Tüm namespace\'ler' },
                    ...namespaces.map((ns) => ({ value: ns, label: ns })),
                  ]}
                />
              </div>
            )}
          </div>

          {/* Selection info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t('permissionGroups.permissions.available') || 'Mevcut'}: {filteredPermissions.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="text-primary hover:text-primary-hover font-medium"
              >
                {selectedIds.size === filteredPermissions.length && filteredPermissions.length > 0
                  ? t('common.deselect_all') || 'Tümünü Seçimi Kaldır'
                  : t('common.select_all') || 'Tümünü Seç'}
              </button>
              <span className="text-foreground">
                {t('permissionGroups.permissions.selected') || 'Seçilen'}: {selectedIds.size}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <DataTable
              data={filteredPermissions}
              columns={columns}
              searchable={false}
              showPagination={false}
              pageSize={10}
              emptyState={{
                icon: <Shield className="h-8 w-8" />,
                title: t('permissionGroups.permissions.no_available_permissions') || 'Eklenebilecek izin bulunamadı',
                description: t('permissionGroups.permissions.all_permissions_assigned') || 'Tüm izinler bu gruba zaten atanmış',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-4 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('common.cancel') || 'İptal'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            disabled={selectedIds.size === 0}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            {t('permissionGroups.permissions.add_selected') || 'Seçilenleri Ekle'} ({selectedIds.size})
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const GroupPermissionsTab: React.FC<GroupPermissionsTabProps> = ({
  editMode,
  permissions,
  assignedIds,
  baselineAssigned,
  reassignmentTargets,
  onToggle,
  onReassign,
  groups,
  currentGroupId,
}) => {
  const { t, resolveLocalization } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(!editMode); // Varsayılan: edit mode'da tüm izinleri göster
  const [addModalOpen, setAddModalOpen] = useState(false);

  const assignedSet = useMemo(() => new Set(assignedIds), [assignedIds]);
  const otherGroups = useMemo(
    () => groups.filter((group) => group.id !== currentGroupId),
    [groups, currentGroupId],
  );

  // Update showOnlyAssigned when editMode changes
  useEffect(() => {
    if (!editMode) {
      setShowOnlyAssigned(true); // View mode: only show assigned
    }
  }, [editMode]);

  // Filter permissions: show only assigned ones or all based on toggle
  const filteredPermissions = useMemo(() => {
    let filtered = permissions;
    
    if (showOnlyAssigned) {
      filtered = filtered.filter((perm) => assignedSet.has(perm.id));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((perm) => {
        const code = perm.code?.toLowerCase() || '';
        const name = perm.name?.toLowerCase() || '';
        const localizationName = resolveLocalization(perm.nameLocalizationId)?.toLowerCase() || '';
        return code.includes(query) || name.includes(query) || localizationName.includes(query);
      });
    }

    return filtered.sort((a, b) => a.code.localeCompare(b.code));
  }, [permissions, assignedSet, showOnlyAssigned, searchQuery, resolveLocalization]);

  const assignedPermissionsList = useMemo(
    () => filteredPermissions.filter((perm) => assignedSet.has(perm.id)),
    [filteredPermissions, assignedSet],
  );

  const unassignedPermissionsList = useMemo(
    () => filteredPermissions.filter((perm) => !assignedSet.has(perm.id)),
    [filteredPermissions, assignedSet],
  );

  const handleAddPermissions = (permissionIds: string[]) => {
    permissionIds.forEach((permissionId) => {
      const permission = permissions.find((p) => p.id === permissionId);
      if (permission) {
        onToggle(permission, true);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card padding="lg">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder={t('permissionGroups.permissions.search_placeholder') || 'İzin ara...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-3.5 w-3.5" />}
              className="h-8"
            />
          </div>
          {editMode && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={showOnlyAssigned}
                  onChange={(e) => setShowOnlyAssigned(e.target.checked)}
                  label={t('permissionGroups.permissions.show_only_assigned') || 'Sadece atananları göster'}
                  size="sm"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setAddModalOpen(true)}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
              >
                {t('permissionGroups.permissions.add') || 'Ekle'}
              </Button>
            </>
          )}
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            {t('permissionGroups.permissions.total') || 'Toplam'}: {filteredPermissions.length}
          </span>
          <span>
            {t('permissionGroups.permissions.assigned') || 'Atanmış'}: {assignedPermissionsList.length}
          </span>
          {editMode && (
            <span>
              {t('permissionGroups.permissions.available') || 'Mevcut'}: {unassignedPermissionsList.length}
            </span>
          )}
        </div>
      </Card>

      {/* Assigned Permissions */}
      {assignedPermissionsList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              {t('permissionGroups.permissions.assigned_permissions') || 'Atanmış İzinler'}
            </h3>
            <Badge variant="success" size="sm">{assignedPermissionsList.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {assignedPermissionsList.map((permission) => {
              const wasInitiallyAssigned = baselineAssigned.has(permission.id);
              const reassignmentTarget = reassignmentTargets[permission.id] ?? '';
              const isRemoved = wasInitiallyAssigned && !assignedSet.has(permission.id);

              return (
                <Card
                  key={permission.id}
                  padding="md"
                  className={`transition-all ${
                    isRemoved && editMode
                      ? 'border-error/50 bg-error/5'
                      : 'border-primary/30 bg-primary/5 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Checkbox
                          checked={assignedSet.has(permission.id)}
                          onChange={(e) => onToggle(permission, e.target.checked)}
                          disabled={!editMode}
                          size="sm"
                        />
                        <code className="text-xs font-mono text-foreground font-semibold truncate">
                          {permission.code}
                        </code>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {permission.name?.trim() ||
                          resolveLocalization(permission.nameLocalizationId) ||
                          permission.nameLocalizationId ||
                          '—'}
                      </p>
                    </div>
                  </div>

                  {!assignedSet.has(permission.id) && wasInitiallyAssigned && editMode && otherGroups.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <Select
                        label={t('permissionGroups.permissions.reassign_to') || 'Yeniden ata'}
                        value={reassignmentTarget}
                        onChange={(event) => onReassign(permission.id, event.target.value)}
                        options={[
                          { value: '', label: t('permissionGroups.permissions.select_group') || 'Grup seç...' },
                          ...otherGroups.map((group) => ({
                            value: group.id,
                            label:
                              group.name?.trim() ||
                              resolveLocalization(group.nameLocalizationId) ||
                              group.nameLocalizationId ||
                              group.id,
                          })),
                        ]}
                      />
                    </div>
                  )}

                  {!assignedSet.has(permission.id) && wasInitiallyAssigned && editMode && otherGroups.length === 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-error">
                        {t('permissionGroups.permissions.no_other_groups') || 'Başka grup bulunamadı'}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Permissions (when adding) */}
      {editMode && !showOnlyAssigned && unassignedPermissionsList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              {t('permissionGroups.permissions.available_permissions') || 'Mevcut İzinler'}
            </h3>
            <Badge variant="secondary" size="sm">{unassignedPermissionsList.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unassignedPermissionsList.map((permission) => (
              <Card
                key={permission.id}
                padding="md"
                className="border-border hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Checkbox
                        checked={assignedSet.has(permission.id)}
                        onChange={(e) => onToggle(permission, e.target.checked)}
                        disabled={!editMode}
                        size="sm"
                      />
                      <code className="text-xs font-mono text-foreground font-semibold truncate">
                        {permission.code}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {permission.name?.trim() ||
                        resolveLocalization(permission.nameLocalizationId) ||
                        permission.nameLocalizationId ||
                        '—'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredPermissions.length === 0 && (
        <Card padding="lg">
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-foreground mb-2">
              {t('permissionGroups.permissions.no_results') || 'Sonuç bulunamadı'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? t('permissionGroups.permissions.no_results_description') || 'Arama kriterlerinize uygun izin bulunamadı'
                : t('permissionGroups.permissions.empty_state') || 'Henüz izin bulunmuyor'}
            </p>
          </div>
        </Card>
      )}

      {/* Add Permissions Modal */}
      <AddPermissionsModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        permissions={permissions}
        assignedIds={assignedIds}
        onSelect={handleAddPermissions}
      />
    </div>
  );
};


const ApiTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <APITester entityType="permission-group" entityId={entityId} editMode={editMode} />
);

const DocumentationTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <Documentation entityType="permission-group" entityId={entityId} editMode={editMode} />
);

const HistoryTab: React.FC<{ entityId: string }> = ({ entityId }) => (
  <HistoryTable entityType="PermissionGroup" entityId={entityId} />
);

export function PermissionGroupsDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    t,
    language,
    translationsReady,
    getLocalization,
    resolveLocalization,
  } = useLanguage();
  const { showToast } = useToast();

  const { hasPermission } = useAuth();
  const { settings } = useSettings();

  const supportedLanguages = useMemo<LanguageOption[]>(() => {
    const configured = settings?.localization?.supportedLanguages ?? [];
    if (configured.length === 0) {
      return fallbackLanguages;
    }
    return configured.map((language) => ({
      code: language.code,
      label: language.label,
      required: Boolean(language.required),
    }));
  }, [settings?.localization?.supportedLanguages]);

  const canReadGroup = hasPermission(PERMISSIONS.SYSTEM.PERMISSION_GROUPS.VIEW);
  const canUpdateGroup = hasPermission(PERMISSIONS.SYSTEM.PERMISSION_GROUPS.UPDATE);
  const canViewGroupHistory = hasPermission(PERMISSIONS.SYSTEM.PERMISSION_GROUPS.HISTORY);
  const canReadPermissions = hasPermission(PERMISSIONS.SYSTEM.PERMISSIONS.VIEW);

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<PermissionGroupRecord | null>(null);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [allGroups, setAllGroups] = useState<PermissionGroupRecord[]>([]);

  const [formState, setFormState] = useState<GroupForm | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const groupBaselineRef = useRef<GroupForm | null>(null);
  const [hasFieldChanges, setHasFieldChanges] = useState(false);

  const [assignedPermissions, setAssignedPermissions] = useState<string[]>([]);
  const assignedBaselineRef = useRef<Set<string>>(new Set());
  const [reassignmentTargets, setReassignmentTargets] = useState<Record<string, string>>({});
  const [permissionsChanged, setPermissionsChanged] = useState(false);

  const [pendingChanges, setPendingChanges] = useState<ChangeItem[]>([]);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const translationFnRef = useRef(t);

  useEffect(() => {
    translationFnRef.current = t;
  }, [t]);

  const updateFormState = useCallback(
    (updater: (prev: GroupForm) => GroupForm) => {
      setFormState((prev) => {
        if (!prev) {
          return prev;
        }
        const next = updater(prev);
        if (groupBaselineRef.current) {
          setHasFieldChanges(!groupFormsEqual(next, groupBaselineRef.current));
        }
        return next;
      });
    },
    [],
  );

  const evaluatePermissionsChanged = useCallback(
    (currentAssigned: string[], reassignment: Record<string, string>) => {
      if (!assignedBaselineRef.current) {
        return false;
      }
      const baselineArray = Array.from(assignedBaselineRef.current).sort();
      const currentArray = [...currentAssigned].sort();
      if (baselineArray.length !== currentArray.length) {
        return true;
      }
      for (let i = 0; i < baselineArray.length; i += 1) {
        if (baselineArray[i] !== currentArray[i]) {
          return true;
        }
      }
      return Object.keys(reassignment).length > 0;
    },
    [],
  );

  const loadData = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      setLoading(true);
      const [groupResponse, permissionsResponse, groupsResponse] = await Promise.all([
        permissionGroupsService.getById(id, { language }),
        permissionsService.list({ pageSize: 1000, language }),
        permissionGroupsService.list({ pageSize: 200, language }),
      ]);

      const nameLocalization = groupResponse.nameLocalizationId
        ? getLocalization(groupResponse.nameLocalizationId) ?? null
        : null;
      const descriptionLocalization = groupResponse.descriptionLocalizationId
        ? getLocalization(groupResponse.descriptionLocalizationId) ?? null
        : null;

      if (groupResponse.nameLocalizationId && !nameLocalization) {
        showToast({
          type: 'warning',
          message: translationFnRef.current('permissionGroups.messages.localization_fetch_failed'),
        });
      }

      if (groupResponse.descriptionLocalizationId && !descriptionLocalization) {
        showToast({
          type: 'warning',
          message: translationFnRef.current('permissionGroups.messages.localization_fetch_failed'),
        });
      }

      const form: GroupForm = {
        translations: {
          name: buildTranslationState(supportedLanguages, nameLocalization as LocalizationRecord | null),
          description: buildTranslationState(supportedLanguages, descriptionLocalization as LocalizationRecord | null),
        },
        displayOrder: groupResponse.displayOrder ?? 0,
        logo: groupResponse.logo ?? '',
      };

      groupBaselineRef.current = cloneGroupForm(form);
      setFormState(cloneGroupForm(form));
      setHasFieldChanges(false);
      setIsEditing(false);

      const assigned = permissionsResponse.items
        .filter((permission) => permission.permissionGroupId === groupResponse.id)
        .map((permission) => permission.id);
      assignedBaselineRef.current = new Set(assigned);
      setAssignedPermissions(assigned);
      setReassignmentTargets({});
      setPermissionsChanged(false);

      setGroup(groupResponse);
      setPermissions(permissionsResponse.items);
      setAllGroups(groupsResponse.items);
    } catch (error: any) {
      console.error('Failed to load permission group details', error);
      showToast({
        type: 'error',
        message:
          error?.message || translationFnRef.current('permissionGroups.messages.load_failed'),
      });
      navigate('/permission-groups');
    } finally {
      setLoading(false);
    }
  }, [
    getLocalization,
    id,
    language,
    navigate,
    showToast,
    supportedLanguages,
  ]);

  useEffect(() => {
    if (!translationsReady) {
      return;
    }
    void loadData();
  }, [loadData, translationsReady]);

  const handleTogglePermission = useCallback((permission: PermissionRecord, enabled: boolean) => {
    setAssignedPermissions((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.add(permission.id);
        const nextArray = Array.from(next);
        const { [permission.id]: _removed, ...rest } = reassignmentTargets;
        setReassignmentTargets(rest);
        setPermissionsChanged(evaluatePermissionsChanged(nextArray, rest));
        return nextArray;
      }

      const otherGroups = allGroups.filter((groupRecord) => groupRecord.id !== permission.permissionGroupId);
      if (otherGroups.length === 0) {
        showToast({
          type: 'warning',
          message: t('permissionGroups.messages.no_available_groups'),
        });
        return prev;
      }

      next.delete(permission.id);
      const nextArray = Array.from(next);
      setReassignmentTargets((prevMap) => {
        const updated = {
          ...prevMap,
          [permission.id]: prevMap[permission.id] ?? otherGroups[0].id,
        };
        setPermissionsChanged(evaluatePermissionsChanged(nextArray, updated));
        return updated;
      });

      return nextArray;
    });
  }, [allGroups, evaluatePermissionsChanged, reassignmentTargets, showToast, t]);

  const handleReassignmentChange = useCallback((permissionId: string, groupId: string) => {
    setReassignmentTargets((prev) => {
      const next = {
        ...prev,
        [permissionId]: groupId,
      };
      setPermissionsChanged(evaluatePermissionsChanged(assignedPermissions, next));
      return next;
    });
  }, [assignedPermissions, evaluatePermissionsChanged]);

  const handleEnterEdit = () => {
    if (!canUpdateGroup) {
      return;
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (!groupBaselineRef.current) {
      return;
    }
    setFormState(cloneGroupForm(groupBaselineRef.current));
    setHasFieldChanges(false);
    const baselineArray = Array.from(assignedBaselineRef.current ?? new Set<string>());
    setAssignedPermissions(baselineArray);
    setReassignmentTargets({});
    setPermissionsChanged(false);
    setIsEditing(false);
  };

  const buildChangesList = (): ChangeItem[] => {
    if (!formState || !groupBaselineRef.current) {
      return [];
    }
    const changes: ChangeItem[] = [];
    const normalizedCurrent = normalizeGroupForm(formState);
    const normalizedBaseline = normalizeGroupForm(groupBaselineRef.current);

    if (normalizedCurrent.displayOrder !== normalizedBaseline.displayOrder) {
      changes.push({
        field: t('permissionGroups.fields.display_order'),
        oldValue: normalizedBaseline.displayOrder,
        newValue: normalizedCurrent.displayOrder,
      });
    }

    if (normalizedCurrent.logo !== normalizedBaseline.logo) {
      changes.push({
        field: t('permissionGroups.fields.logo_url'),
        oldValue: normalizedBaseline.logo || '—',
        newValue: normalizedCurrent.logo || '—',
      });
    }

    supportedLanguages.forEach((languageOption) => {
      const code = normalizeLanguageCode(languageOption.code);
      const nameKey = `${t('permissionGroups.fields.name')} (${languageOption.label})`;
      const oldName = normalizedBaseline.translations.name[code] ?? '';
      const newName = normalizedCurrent.translations.name[code] ?? '';
      if (oldName !== newName) {
        changes.push({
          field: nameKey,
          oldValue: oldName || '—',
          newValue: newName || '—',
        });
      }

      const descriptionKey = `${t('permissionGroups.fields.description')} (${languageOption.label})`;
      const oldDescription = normalizedBaseline.translations.description[code] ?? '';
      const newDescription = normalizedCurrent.translations.description[code] ?? '';
      if (oldDescription !== newDescription) {
        changes.push({
          field: descriptionKey,
          oldValue: oldDescription || '—',
          newValue: newDescription || '—',
        });
      }
    });

    if (permissionsChanged) {
      const baselineAssigned = Array.from(assignedBaselineRef.current);
      changes.push({
        field: t('permissionGroups.fields.permissions'),
        oldValue: baselineAssigned.length,
        newValue: assignedPermissions.length,
      });
    }

    return changes;
  };

  const handleSave = () => {
    if (!formState || !groupBaselineRef.current || !group) {
      return;
    }
    const changes = buildChangesList();
    if (changes.length === 0) {
      showToast({ type: 'info', message: t('permissionGroups.messages.no_changes') });
      return;
    }

    if (permissionsChanged) {
      const baseline = assignedBaselineRef.current ?? new Set<string>();
      const assignedSet = new Set(assignedPermissions);
      const removed = Array.from(baseline).filter((id) => !assignedSet.has(id));
      for (const permissionId of removed) {
        if (!reassignmentTargets[permissionId]) {
          showToast({
            type: 'warning',
            message: t('permissionGroups.messages.select_target_group'),
          });
          return;
        }
      }
    }

    setPendingChanges(changes);
    setCommentDialogOpen(true);
  };

  const handleConfirmSave = async (comment: string) => {
    if (!formState || !group || !id) {
      return;
    }

    try {
      setSaving(true);
      const operations: Array<Promise<unknown>> = [];

      const normalizedCurrent = normalizeGroupForm(formState);
      const normalizedBaseline = groupBaselineRef.current
        ? normalizeGroupForm(groupBaselineRef.current)
        : normalizedCurrent;

      const updatePayload: PermissionGroupUpdateRequest = {};
      if (normalizedCurrent.displayOrder !== normalizedBaseline.displayOrder) {
        updatePayload.displayOrder = normalizedCurrent.displayOrder;
      }
      if (normalizedCurrent.logo !== normalizedBaseline.logo) {
        updatePayload.logo = normalizedCurrent.logo || null;
      }
      if (!translationsEqual(normalizedCurrent.translations.name, normalizedBaseline.translations.name)) {
        updatePayload.name = normalizedCurrent.translations.name;
      }
      if (!translationsEqual(normalizedCurrent.translations.description, normalizedBaseline.translations.description)) {
        updatePayload.description = normalizedCurrent.translations.description;
      }

      if (Object.keys(updatePayload).length > 0) {
        operations.push(permissionGroupsService.update(id, updatePayload, comment));
      }

      if (permissionsChanged) {
        const baseline = assignedBaselineRef.current ?? new Set<string>();
        const assignedSet = new Set(assignedPermissions);
        const added = assignedPermissions.filter((permissionId) => !baseline.has(permissionId));
        const removed = Array.from(baseline).filter((permissionId) => !assignedSet.has(permissionId));

        for (const permissionId of added) {
          operations.push(
            permissionsService.update(permissionId, { permissionGroupId: group.id }, comment),
          );
        }

        for (const permissionId of removed) {
          const targetGroupId = reassignmentTargets[permissionId];
          if (!targetGroupId) {
            continue;
          }
          operations.push(
            permissionsService.update(permissionId, { permissionGroupId: targetGroupId }, comment),
          );
        }
      }

      await Promise.all(operations);
      showToast({ type: 'success', message: t('permissionGroups.messages.updated') });

      setCommentDialogOpen(false);
      setPendingChanges([]);
      setIsEditing(false);
      await loadData();
    } catch (error: any) {
      console.error('Failed to update permission group', error);
      showToast({
        type: 'error',
        message: error?.message || t('permissionGroups.messages.update_failed'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCommentDialogClose = () => {
    setCommentDialogOpen(false);
    if (!saving) {
      setPendingChanges([]);
    }
  };

  const tabs = useMemo<TabConfig[]>(() => {
    if (!formState || !group) {
      return [];
    }
    return [
      {
        id: 'details',
        label: t('permissionGroups.tabs.details'),
        icon: FileText,
        component: GroupDetailsTab,
        props: {
          form: formState,
          editMode: isEditing,
          onChange: updateFormState,
          languages: supportedLanguages,
          metadata: {
            id: group.id,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
          },
        },
        hidden: !canReadGroup,
      },
      {
        id: 'permissions',
        label: t('permissionGroups.tabs.permissions'),
        icon: Layers,
        component: GroupPermissionsTab,
        props: {
          editMode: isEditing,
          permissions,
          assignedIds: assignedPermissions,
          baselineAssigned: assignedBaselineRef.current ?? new Set<string>(),
          reassignmentTargets,
          onToggle: handleTogglePermission,
          onReassign: handleReassignmentChange,
          groups: allGroups,
          currentGroupId: group.id,
        },
        hidden: !canReadPermissions,
        badge: assignedPermissions.length.toString(),
      },
      {
        id: 'api',
        label: t('details.tabs.api'),
        icon: Code,
        component: ApiTab,
        props: {
          entityId: group.id,
          editMode: isEditing,
        },
        hidden: !canReadGroup,
      },
      {
        id: 'documentation',
        label: t('details.tabs.documentation'),
        icon: BookOpen,
        component: DocumentationTab,
        props: {
          entityId: group.id,
          editMode: isEditing,
        },
        hidden: !canReadGroup,
      },
      {
        id: 'history',
        label: t('details.tabs.history'),
        icon: HistoryIcon,
        component: HistoryTab,
        props: {
          entityId: group.id,
        },
        hidden: !canViewGroupHistory,
      },
    ];
  }, [
    allGroups,
    assignedPermissions,
    canReadGroup,
    canReadPermissions,
    canViewGroupHistory,
    formState,
    group,
    handleReassignmentChange,
    handleTogglePermission,
    isEditing,
    permissions,
    permissionsChanged,
    reassignmentTargets,
    supportedLanguages,
    t,
    updateFormState,
  ]);

  if (loading || !group || !formState) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <DetailsLayout
        title={
          group.name?.trim() ||
          resolveLocalization(group.nameLocalizationId) ||
          group.nameLocalizationId ||
          t('permissionGroups.details.title')
        }
        subtitle={
          group.description?.trim() ||
          (group.descriptionLocalizationId
            ? resolveLocalization(group.descriptionLocalizationId)
            : '') ||
          group.descriptionLocalizationId ||
          t('permissionGroups.details.subtitle')
        }
        icon={<FolderTree className="h-6 w-6 text-white" />}
        backUrl="/permission-groups"
        tabs={tabs}
        editMode={isEditing}
        hasChanges={hasFieldChanges || permissionsChanged}
        onEdit={canUpdateGroup ? handleEnterEdit : undefined}
        onSave={canUpdateGroup ? handleSave : undefined}
        onCancel={handleCancel}
        inlineActions={false}
      />

      <ChangeConfirmDialog
        open={commentDialogOpen}
        onClose={handleCommentDialogClose}
        onConfirm={handleConfirmSave}
        changes={pendingChanges}
        loading={saving}
        entityName={
          group.name?.trim() ||
          resolveLocalization(group.nameLocalizationId) ||
          group.nameLocalizationId ||
          group.id
        }
      />
    </>
  );
}
