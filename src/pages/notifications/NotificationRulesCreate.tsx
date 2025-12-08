import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  Filter,
  ListChecks,
  Plus,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Stepper } from '../../components/ui/Stepper';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import {
  notificationsService,
  type NotificationRulePayload,
  type NotificationRecipientPayload,
  type NotificationChannelTargetPayload,
  type NotificationEventCatalog,
  type NotificationEventDefinition,
  type NotificationEventFilterDefinition,
  type NotificationChannel,
  type NotificationTemplate,
  type NotificationRecipientType,
} from '../../api/services/notifications.service';
import { rolesService } from '../../api/services/roles.service';
import { localizationsService } from '../../api/services/localizations.service';
import type { RoleRecord } from '../../api/types/api.types';
import { useRequiredLanguages } from '../../hooks/useRequiredLanguages';

const steps = [
  { id: 'basic', name: 'Temel Bilgiler', description: 'İsim ve tetikleyici olayı seçin' },
  { id: 'recipients', name: 'Filtre & Alıcılar', description: 'Kuralın hedef kitlesini belirleyin' },
  { id: 'review', name: 'Önizleme', description: 'Kaydetmeden önce kontrol edin' },
];

const CUSTOM_FILTER_KEY = '__custom__';
const generateRowId = () => Math.random().toString(36).slice(2, 11);

type FilterRow = {
  id: string;
  field: string;
  customField?: string;
  value: string;
};

type RecipientRow = NotificationRecipientPayload & { id: string };

type ChannelRow = {
  id: string;
  channelType: string;
  templateId?: string | null;
  enabled: boolean;
  targetChannel?: string;
  mentionAll?: boolean;
};

export const NotificationRulesCreate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const requiredLanguages = useRequiredLanguages();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [basicInfo, setBasicInfo] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEventKey, setSelectedEventKey] = useState('');
  const [useCustomEventKey, setUseCustomEventKey] = useState(false);
  const [customEventKey, setCustomEventKey] = useState('');

  const [filterRows, setFilterRows] = useState<FilterRow[]>([]);
  const [recipientRows, setRecipientRows] = useState<RecipientRow[]>(() => [
    { id: generateRowId(), type: 'role', value: '' },
  ]);
  const [channelRows, setChannelRows] = useState<ChannelRow[]>(() => [
    { id: generateRowId(), channelType: '', enabled: true },
  ]);

  const [catalog, setCatalog] = useState<NotificationEventCatalog | null>(null);
  const [availableChannels, setAvailableChannels] = useState<NotificationChannel[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<NotificationTemplate[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [channelsTouched, setChannelsTouched] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setInitialLoading(true);
        const [catalogResponse, channelsResponse, templatesResponse, rolesResponse] = await Promise.all([
          notificationsService.getEventCatalog(),
          notificationsService.listChannels(),
          notificationsService.listTemplates(),
          rolesService.list(),
        ]);

        if (!mounted) {
          return;
        }

        setCatalog(catalogResponse);
        setAvailableChannels(channelsResponse);
        setAvailableTemplates(templatesResponse);
        setRoles(rolesResponse.items);

        if (!selectedCategory && catalogResponse.categories.length > 0) {
          setSelectedCategory(catalogResponse.categories[0].key);
        }
      } catch (error) {
        console.error('Failed to load notification helpers', error);
        showToast({
          type: 'error',
          message:
            t('notifications.rules.errors.load_failed') ?? 'Bildirim kuralları için gerekli veriler yüklenemedi.',
        });
      } finally {
        if (mounted) {
          setInitialLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [showToast, t]);

  useEffect(() => {
    if (!catalog || !selectedCategory) {
      return;
    }
    const hasEventInCategory = catalog.events.some(
      (event) => event.category === selectedCategory && event.key === selectedEventKey,
    );
    if (!hasEventInCategory) {
      setSelectedEventKey('');
    }
  }, [catalog, selectedCategory, selectedEventKey]);

  useEffect(() => {
    if (initialLoading) {
      return;
    }
    const currentFirst = channelRows[0];
    if (currentFirst && currentFirst.channelType) {
      return;
    }
    const defaultChannelType = availableChannels[0]?.type;
    if (!defaultChannelType) {
      return;
    }
    setChannelRows((rows) => {
      if (rows.length === 0) {
        return [{ id: generateRowId(), channelType: defaultChannelType, enabled: true }];
      }
      return rows.map((row, index) =>
        index === 0 ? { ...row, channelType: defaultChannelType } : row,
      );
    });
  }, [initialLoading, availableChannels, channelRows]);

  const categoryOptions = useMemo(
    () =>
      catalog?.categories.map((category) => ({ value: category.key, label: category.label })) ?? [],
    [catalog],
  );

  const eventOptions = useMemo(() => {
    if (!catalog) {
      return [];
    }
    return catalog.events
      .filter((event) => !selectedCategory || event.category === selectedCategory)
      .map((event) => ({ value: event.key, label: event.name }));
  }, [catalog, selectedCategory]);

  const selectedEvent = useMemo<NotificationEventDefinition | null>(() => {
    if (!catalog) {
      return null;
    }
    return catalog.events.find((event) => event.key === selectedEventKey) ?? null;
  }, [catalog, selectedEventKey]);

  useEffect(() => {
    if (!selectedEventKey || !selectedEvent || channelsTouched) {
      return;
    }
    if (!selectedEvent.recommendedChannels || selectedEvent.recommendedChannels.length === 0) {
      return;
    }
    setChannelRows(
      selectedEvent.recommendedChannels.map((channel) => ({
        id: generateRowId(),
        channelType: channel,
        enabled: true,
      })),
    );
  }, [selectedEventKey, selectedEvent, channelsTouched]);

  const resolvedEventKey = useCustomEventKey ? customEventKey.trim() : selectedEventKey;

  const parseFilterValue = (
    value: string,
    definition?: NotificationEventFilterDefinition,
  ): string | number | boolean => {
    if (!definition) {
      return value;
    }
    if (definition.type === 'number') {
      const numeric = Number(value);
      return Number.isNaN(numeric) ? value : numeric;
    }
    if (definition.type === 'boolean') {
      return value.toLowerCase() === 'true';
    }
    return value;
  };

  const buildFiltersPayload = useCallback(() => {
    const filters: Record<string, unknown> = {};
    filterRows.forEach((row) => {
      const key = row.field === CUSTOM_FILTER_KEY ? row.customField?.trim() : row.field;
      if (!key) {
        return;
      }
      const definition = selectedEvent?.availableFilters.find((filter) => filter.key === row.field);
      filters[key] = parseFilterValue(row.value, definition);
    });
    return filters;
  }, [filterRows, selectedEvent]);

  const filtersObject = useMemo(() => buildFiltersPayload(), [buildFiltersPayload]);

  const templateMap = useMemo(
    () => new Map(availableTemplates.map((template) => [template.id, template])),
    [availableTemplates],
  );

  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: role.id, label: role.name })),
    [roles],
  );

  const channelTypeOptions = useMemo(() => {
    const unique = new Map<string, NotificationChannel>();
    availableChannels.forEach((channel) => {
      if (!unique.has(channel.type)) {
        unique.set(channel.type, channel);
      }
    });
    return Array.from(unique.entries()).map(([type, channel]) => ({
      value: type,
      label: `${channel.name} (${type})`,
    }));
  }, [availableChannels]);

  const addFilterRow = () => {
    setFilterRows((rows) => [...rows, { id: generateRowId(), field: '', value: '' }]);
  };

  const updateFilterRow = (id: string, patch: Partial<FilterRow>) => {
    setFilterRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeFilterRow = (id: string) => {
    setFilterRows((rows) => rows.filter((row) => row.id !== id));
  };

  const addRecipientRow = () => {
    setRecipientRows((rows) => [...rows, { id: generateRowId(), type: 'role', value: '' }]);
  };

  const updateRecipientRow = (id: string, patch: Partial<RecipientRow>) => {
    setRecipientRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeRecipientRow = (id: string) => {
    setRecipientRows((rows) => rows.filter((row) => row.id !== id));
  };

  const addChannelRow = () => {
    setChannelsTouched(true);
    setChannelRows((rows) => [
      ...rows,
      { id: generateRowId(), channelType: channelTypeOptions[0]?.value ?? '', enabled: true },
    ]);
  };

  const updateChannelRow = (id: string, patch: Partial<ChannelRow>) => {
    setChannelsTouched(true);
    setChannelRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeChannelRow = (id: string) => {
    setChannelsTouched(true);
    setChannelRows((rows) => rows.filter((row) => row.id !== id));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
    }
  };

  const buildTranslations = (value: string): Record<string, string> => {
    const normalized = value.trim();
    return requiredLanguages.reduce<Record<string, string>>((acc, { code }) => {
      acc[code] = normalized;
      return acc;
    }, {});
  };

  const handleSubmit = async () => {
    const trimmedName = basicInfo.name.trim();
    const trimmedEventKey = resolvedEventKey.trim();

    if (!trimmedName || !trimmedEventKey) {
      showToast({
        type: 'error',
        message: t('notifications.rules.errors.required_fields') ?? 'Kural adı ve olay anahtarı zorunludur.',
      });
      setCurrentStep(0);
      return;
    }

    const normalizedRecipients: NotificationRecipientPayload[] = recipientRows
      .map((recipient) => ({
        type: recipient.type,
        value: recipient.value.trim(),
        meta: recipient.meta,
      }))
      .filter((recipient) => recipient.value.length > 0);

    if (!normalizedRecipients.length) {
      showToast({ type: 'error', message: 'En az bir alıcı seçmelisiniz.' });
      setCurrentStep(1);
      return;
    }

    const normalizedChannels: NotificationChannelTargetPayload[] = channelRows
      .filter((channel) => channel.channelType.trim().length > 0)
      .map((channel) => {
        const settingsOverride: Record<string, unknown> = {};
        if (channel.targetChannel?.trim()) {
          settingsOverride.channel = channel.targetChannel.trim();
        }
        if (channel.mentionAll) {
          settingsOverride.mentionAll = true;
        }
        return {
          channelType: channel.channelType,
          templateId: channel.templateId?.trim() || undefined,
          enabled: channel.enabled,
          settingsOverride: Object.keys(settingsOverride).length > 0 ? settingsOverride : undefined,
        };
      });

    if (!normalizedChannels.length) {
      showToast({ type: 'error', message: 'En az bir kanal tanımlamalısınız.' });
      setCurrentStep(1);
      return;
    }

    try {
      setLoading(true);
      const namespace = 'notification_rules';
      const slugSource = trimmedEventKey.toLowerCase() || trimmedName.toLowerCase() || 'notification_rule';
      const slug = slugSource.replace(/[^a-z0-9_.-]/gi, '-').replace(/-+/g, '-');
      const localizationKey = `${slug}-${Date.now().toString(36)}`;

      const nameLocalization = await localizationsService.create({
        namespace,
        key: `${localizationKey}.name`,
        description: null,
        translations: buildTranslations(trimmedName),
      });

      const descriptionValue = basicInfo.description.trim() || trimmedName;
      const descriptionLocalization = await localizationsService.create({
        namespace,
        key: `${localizationKey}.description`,
        description: null,
        translations: buildTranslations(descriptionValue),
      });

      const filtersPayload = buildFiltersPayload();
      const payload: NotificationRulePayload = {
        name: trimmedName,
        description: basicInfo.description.trim() || undefined,
        nameLocalizationId: nameLocalization.id,
        descriptionLocalizationId: descriptionLocalization.id,
        eventKey: trimmedEventKey,
        isActive: basicInfo.isActive,
        filters: Object.keys(filtersPayload).length ? filtersPayload : undefined,
        recipients: normalizedRecipients,
        channels: normalizedChannels,
      };

      await notificationsService.createRule(payload);
      showToast({
        type: 'success',
        message: t('notifications.rules.created') ?? 'Bildirim kuralı oluşturuldu.',
      });
      navigate('/notifications/rules');
    } catch (error: any) {
      console.error('Failed to create rule', error);
      showToast({ type: 'error', message: error?.message || t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    const hasBasics = basicInfo.name.trim().length > 0 && resolvedEventKey.trim().length > 0;
    const hasRecipients = recipientRows.some((recipient) => recipient.value.trim().length > 0);
    const hasChannels = channelRows.some((channel) => channel.channelType.trim().length > 0);

    if (currentStep === 0) {
      return hasBasics;
    }
    if (currentStep === 1) {
      return hasBasics && hasRecipients && hasChannels;
    }
    return hasBasics && hasRecipients && hasChannels;
  };

  const renderFiltersSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" /> Filtreler
          </p>
          <p className="text-xs text-gray-500">
            Olay verilerini belirli alanlara göre daraltın.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addFilterRow} leftIcon={<Plus className="h-3.5 w-3.5" />}>
          Filtre ekle
        </Button>
      </div>

      {filterRows.length === 0 && (
        <p className="text-sm text-gray-500">Henüz filtre eklemediniz.</p>
      )}

      <div className="space-y-4">
        {filterRows.map((row) => {
          const definition = selectedEvent?.availableFilters.find((filter) => filter.key === row.field);
          const filterOptions = [
            { value: '', label: 'Alan seçin' },
            ...(selectedEvent?.availableFilters || []).map((filter) => ({
              value: filter.key,
              label: `${filter.label}${filter.type === 'boolean' ? ' (bool)' : ''}`,
            })),
            { value: CUSTOM_FILTER_KEY, label: 'Özel alan' },
          ];

          const valueInput = definition?.type === 'boolean'
            ? (
                <Select
                  label="Değer"
                  value={row.value}
                  onChange={(event) => updateFilterRow(row.id, { value: event.target.value })}
                  options={[
                    { value: '', label: 'Seçin' },
                    { value: 'true', label: 'True' },
                    { value: 'false', label: 'False' },
                  ]}
                  required
                />
              )
            : (
                <Input
                  label="Değer"
                  value={row.value}
                  onChange={(event) => updateFilterRow(row.id, { value: event.target.value })}
                  placeholder="Örn. system_admin"
                  required
                />
              );

          return (
            <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 rounded-xl border border-gray-100 p-4">
              <div className="md:col-span-4">
                <Select
                  label="Alan"
                  value={row.field}
                  onChange={(event) => {
                    const value = event.target.value;
                    updateFilterRow(row.id, {
                      field: value,
                      customField: value === CUSTOM_FILTER_KEY ? row.customField : undefined,
                    });
                  }}
                  options={filterOptions}
                />
                {row.field !== CUSTOM_FILTER_KEY && definition?.description && (
                  <p className="mt-1 text-xs text-gray-500">{definition.description}</p>
                )}
              </div>

              {row.field === CUSTOM_FILTER_KEY && (
                <div className="md:col-span-3">
                  <Input
                    label="Özel Alan Anahtarı"
                    value={row.customField ?? ''}
                    onChange={(event) => updateFilterRow(row.id, { customField: event.target.value })}
                    placeholder="Örn. priority"
                    required
                  />
                </div>
              )}

              <div className={row.field === CUSTOM_FILTER_KEY ? 'md:col-span-4' : 'md:col-span-5'}>
                {valueInput}
              </div>

              <div className="md:col-span-1 flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilterRow(row.id)}
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                >
                  Sil
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderRecipientsSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" /> Alıcılar
          </p>
          <p className="text-xs text-gray-500">Bildirimleri alacak kullanıcı, rol veya hedef adresleri seçin.</p>
        </div>
        <Button variant="outline" size="sm" onClick={addRecipientRow} leftIcon={<Plus className="h-3.5 w-3.5" />}>
          Alıcı ekle
        </Button>
      </div>

      <div className="space-y-4">
        {recipientRows.map((row) => (
          <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 rounded-xl border border-gray-100 p-4">
            <div className="md:col-span-3">
              <Select
                label="Alıcı Tipi"
                value={row.type}
                onChange={(event) => updateRecipientRow(row.id, { type: event.target.value as NotificationRecipientType, value: '' })}
                options={[
                  { value: 'role', label: 'Rol' },
                  { value: 'user', label: 'Kullanıcı ID' },
                  { value: 'email', label: 'E-posta' },
                  { value: 'webhook', label: 'Webhook URL' },
                ]}
              />
            </div>

            <div className="md:col-span-8">
              {row.type === 'role' ? (
                <Select
                  label="Rol"
                  value={row.value}
                  onChange={(event) => updateRecipientRow(row.id, { value: event.target.value })}
                  options={[{ value: '', label: 'Rol seçin' }, ...roleOptions]}
                  required
                />
              ) : (
                <Input
                  label="Değer"
                  value={row.value}
                  onChange={(event) => updateRecipientRow(row.id, { value: event.target.value })}
                  placeholder={row.type === 'email' ? 'security@example.com' : row.type === 'webhook' ? 'https://hooks.slack.com/...' : 'Kullanıcı ID'}
                  required
                />
              )}
            </div>

            <div className="md:col-span-1 flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRecipientRow(row.id)}
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Sil
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChannelsSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-500" /> Kanallar
          </p>
          <p className="text-xs text-gray-500">Bildirim hangi kanallardan gönderilecek?</p>
        </div>
        <Button variant="outline" size="sm" onClick={addChannelRow} leftIcon={<Plus className="h-3.5 w-3.5" />}>
          Kanal ekle
        </Button>
      </div>

      <div className="space-y-4">
        {channelRows.map((row) => {
          const options = channelTypeOptions.some((option) => option.value === row.channelType)
            ? channelTypeOptions
            : [...channelTypeOptions, { value: row.channelType, label: row.channelType || 'Tanımlı kanal yok' }];
          const templates = availableTemplates.filter((template) => template.channelType === row.channelType);
          const templateOptions = templates.map((template) => ({ value: template.id, label: template.name }));

          return (
            <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 rounded-xl border border-gray-100 p-4">
              <div className="md:col-span-3">
                <Select
                  label="Kanal Tipi"
                  value={row.channelType}
                  onChange={(event) => updateChannelRow(row.id, { channelType: event.target.value })}
                  options={[{ value: '', label: 'Kanal seçin' }, ...options]}
                  required
                />
              </div>

              <div className="md:col-span-4">
                <Select
                  label="Şablon"
                  value={row.templateId ?? ''}
                  onChange={(event) => updateChannelRow(row.id, { templateId: event.target.value || undefined })}
                  options={[
                    { value: '', label: templates.length ? 'Varsayılan şablon' : 'Uygun şablon yok' },
                    ...templateOptions,
                  ]}
                  disabled={!row.channelType}
                />
              </div>

              <div className="md:col-span-3">
                <Input
                  label="Hedef Kanal / Adres"
                  value={row.targetChannel ?? ''}
                  onChange={(event) => updateChannelRow(row.id, { targetChannel: event.target.value })}
                  placeholder="Örn. #security-alerts"
                />
              </div>

              <div className="md:col-span-2 flex flex-col justify-center space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(event) => updateChannelRow(row.id, { enabled: event.target.checked })}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  Aktif
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={row.mentionAll ?? false}
                    onChange={(event) => updateChannelRow(row.id, { mentionAll: event.target.checked })}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  Herkesi mention et
                </label>
              </div>

              <div className="md:col-span-12 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeChannelRow(row.id)}
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                >
                  Sil
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStepContent = () => {
    if (initialLoading) {
      return (
        <Card>
          <CardHeader title="Bildirim verileri yükleniyor" subtitle="Lütfen bekleyin" />
          <div className="p-6 text-sm text-gray-500">Bildirim kuralları için yardımcı veriler hazırlanıyor…</div>
        </Card>
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader
              title={t('notifications.rules.fields.name') ?? 'Kural Bilgileri'}
              subtitle="Adı, açıklaması ve tetikleyici olayı belirleyin"
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <Input
                    label={t('notifications.rules.fields.name') ?? 'Kural adı'}
                    value={basicInfo.name}
                    onChange={(event) => setBasicInfo((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Örn. Sistem admin girişi"
                    required
                  />
                  <Textarea
                    label={t('notifications.rules.fields.description') ?? 'Açıklama'}
                    value={basicInfo.description}
                    onChange={(event) => setBasicInfo((prev) => ({ ...prev, description: event.target.value }))}
                    rows={3}
                    placeholder="Bu kural ne zaman ve neden tetiklenmeli?"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Olay Kategorisi"
                      value={selectedCategory}
                      onChange={(event) => setSelectedCategory(event.target.value)}
                      options={[{ value: '', label: 'Kategori seçin' }, ...categoryOptions]}
                    />
                    <Select
                      label="Olay"
                      value={selectedEventKey}
                      onChange={(event) => {
                        setSelectedEventKey(event.target.value);
                        setUseCustomEventKey(false);
                      }}
                      options={[{ value: '', label: 'Olay seçin' }, ...eventOptions]}
                      helperText={selectedEvent?.description}
                      disabled={!selectedCategory}
                      required={!useCustomEventKey}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={useCustomEventKey}
                      onChange={(event) => {
                        const enabled = event.target.checked;
                        setUseCustomEventKey(enabled);
                        if (!enabled) {
                          setCustomEventKey('');
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    {t('notifications.rules.fields.eventKey') ?? 'Özel event anahtarı kullan'}
                  </label>
                  <Input
                    label="Event Anahtarı"
                    value={useCustomEventKey ? customEventKey : selectedEventKey}
                    onChange={(event) => {
                      if (useCustomEventKey) {
                        setCustomEventKey(event.target.value);
                      }
                    }}
                    placeholder="Örn. catalog.item.updated"
                    leftIcon={<Activity className="h-4 w-4" />}
                    required
                    disabled={!useCustomEventKey}
                    helperText={
                      useCustomEventKey
                        ? undefined
                        : 'Seçtiğiniz olayın anahtarı otomatik olarak uygulanır.'
                    }
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={basicInfo.isActive}
                      onChange={(event) => setBasicInfo((prev) => ({ ...prev, isActive: event.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      {t('notifications.rules.fields.isActive') ?? 'Aktif kural'}
                    </label>
                  </div>
                </div>
              </div>
              {selectedEvent && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <ListChecks className="h-4 w-4" /> Olay Özeti
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{selectedEvent.description}</p>
                  {selectedEvent.availableFilters.length > 0 && (
                    <p className="mt-3 text-xs text-gray-500">
                      Kullanılabilir filtreler: {selectedEvent.availableFilters.map((filter) => filter.label).join(', ')}
                    </p>
                  )}
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-500">Örnek payload</p>
                    <pre className="mt-2 rounded-lg bg-white p-3 text-xs text-gray-700 overflow-auto">
                      {JSON.stringify(selectedEvent.samplePayload, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      case 1:
        return (
          <Card>
            <CardHeader title="Filtreler, Alıcılar ve Kanallar" subtitle="Olayı nasıl eşleyeceğinizi ve kime ileteceğinizi belirleyin" />
            <div className="space-y-10">
              {renderFiltersSection()}
              {renderRecipientsSection()}
              {renderChannelsSection()}
            </div>
          </Card>
        );
      case 2:
        return (
          <Card>
            <CardHeader title="Önizleme" subtitle="Kaydetmeden önce tüm detayları kontrol edin" />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Kural Bilgisi</h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-500">Ad:</span> {basicInfo.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-500">Event Anahtarı:</span> {resolvedEventKey || '—'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-500">Durum:</span> {basicInfo.isActive ? 'Aktif' : 'Pasif'}
                  </p>
                  {basicInfo.description && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-500">Açıklama:</span> {basicInfo.description}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Olay</h4>
                  <p className="text-sm text-gray-600">{selectedEvent ? selectedEvent.name : 'Özel event'}</p>
                  <p className="text-xs text-gray-500">{selectedEvent?.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Filtreler</h4>
                  {Object.keys(filtersObject).length === 0 ? (
                    <p className="text-sm text-gray-500">Filtre tanımlanmadı.</p>
                  ) : (
                    <ul className="text-sm text-gray-600 space-y-1">
                      {Object.entries(filtersObject).map(([key, value]) => (
                        <li key={key}>
                          <span className="font-medium text-gray-500">{key}:</span> {String(value)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Alıcılar</h4>
                  {recipientRows.every((recipient) => !recipient.value.trim()) ? (
                    <p className="text-sm text-gray-500">Alıcı girilmedi.</p>
                  ) : (
                    <ul className="text-sm text-gray-600 space-y-1">
                      {recipientRows
                        .filter((recipient) => recipient.value.trim())
                        .map((recipient) => {
                          const role = recipient.type === 'role'
                            ? roles.find((item) => item.id === recipient.value)
                            : null;
                          const label =
                            recipient.type === 'role'
                              ? role?.name ?? recipient.value
                              : recipient.value;
                          return (
                            <li key={recipient.id}>
                              <span className="font-medium text-gray-500 capitalize">{recipient.type}:</span> {label}
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Kanallar</h4>
                {channelRows.every((channel) => !channel.channelType.trim()) ? (
                  <p className="text-sm text-gray-500">Kanal seçilmedi.</p>
                ) : (
                  <ul className="text-sm text-gray-600 space-y-1">
                    {channelRows
                      .filter((channel) => channel.channelType.trim())
                      .map((channel) => (
                        <li key={channel.id}>
                          <span className="font-medium text-gray-500">{channel.channelType}</span>
                          {channel.templateId && templateMap.get(channel.templateId)
                            ? ` • ${templateMap.get(channel.templateId)?.name}`
                            : ' • varsayılan şablon'}
                          {channel.targetChannel && ` • ${channel.targetChannel}`}
                          {!channel.enabled && ' • Pasif'}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card padding="lg">
        <Stepper steps={steps} currentStep={currentStep} />
      </Card>

      {renderStepContent()}

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          {t('common.back')}
        </Button>

        <div className="flex space-x-3">
          {currentStep === steps.length - 1 ? (
            <Button onClick={handleSubmit} loading={loading} disabled={!canProceed()} leftIcon={<Check className="h-4 w-4" />}>
              {t('common.create')}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()} rightIcon={<ArrowRight className="h-4 w-4" />}>
              {t('common.next')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
