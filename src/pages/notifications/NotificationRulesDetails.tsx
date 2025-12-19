import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Zap, FileText, BarChart3, Code, BookOpen, History as HistoryIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsService, type NotificationRule } from '../../api/services/notifications.service';
import { localizationsService } from '../../api/services/localizations.service';
import type { TabConfig, APIEndpoint, DocumentationSection } from '../../types/common';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Statistics } from '../../components/common/Statistics';
import { APITester } from '../../components/common/APITester';
import { Documentation } from '../../components/common/Documentation';
import { HistoryTable } from '../../components/common/HistoryTable';
import { ChangeConfirmDialog } from '../../components/ui/ChangeConfirmDialog';
import { PERMISSIONS } from '../../config/permissions';
import { useRequiredLanguages } from '../../hooks/useRequiredLanguages';
import { rolesService } from '../../api/services/roles.service';

type GeneralForm = {
  name: string;
  description: string;
  eventKey: string;
  isActive: boolean;
};

type ChangeItem = {
  field: string;
  oldValue: string | number | boolean;
  newValue: string | number | boolean;
};

type FilterRow = { id: string; field: string; value: string };

type RecipientRow = {
  id: string;
  type: 'user' | 'role' | 'email' | 'webhook';
  value: string;
};

type ChannelRow = {
  id: string;
  channelType: string;
  templateId?: string | null;
  enabled: boolean;
  targetChannel?: string;
  mentionAll?: boolean;
};

const generateRowId = () => Math.random().toString(36).slice(2, 11);

const cloneGeneralForm = (form: GeneralForm): GeneralForm => ({ ...form });

const normalizeGeneralForm = (form: GeneralForm): GeneralForm => ({
  name: form.name.trim(),
  description: form.description.trim(),
  eventKey: form.eventKey.trim(),
  isActive: form.isActive,
});

const generalFormsEqual = (a: GeneralForm, b: GeneralForm): boolean => {
  const normalizedA = normalizeGeneralForm(a);
  const normalizedB = normalizeGeneralForm(b);
  return (
    normalizedA.name === normalizedB.name &&
    normalizedA.description === normalizedB.description &&
    normalizedA.eventKey === normalizedB.eventKey &&
    normalizedA.isActive === normalizedB.isActive
  );
};

const IN_APP_CHANNEL_TYPE = 'in_app';

const filtersToPayload = (rows: FilterRow[]): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  rows.forEach((row) => {
    const key = row.field.trim();
    if (!key) {
      return;
    }
    const value = row.value.trim();
    if (value === '') {
      return;
    }
    result[key] = value;
  });
  return result;
};

const recipientsToPayload = (rows: RecipientRow[]) =>
  rows
    .map((row) => ({ type: row.type, value: row.value.trim() }))
    .filter((row) => row.value.length > 0);

const channelsToPayload = (rows: ChannelRow[]) =>
  rows
    .filter((row) => row.channelType.trim().length > 0)
    .map((row) => {
      const isInApp = row.channelType === IN_APP_CHANNEL_TYPE;
      const settingsOverride: Record<string, unknown> = {};
      if (!isInApp && row.targetChannel?.trim()) {
        settingsOverride.channel = row.targetChannel.trim();
      }
      if (!isInApp && row.mentionAll) {
        settingsOverride.mentionAll = true;
      }
      return {
        channelType: row.channelType,
        templateId: row.templateId ?? undefined,
        enabled: row.enabled,
        settingsOverride: Object.keys(settingsOverride).length ? settingsOverride : undefined,
      };
    });

interface RuleDetailsTabProps {
  form: GeneralForm;
  editMode: boolean;
  filters: FilterRow[];
  recipients: RecipientRow[];
  channels: ChannelRow[];
  onChange: (updater: (prev: GeneralForm) => GeneralForm) => void;
  onFiltersChange: (rows: FilterRow[]) => void;
  onRecipientsChange: (rows: RecipientRow[]) => void;
  onChannelsChange: (rows: ChannelRow[]) => void;
  channelTypeOptions: { value: string; label: string }[];
  templateOptionsByChannel: Map<string, { value: string; label: string }[]>;
  roleOptions: { value: string; label: string }[];
}

const RuleDetailsTab: React.FC<RuleDetailsTabProps> = ({
  form,
  editMode,
  filters,
  recipients,
  channels,
  onChange,
  onFiltersChange,
  onRecipientsChange,
  onChannelsChange,
  channelTypeOptions,
  templateOptionsByChannel,
  roleOptions,
}) => {
  const { t } = useLanguage();

  const handleFieldChange = (field: keyof GeneralForm, value: string | boolean) => {
    onChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <CardHeader
          title={t('notifications.rules.title') ?? 'Rule Information'}
          subtitle="Basic rule properties and trigger configuration"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('notifications.rules.fields.name') ?? 'Rule Name'}
            value={form.name}
            onChange={(event) => handleFieldChange('name', event.target.value)}
            disabled={!editMode}
          />
          <Input
            label={t('notifications.rules.fields.eventKey') ?? 'Event Key'}
            value={form.eventKey}
            onChange={(event) => handleFieldChange('eventKey', event.target.value)}
            disabled={!editMode}
          />
        </div>
        <div className="mt-4">
          <Textarea
            label={t('notifications.rules.fields.description') ?? 'Description'}
            value={form.description}
            onChange={(event) => handleFieldChange('description', event.target.value)}
            rows={3}
            disabled={!editMode}
          />
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => handleFieldChange('isActive', event.target.checked)}
              disabled={!editMode}
            />
            {t('notifications.rules.fields.isActive') ?? 'Active'}
          </label>
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader title="Filtreler" subtitle="Olay verisini süzün" />
        <div className="space-y-3">
          {filters.map((row, index) => (
            <div
              key={row.id}
              className="flex flex-wrap gap-3 items-end rounded-lg border border-border/70 bg-muted/30 p-3"
            >
              <Input
                label={`Alan ${index + 1}`}
                value={row.field}
                onChange={(event) =>
                  onFiltersChange(filters.map((r) => (r.id === row.id ? { ...r, field: event.target.value } : r)))
                }
                disabled={!editMode}
                className="flex-1 min-w-[220px]"
              />
              {['roleId', 'role_id', 'role'].includes(row.field.trim()) ? (
                <Select
                  label="Değer"
                  value={row.value}
                  onChange={(event) =>
                    onFiltersChange(filters.map((r) => (r.id === row.id ? { ...r, value: event.target.value } : r)))
                  }
                  options={[{ value: '', label: 'Rol seçin' }, ...roleOptions]}
                  disabled={!editMode}
                  className="flex-1 min-w-[220px]"
                />
              ) : (
                <Input
                  label="Değer"
                  value={row.value}
                  onChange={(event) =>
                    onFiltersChange(filters.map((r) => (r.id === row.id ? { ...r, value: event.target.value } : r)))
                  }
                  disabled={!editMode}
                  className="flex-1 min-w-[220px]"
                  placeholder="Örn. seviyesi=kritik"
                />
              )}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  disabled={!editMode}
                  onClick={() => onFiltersChange(filters.filter((r) => r.id !== row.id))}
                >
                  Sil
                </Button>
              </div>
            </div>
          ))}
          {editMode ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => onFiltersChange([...filters, { id: generateRowId(), field: '', value: '' }])}
            >
              Filtre ekle
            </Button>
          ) : null}
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader title="Alıcılar" subtitle="Bildirim kime gidecek?" />
        <div className="space-y-3">
          {recipients.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap gap-3 items-end rounded-lg border border-border/70 bg-muted/30 p-3"
            >
              <Select
                label="Alıcı tipi"
                value={row.type}
                onChange={(event) =>
                  onRecipientsChange(
                    recipients.map((r) => (r.id === row.id ? { ...r, type: event.target.value as RecipientRow['type'] } : r)),
                  )
                }
                options={[
                  { value: 'user', label: 'Kullanıcı' },
                  { value: 'role', label: 'Rol' },
                  { value: 'email', label: 'E-posta' },
                  { value: 'webhook', label: 'Webhook' },
                ]}
                disabled={!editMode}
                className="flex-1 min-w-[180px] lg:max-w-[200px]"
              />
              {row.type === 'role' ? (
                <Select
                  label="Rol"
                  value={row.value}
                  onChange={(event) =>
                    onRecipientsChange(
                      recipients.map((r) => (r.id === row.id ? { ...r, value: event.target.value } : r)),
                    )
                  }
                  options={[{ value: '', label: 'Rol seçin' }, ...roleOptions]}
                  disabled={!editMode}
                  className="flex-1 min-w-[220px]"
                  placeholder="Rol seçin"
                />
              ) : (
                <Input
                  label="Değer"
                  value={row.value}
                  onChange={(event) =>
                    onRecipientsChange(
                      recipients.map((r) => (r.id === row.id ? { ...r, value: event.target.value } : r)),
                    )
                  }
                  disabled={!editMode}
                  className="flex-1 min-w-[220px]"
                  placeholder={
                    row.type === 'email'
                      ? 'security@example.com'
                      : row.type === 'webhook'
                        ? 'https://hooks.slack.com/...'
                        : 'ID veya email'
                  }
                />
              )}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  disabled={!editMode}
                  onClick={() => onRecipientsChange(recipients.filter((r) => r.id !== row.id))}
                >
                  Sil
                </Button>
              </div>
            </div>
          ))}
          {editMode ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() =>
                onRecipientsChange([...recipients, { id: generateRowId(), type: 'role', value: '' }])
              }
            >
              Alıcı ekle
            </Button>
          ) : null}
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader title="Kanallar" subtitle="Hangi kanallardan gönderilecek?" />
        <div className="space-y-3">
          {channels.map((row) => {
            const options = channelTypeOptions.some((opt) => opt.value === row.channelType)
              ? channelTypeOptions
              : [...channelTypeOptions, { value: row.channelType, label: row.channelType || 'Kanal' }];
            const templateOptions = templateOptionsByChannel.get(row.channelType) ?? [];
            const isInApp = row.channelType === IN_APP_CHANNEL_TYPE;
            return (
              <div
                key={row.id}
                className="flex flex-wrap gap-3 items-end border border-border rounded-md p-4 bg-muted/30"
              >
                <Select
                  label="Kanal tipi"
                  value={row.channelType}
                  onChange={(event) =>
                    onChannelsChange(
                      channels.map((c) =>
                        c.id === row.id ? { ...c, channelType: event.target.value, templateId: undefined } : c,
                      ),
                    )
                  }
                  options={[{ value: '', label: 'Seçin' }, ...options]}
                  disabled={!editMode}
                  className="flex-1 min-w-[200px] lg:max-w-[240px]"
                />
                <Select
                  label="Şablon"
                  value={row.templateId ?? ''}
                  onChange={(event) =>
                    onChannelsChange(
                      channels.map((c) =>
                        c.id === row.id ? { ...c, templateId: event.target.value || undefined } : c,
                      ),
                    )
                  }
                  options={[
                    { value: '', label: templateOptions.length ? 'Varsayılan şablon' : 'Uygun şablon yok' },
                    ...templateOptions,
                  ]}
                  disabled={!editMode || !row.channelType}
                  className="flex-1 min-w-[200px]"
                />
                {!isInApp ? (
                  <Input
                    label="Hedef kanal/adres"
                    value={row.targetChannel ?? ''}
                    onChange={(event) =>
                      onChannelsChange(
                        channels.map((c) =>
                          c.id === row.id ? { ...c, targetChannel: event.target.value } : c,
                        ),
                      )
                    }
                    disabled={!editMode}
                    className="flex-1 min-w-[200px]"
                    placeholder="Örn. #alerts"
                  />
                ) : (
                  <div className="flex-1 min-w-[200px] text-sm text-muted-foreground">
                    In-app: hedef kullanıcı alıcılardan çözümlenir
                  </div>
                )}
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(event) =>
                        onChannelsChange(
                          channels.map((c) =>
                            c.id === row.id ? { ...c, enabled: event.target.checked } : c,
                          ),
                        )
                      }
                      disabled={!editMode}
                    />
                    Aktif
                  </label>
                  {!isInApp ? (
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={row.mentionAll ?? false}
                        onChange={(event) =>
                          onChannelsChange(
                            channels.map((c) =>
                              c.id === row.id ? { ...c, mentionAll: event.target.checked } : c,
                            ),
                          )
                        }
                        disabled={!editMode}
                      />
                      Herkesi mention et
                    </label>
                  ) : null}
                </div>
                {editMode ? (
                  <div className="flex justify-end w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => onChannelsChange(channels.filter((c) => c.id !== row.id))}
                    >
                      Sil
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
          {editMode ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() =>
                onChannelsChange([
                  ...channels,
                  { id: generateRowId(), channelType: channelTypeOptions[0]?.value ?? IN_APP_CHANNEL_TYPE, enabled: true },
                ])
              }
            >
              Kanal ekle
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
};

const StatisticsTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <Statistics entityType="notification-rule" entityId={entityId} editMode={editMode} />
);

const ApiTab: React.FC<{
  entityId: string;
  editMode: boolean;
  endpoints: APIEndpoint[];
  onEndpointsChange?: (endpoints: APIEndpoint[]) => Promise<void> | void;
}> = ({ entityId, editMode, endpoints, onEndpointsChange }) => (
  <APITester
    entityType="notification-rule"
    entityId={entityId}
    editMode={editMode}
    endpoints={endpoints}
    onEndpointsChange={onEndpointsChange}
  />
);

const DocumentationTab: React.FC<{
  entityId: string;
  editMode: boolean;
  sections: DocumentationSection[];
  onSave?: (sections: DocumentationSection[]) => Promise<void> | void;
}> = ({ entityId, editMode, sections, onSave }) => (
  <Documentation
    entityType="notification-rule"
    entityId={entityId}
    editMode={editMode}
    sections={sections}
    onSave={onSave}
  />
);

const HistoryTab: React.FC<{ entityId: string }> = ({ entityId }) => (
  <HistoryTable entityType="NotificationRule" entityId={entityId} />
);

export function NotificationRulesDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const requiredLanguages = useRequiredLanguages();

  const canRead = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.VIEW);
  const canUpdate = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.UPDATE);
  const canViewStatistics = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.STATISTICS.VIEW);
  const canEditStatistics = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.STATISTICS.EDIT);
  const canViewApiReference = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.API.VIEW);
  const canEditApiReference = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.API.EDIT);
  const canViewDocumentation = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.DOCUMENTATION.VIEW);
  const canEditDocumentation = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.DOCUMENTATION.EDIT);
  const canViewHistory = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.HISTORY.VIEW);
  const canDelete = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.DELETE);

  const [loading, setLoading] = useState(true);
  const [rule, setRule] = useState<NotificationRule | null>(null);
  const [generalForm, setGeneralForm] = useState<GeneralForm | null>(null);
  const [isGeneralEditing, setIsGeneralEditing] = useState(false);
  const [generalHasChanges, setGeneralHasChanges] = useState(false);
  const generalBaselineRef = useRef<GeneralForm | null>(null);
  const [filterRows, setFilterRows] = useState<FilterRow[]>([]);
  const [recipientRows, setRecipientRows] = useState<RecipientRow[]>([]);
  const [channelRows, setChannelRows] = useState<ChannelRow[]>([]);
  const filtersBaselineRef = useRef<Record<string, unknown>>({});
  const recipientsBaselineRef = useRef<RecipientRow[]>([]);
  const channelsBaselineRef = useRef<ChannelRow[]>([]);
  const recipientsBaselinePayloadRef = useRef<Array<{ type: string; value: string }>>([]);
  const channelsBaselinePayloadRef = useRef<Array<Record<string, unknown>>>([]);
  const [availableChannels, setAvailableChannels] = useState<{ type: string; name: string }[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<
    { id: string; name: string; channelType: string }[]
  >([]);
  const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);

  const [pendingChanges, setPendingChanges] = useState<ChangeItem[]>([]);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const filtersPayload = useMemo(() => filtersToPayload(filterRows), [filterRows]);
  const recipientsPayload = useMemo(() => recipientsToPayload(recipientRows), [recipientRows]);
  const channelsPayload = useMemo(() => channelsToPayload(channelRows), [channelRows]);
  const filtersChanged = useMemo(
    () => JSON.stringify(filtersPayload) !== JSON.stringify(filtersBaselineRef.current),
    [filtersPayload],
  );
  const recipientsChanged = useMemo(
    () => JSON.stringify(recipientsPayload) !== JSON.stringify(recipientsBaselinePayloadRef.current),
    [recipientsPayload],
  );
  const channelsChanged = useMemo(
    () => JSON.stringify(channelsPayload) !== JSON.stringify(channelsBaselinePayloadRef.current),
    [channelsPayload],
  );
  const hasChanges = generalHasChanges || filtersChanged || recipientsChanged || channelsChanged;

  const channelTypeOptions = useMemo(() => {
    const unique = new Map<string, { type: string; name: string }>();
    availableChannels.forEach((channel) => {
      if (!unique.has(channel.type)) {
        unique.set(channel.type, channel);
      }
    });
    if (!unique.has(IN_APP_CHANNEL_TYPE)) {
      unique.set(IN_APP_CHANNEL_TYPE, { type: IN_APP_CHANNEL_TYPE, name: 'In-App' });
    }
    return Array.from(unique.values()).map((channel) => ({
      value: channel.type,
      label: `${channel.name} (${channel.type})`,
    }));
  }, [availableChannels]);

  const templateOptionsByChannel = useMemo(() => {
    const map = new Map<string, { value: string; label: string }[]>();
    availableTemplates.forEach((tpl) => {
      const list = map.get(tpl.channelType) ?? [];
      list.push({ value: tpl.id, label: tpl.name });
      map.set(tpl.channelType, list);
    });
    return map;
  }, [availableTemplates]);

  const buildTranslations = useCallback(
    (value: string): Record<string, string> => {
      const normalized = value.trim();
      return requiredLanguages.reduce<Record<string, string>>((acc, { code }) => {
        acc[code] = normalized;
        return acc;
      }, {});
    },
    [requiredLanguages],
  );
  const [apiReference, setApiReference] = useState<APIEndpoint[]>([]);
  const [documentationSections, setDocumentationSections] = useState<DocumentationSection[]>([]);

  const updateGeneralForm = useCallback((updater: (prev: GeneralForm) => GeneralForm) => {
    setGeneralForm((prev) => {
      if (!prev) {
        return prev;
      }
      const next = updater(prev);
      if (generalBaselineRef.current) {
        setGeneralHasChanges(!generalFormsEqual(next, generalBaselineRef.current));
      }
      return next;
    });
  }, []);

  const loadData = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      setLoading(true);
      setIsGeneralEditing(false);

      const [ruleResponse, channelsResponse, templatesResponse, rolesResponse] = await Promise.all([
        notificationsService.getRule(id),
        notificationsService.listChannels(),
        notificationsService.listTemplates(),
        rolesService.list(),
      ]);

      const general: GeneralForm = {
        name: ruleResponse.name ?? '',
        description: ruleResponse.description ?? '',
        eventKey: ruleResponse.eventKey ?? '',
        isActive: ruleResponse.isActive,
      };

      generalBaselineRef.current = cloneGeneralForm(general);
      setGeneralForm(cloneGeneralForm(general));
      setGeneralHasChanges(false);

      const parsedFilters: FilterRow[] = Object.entries(ruleResponse.filters ?? {}).map(
        ([key, value]) => ({
          id: generateRowId(),
          field: key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
        }),
      );
      setFilterRows(parsedFilters.length ? parsedFilters : [{ id: generateRowId(), field: '', value: '' }]);
      filtersBaselineRef.current = filtersToPayload(parsedFilters);

      const parsedRecipients: RecipientRow[] = (ruleResponse.recipients ?? []).map((recipient) => ({
        id: generateRowId(),
        type: recipient.type as RecipientRow['type'],
        value: recipient.value ?? '',
      }));
      setRecipientRows(parsedRecipients.length ? parsedRecipients : [{ id: generateRowId(), type: 'role', value: '' }]);
      recipientsBaselineRef.current = parsedRecipients.map((r) => ({ ...r }));
      recipientsBaselinePayloadRef.current = recipientsToPayload(parsedRecipients);

      const parsedChannels: ChannelRow[] = (ruleResponse.channels ?? []).map((channel, index) => ({
        id: generateRowId(),
        channelType: channel.channelType ?? '',
        templateId: channel.templateId ?? undefined,
        enabled: channel.enabled ?? true,
        targetChannel: (channel.settingsOverride as any)?.channel ?? undefined,
        mentionAll: Boolean((channel.settingsOverride as any)?.mentionAll),
      }));
      setChannelRows(parsedChannels.length ? parsedChannels : [{ id: generateRowId(), channelType: IN_APP_CHANNEL_TYPE, enabled: true }]);
      channelsBaselineRef.current = parsedChannels.map((c) => ({ ...c }));
      channelsBaselinePayloadRef.current = channelsToPayload(parsedChannels);

      setAvailableChannels(channelsResponse);
      setAvailableTemplates(
        templatesResponse.map((tpl) => ({ id: tpl.id, name: tpl.name, channelType: tpl.channelType })),
      );
      setRoleOptions((rolesResponse.items ?? []).map((role) => ({ value: role.id, label: role.name })));

      const fetchTasks: Promise<void>[] = [];

      if (canViewApiReference) {
        fetchTasks.push(
          notificationsService
            .getRuleApiReference(id)
            .then((data) => setApiReference(data))
            .catch((error: any) => {
              console.error('Failed to load API reference', error);
              showToast({
                type: 'error',
                message: t('notifications.rules.api_reference_error') || 'API referansı yüklenemedi',
              });
              setApiReference([]);
            }),
        );
      } else {
        setApiReference([]);
      }

      if (canViewDocumentation) {
        fetchTasks.push(
          notificationsService
            .getRuleDocumentation(id)
            .then((data) => setDocumentationSections(data))
            .catch((error: any) => {
              console.error('Failed to load rule documentation', error);
              showToast({
                type: 'error',
                message: t('notifications.rules.documentation_error') || 'Dokümantasyon yüklenemedi',
              });
              setDocumentationSections([]);
            }),
        );
      } else {
        setDocumentationSections([]);
      }

      if (fetchTasks.length > 0) {
        await Promise.all(fetchTasks);
      }

      setRule(ruleResponse);
    } catch (error: any) {
      console.error('Failed to load rule details', error);
      showToast({
        type: 'error',
        message: error?.message || t('common.error'),
      });
      navigate('/notifications/rules');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast, t, canViewApiReference, canViewDocumentation]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleUpdateApiReference = useCallback(async (endpoints: APIEndpoint[]) => {
    if (!id) {
      return;
    }
    try {
      const updated = await notificationsService.updateRuleApiReference(id, endpoints);
      setApiReference(updated);
      showToast({
        type: 'success',
        message: t('notifications.rules.api_reference_updated') || 'API referansı güncellendi',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        message: error?.message || t('common.error'),
      });
      throw error;
    }
  }, [id, showToast, t]);

  const handleUpdateDocumentation = useCallback(async (nextSections: DocumentationSection[]) => {
    if (!id) {
      return;
    }
    try {
      const updated = await notificationsService.updateRuleDocumentation(id, nextSections);
      setDocumentationSections(updated);
      showToast({
        type: 'success',
        message: t('notifications.rules.documentation_updated') || 'Dokümantasyon güncellendi',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        message: error?.message || t('common.error'),
      });
      throw error;
    }
  }, [id, showToast, t]);

  const handleEnterGeneralEdit = () => {
    if (!canUpdate) {
      return;
    }
    setIsGeneralEditing(true);
  };

  const handleCancelGeneralEdit = () => {
    if (!generalBaselineRef.current) {
      return;
    }
    setGeneralForm(cloneGeneralForm(generalBaselineRef.current));
    setGeneralHasChanges(false);
    setFilterRows(
      Object.entries(filtersBaselineRef.current).length
        ? Object.entries(filtersBaselineRef.current).map(([key, value]) => ({
            id: generateRowId(),
            field: key,
            value: String(value ?? ''),
          }))
        : [{ id: generateRowId(), field: '', value: '' }],
    );
    setRecipientRows(
      recipientsBaselineRef.current.length
        ? recipientsBaselineRef.current.map((r) => ({ ...r }))
        : [{ id: generateRowId(), type: 'role', value: '' }],
    );
    setChannelRows(
      channelsBaselineRef.current.length
        ? channelsBaselineRef.current.map((c) => ({ ...c }))
        : [{ id: generateRowId(), channelType: IN_APP_CHANNEL_TYPE, enabled: true }],
    );
    setIsGeneralEditing(false);
  };

  const handleGeneralSave = () => {
    if (!generalForm || !generalBaselineRef.current) {
      return;
    }
    const normalizedCurrent = normalizeGeneralForm(generalForm);
    const normalizedBaseline = normalizeGeneralForm(generalBaselineRef.current);

    const changes: ChangeItem[] = [];
    (Object.keys(normalizedCurrent) as (keyof GeneralForm)[]).forEach((key) => {
      if (typeof normalizedCurrent[key] === 'boolean') {
        if (normalizedCurrent[key] !== normalizedBaseline[key]) {
          changes.push({
            field: String(key),
            oldValue: normalizedBaseline[key] as boolean,
            newValue: normalizedCurrent[key] as boolean,
          });
        }
      } else if ((normalizedCurrent[key] as string) !== (normalizedBaseline[key] as string)) {
        changes.push({
          field: String(key),
          oldValue: (normalizedBaseline[key] as string) || '—',
          newValue: (normalizedCurrent[key] as string) || '—',
        });
      }
    });

    if (filtersChanged) {
      changes.push({
        field: 'filters',
        oldValue: Object.keys(filtersBaselineRef.current ?? {}).length,
        newValue: Object.keys(filtersPayload ?? {}).length,
      });
    }
    if (recipientsChanged) {
      changes.push({
        field: 'recipients',
        oldValue: recipientsBaselinePayloadRef.current.length,
        newValue: recipientsPayload.length,
      });
    }
    if (channelsChanged) {
      changes.push({
        field: 'channels',
        oldValue: channelsBaselinePayloadRef.current.length,
        newValue: channelsPayload.length,
      });
    }

    if (changes.length === 0) {
      showToast({ type: 'info', message: t('common.no_changes') ?? 'No changes detected' });
      return;
    }

    setPendingChanges(changes);
    setCommentDialogOpen(true);
  };

  const handleConfirmSave = async (comment: string) => {
    if (!id || !generalForm) {
      return;
    }
    if (!rule) {
      showToast({
        type: 'error',
        message: t('notifications.rules.not_found') ?? 'Notification rule not found.',
      });
      return;
    }

    try {
      setSaving(true);
      const trimmedName = generalForm.name.trim();
      const trimmedDescription = generalForm.description.trim();
      const descriptionValue = trimmedDescription || trimmedName;
      const namespace = 'notification_rules';
      let nameLocalizationId = rule?.nameLocalizationId ?? null;
      let descriptionLocalizationId = rule?.descriptionLocalizationId ?? null;

      if (nameLocalizationId) {
        await localizationsService.update(nameLocalizationId, {
          translations: buildTranslations(trimmedName),
        });
      } else {
        const created = await localizationsService.create({
          namespace,
          key: `rule-${id}-name-${Date.now().toString(36)}`,
          description: null,
          translations: buildTranslations(trimmedName),
        });
        nameLocalizationId = created.id;
      }

      if (descriptionLocalizationId) {
        await localizationsService.update(descriptionLocalizationId, {
          translations: buildTranslations(descriptionValue),
        });
      } else {
        const created = await localizationsService.create({
          namespace,
          key: `rule-${id}-description-${Date.now().toString(36)}`,
          description: null,
          translations: buildTranslations(descriptionValue),
        });
        descriptionLocalizationId = created.id;
      }

      if (!nameLocalizationId) {
        throw new Error('Name localization kaydedilemedi.');
      }

      const payload = {
        name: trimmedName,
        description: trimmedDescription || undefined,
        nameLocalizationId,
        descriptionLocalizationId,
        eventKey: generalForm.eventKey.trim(),
        isActive: generalForm.isActive,
        filters: filtersPayload,
        recipients: recipientsPayload,
        channels: channelsPayload,
      };

      await notificationsService.updateRule(id, payload);
      showToast({
        type: 'success',
        message: t('notifications.rules.updated') ?? 'Rule updated successfully',
      });

      setCommentDialogOpen(false);
      setPendingChanges([]);
      await loadData();
    } catch (error: any) {
      console.error('Failed to update rule', error);
      showToast({
        type: 'error',
        message: error?.message || t('common.error'),
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
    if (!generalForm || !rule) {
      return [];
    }
    return [
      {
        id: 'details',
        label: t('common.details') ?? 'Details',
        icon: FileText,
        component: RuleDetailsTab,
        props: {
          form: generalForm,
          editMode: isGeneralEditing,
          onChange: updateGeneralForm,
          filters: filterRows,
          recipients: recipientRows,
          channels: channelRows,
          onFiltersChange: setFilterRows,
          onRecipientsChange: setRecipientRows,
          onChannelsChange: setChannelRows,
          channelTypeOptions,
          templateOptionsByChannel,
          roleOptions,
        },
        hidden: !canRead,
      },
      {
        id: 'statistics',
        label: t('details.tabs.statistics') ?? 'Statistics',
        icon: BarChart3,
        component: StatisticsTab,
        props: {
          entityId: rule.id,
          editMode: isGeneralEditing && canEditStatistics,
        },
        hidden: !canViewStatistics,
      },
      {
        id: 'api',
        label: t('details.tabs.api') ?? 'API',
        icon: Code,
        component: ApiTab,
        props: {
          entityId: rule.id,
          editMode: isGeneralEditing && canEditApiReference,
          endpoints: apiReference,
          onEndpointsChange: handleUpdateApiReference,
        },
        hidden: !canViewApiReference,
      },
      {
        id: 'documentation',
        label: t('details.tabs.documentation') ?? 'Documentation',
        icon: BookOpen,
        component: DocumentationTab,
        props: {
          entityId: rule.id,
          editMode: isGeneralEditing && canEditDocumentation,
          sections: documentationSections,
          onSave: handleUpdateDocumentation,
        },
        hidden: !canViewDocumentation,
      },
      {
        id: 'history',
        label: t('details.tabs.history') ?? 'History',
        icon: HistoryIcon,
        component: HistoryTab,
        props: {
          entityId: rule.id,
        },
        hidden: !canViewHistory,
      },
    ];
  }, [
    apiReference,
    canEditApiReference,
    canEditDocumentation,
    canEditStatistics,
    canRead,
    canViewApiReference,
    canViewDocumentation,
    canViewHistory,
    canViewStatistics,
    channelRows,
    channelTypeOptions,
    filterRows,
    recipientRows,
    templateOptionsByChannel,
    documentationSections,
    generalForm,
    isGeneralEditing,
    rule,
    t,
    updateGeneralForm,
    handleUpdateApiReference,
    handleUpdateDocumentation,
  ]);

  const handleDeleteRule = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      setDeleteLoading(true);
      await notificationsService.deleteRule(id);
      showToast({
        type: 'success',
        message: t('notifications.rules.deleted') ?? 'Bildirim kuralı silindi',
      });
      navigate('/notifications/rules');
    } catch (error: any) {
      console.error('Failed to delete notification rule', error);
      showToast({
        type: 'error',
        message: error?.message || t('common.error'),
      });
    } finally {
      setDeleteLoading(false);
    }
  }, [id, navigate, showToast, t]);

  if (loading || !rule || !generalForm) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <DetailsLayout
        title={rule.name}
        subtitle={`Event: ${rule.eventKey}`}
        icon={<Zap className="h-6 w-6 text-white" />}
        backUrl="/notifications/rules"
        tabs={tabs}
        editMode={isGeneralEditing}
        hasChanges={hasChanges}
        onEdit={canUpdate ? handleEnterGeneralEdit : undefined}
        onSave={canUpdate ? handleGeneralSave : undefined}
        onCancel={handleCancelGeneralEdit}
        inlineActions={false}
        onDelete={canDelete ? handleDeleteRule : undefined}
        deleteLoading={deleteLoading}
        canDelete={canDelete}
        deleteButtonLabel={t('notifications.rules.delete') ?? 'Kuralı Sil'}
        deleteDialogTitle={t('notifications.rules.delete_title') ?? 'Bu kural silinsin mi?'}
        deleteDialogDescription={
          t('notifications.rules.delete_description') ??
          'Bu kuralı silmek bildirim tetiklemelerini durdurur. Devam etmek istediğinize emin misiniz?'
        }
      />

      <ChangeConfirmDialog
        open={commentDialogOpen}
        onClose={handleCommentDialogClose}
        onConfirm={handleConfirmSave}
        changes={pendingChanges}
        loading={saving}
        entityName={rule.name}
      />
    </>
  );
}
