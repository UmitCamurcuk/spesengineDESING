import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  FileText,
  Globe,
  Hash,
  History as HistoryIcon,
  Shield,
  Tags as TagsIcon,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { AttributeRenderer } from '../../components/attributes/AttributeRenderer';
import { HistoryTable } from '../../components/common/HistoryTable';
import { EntityNotificationsTab } from '../../components/notifications/EntityNotificationsTab';
import { APITester } from '../../components/common/APITester';
import { Documentation } from '../../components/common/Documentation';
import { Statistics } from '../../components/common/Statistics';
import { ChangeConfirmDialog } from '../../components/ui/ChangeConfirmDialog';
import { attributesService } from '../../api/services/attributes.service';
import { localizationsService } from '../../api/services/localizations.service';
import { useRequiredLanguages } from '../../hooks/useRequiredLanguages';
import { historyService } from '../../api/services/history.service';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import { AttributeGroupSelector } from '../../components/ui/AttributeGroupSelector';
import { Attribute, AttributeGroup, AttributeGroupSummary, AttributeType } from '../../types';
import {
  APIEndpoint,
  DocumentationSection,
  HistoryEntry,
  Statistics as StatisticsType,
} from '../../types/common';
import { PERMISSIONS } from '../../config/permissions';

const OPTION_BASED_TYPES = new Set<AttributeType>([AttributeType.SELECT, AttributeType.MULTISELECT]);
type LocalizationState = Record<string, string>;

const formatDefaultValue = (value: unknown, type: AttributeType): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (type === AttributeType.URL && typeof value === 'string') {
    return value;
  }

  if (type === AttributeType.MONEY) {
    const normalized =
      typeof value === 'string'
        ? (() => {
            try {
              return JSON.parse(value) as Record<string, unknown>;
            } catch {
              return value;
            }
          })()
        : value;

    if (typeof normalized === 'object' && normalized !== null) {
      const amount = (normalized as Record<string, unknown>).amount;
      const currency = (normalized as Record<string, unknown>).currency;
      if ((amount === undefined || amount === null) && !currency) {
        return '';
      }
      return `${currency ?? ''} ${amount ?? ''}`.trim();
    }

    if (typeof normalized === 'string') {
      return normalized;
    }
  }

  if (type === AttributeType.REFERENCE) {
    const normalized =
      typeof value === 'string'
        ? (() => {
            try {
              return JSON.parse(value) as Record<string, unknown>;
            } catch {
              return value;
            }
          })()
        : value;

    if (typeof normalized === 'object' && normalized !== null) {
      const entityType = (normalized as Record<string, unknown>).entityType;
      const referenceId = (normalized as Record<string, unknown>).referenceId;
      const label = (normalized as Record<string, unknown>).label;
      const parts = [entityType, label || referenceId].filter(
        (part): part is string => typeof part === 'string' && part.trim().length > 0,
      );
      return parts.join(' · ');
    }

    if (typeof normalized === 'string') {
      return normalized;
    }
  }

  if (type === AttributeType.GEOPOINT) {
    const normalized =
      typeof value === 'string'
        ? (() => {
            try {
              return JSON.parse(value) as Record<string, unknown>;
            } catch {
              return value;
            }
          })()
        : value;

    if (typeof normalized === 'object' && normalized !== null) {
      const lat = (normalized as Record<string, unknown>).lat;
      const lng = (normalized as Record<string, unknown>).lng;
      if ((lat === undefined || lat === null) && (lng === undefined || lng === null)) {
        return '';
      }
      return `${lat ?? '—'}, ${lng ?? '—'}`;
    }

    if (typeof normalized === 'string') {
      return normalized;
    }
  }


  if (type === AttributeType.JSON || type === AttributeType.OBJECT || type === AttributeType.ARRAY) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  if (type === AttributeType.BOOLEAN) {
    return value ? 'true' : 'false';
  }

  return String(value);
};

const normalizeDefaultValue = (
  value: string,
  type: AttributeType,
  options: string[],
): unknown => {
  if (!value || value.trim().length === 0) {
    return undefined;
  }

  const trimmed = value.trim();

  switch (type) {
    case AttributeType.NUMBER:
    case AttributeType.RATING: {
      const parsed = Number(trimmed);
      if (Number.isNaN(parsed)) {
        throw new Error('Varsayılan değer sayı olmalıdır.');
      }
      return parsed;
    }
    case AttributeType.BOOLEAN: {
      if (trimmed !== 'true' && trimmed !== 'false') {
        throw new Error('Varsayılan değer true veya false olmalıdır.');
      }
      return trimmed === 'true';
    }
    case AttributeType.SELECT: {
      if (!options.includes(trimmed)) {
        throw new Error('Varsayılan değer mevcut seçeneklerden biri olmalıdır.');
      }
      return trimmed;
    }
    case AttributeType.MULTISELECT: {
      const selections = trimmed
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
      if (selections.length === 0) {
        throw new Error('Varsayılan değer için en az bir seçim yapın.');
      }
      const invalid = selections.filter((selection) => !options.includes(selection));
      if (invalid.length > 0) {
        throw new Error('Varsayılan seçimler tanımlı seçeneklerle eşleşmelidir.');
      }
      return selections;
    }
    case AttributeType.URL: {
      try {
        // eslint-disable-next-line no-new
        new URL(trimmed);
      } catch {
        throw new Error('Varsayılan değer geçerli bir URL olmalıdır.');
      }
      return trimmed;
    }
    case AttributeType.MONEY: {
      try {
        const parsed = JSON.parse(value);
        const rawAmount =
          typeof parsed.amount === 'number'
            ? parsed.amount
            : typeof parsed.amount === 'string'
              ? parsed.amount.trim()
              : '';
        const rawCurrency =
          typeof parsed.currency === 'string' ? parsed.currency.trim().toUpperCase() : '';

        if (rawAmount === '' || rawAmount === null) {
          return undefined;
        }

        const amount =
          typeof rawAmount === 'number'
            ? rawAmount
            : rawAmount !== '' && !Number.isNaN(Number(rawAmount))
              ? Number(rawAmount)
              : null;

        if (amount === null) {
          throw new Error('Varsayılan para değeri sayısal bir tutar içermelidir.');
        }
        const currency = rawCurrency || 'TRY';
        return { amount, currency };
      } catch (error) {
        if (error instanceof Error && error.message.includes('para')) {
          throw error;
        }
        throw new Error('Varsayılan para değeri geçerli bir JSON olmalıdır.');
      }
    }
    case AttributeType.REFERENCE: {
      try {
        const parsed = JSON.parse(value);
        const entityType =
          typeof parsed.entityType === 'string' ? parsed.entityType.trim() : '';
        const referenceId =
          typeof parsed.referenceId === 'string' ? parsed.referenceId.trim() : '';
        const label =
          typeof parsed.label === 'string' ? parsed.label.trim() : undefined;

        if (!entityType && !referenceId && !label) {
          return undefined;
        }

        if (!entityType) {
          throw new Error('Varsayılan referans için entity tipi gereklidir.');
        }
        if (!referenceId) {
          throw new Error('Varsayılan referans için kimlik gereklidir.');
        }

        return { entityType, referenceId, label };
      } catch (error) {
        if (error instanceof Error && error.message.includes('referans')) {
          throw error;
        }
        throw new Error('Varsayılan referans değeri geçerli bir JSON olmalıdır.');
      }
    }
    case AttributeType.GEOPOINT: {
      try {
        const parsed = JSON.parse(value);
        const rawLat =
          typeof parsed.lat === 'number'
            ? parsed.lat
            : typeof parsed.lat === 'string'
              ? parsed.lat.trim()
              : '';
        const rawLng =
          typeof parsed.lng === 'number'
            ? parsed.lng
            : typeof parsed.lng === 'string'
              ? parsed.lng.trim()
              : '';

        if ((rawLat === '' || rawLat === null) && (rawLng === '' || rawLng === null)) {
          return undefined;
        }

        const lat =
          typeof rawLat === 'number'
            ? rawLat
            : rawLat !== '' && !Number.isNaN(Number(rawLat))
              ? Number(rawLat)
              : null;
        const lng =
          typeof rawLng === 'number'
            ? rawLng
            : rawLng !== '' && !Number.isNaN(Number(rawLng))
              ? Number(rawLng)
              : null;

        if (lat === null || lng === null) {
          throw new Error('Coğrafi nokta için enlem ve boylam sayısal olmalıdır.');
        }
        if (lat < -90 || lat > 90) {
          throw new Error('Enlem -90 ile 90 arasında olmalıdır.');
        }
        if (lng < -180 || lng > 180) {
          throw new Error('Boylam -180 ile 180 arasında olmalıdır.');
        }

        return { lat, lng };
      } catch (error) {
        if (error instanceof Error && error.message.includes('Coğrafi')) {
          throw error;
        }
        throw new Error('Varsayılan coğrafi nokta değeri geçerli bir JSON olmalıdır.');
      }
    }
    case AttributeType.JSON:
    case AttributeType.OBJECT:
    case AttributeType.ARRAY: {
      try {
        const parsed = JSON.parse(trimmed);
        if (type === AttributeType.ARRAY && !Array.isArray(parsed)) {
          throw new Error('Varsayılan değer geçerli bir JSON array olmalıdır.');
        }
        if (
          type === AttributeType.OBJECT &&
          (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
        ) {
          throw new Error('Varsayılan değer geçerli bir JSON obje olmalıdır.');
        }
        return parsed;
      } catch {
        throw new Error('Varsayılan değer geçerli bir JSON olmalıdır.');
      }
    }
    default:
      return trimmed;
  }
};

const extractActorName = (entry: HistoryEntry): string => {
  return (
    entry.actorName ??
    entry.actor?.name ??
    entry.actor?.email ??
    entry.actor?.userId ??
    entry.actor?.ip ??
    'System'
  );
};

const buildStatistics = (attribute: Attribute, history: HistoryEntry[]): StatisticsType => {
  const totalEvents = history.length;
  const updatedEvents = history.filter((entry) => entry.action === 'updated');
  const createdEvents = history.filter((entry) => entry.action === 'created');
  const now = new Date();

  const createdThisMonth =
    createdEvents.length > 0
      ? createdEvents.filter((entry) => {
          const createdAt = new Date(entry.timestamp);
          return (
            createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth()
          );
        }).length
      : (() => {
          const createdAt = new Date(attribute.createdAt);
          return createdAt.getFullYear() === now.getFullYear() &&
            createdAt.getMonth() === now.getMonth()
            ? 1
            : 0;
        })();

  const updatedThisMonth = updatedEvents.filter((entry) => {
    const updatedAt = new Date(entry.timestamp);
    return updatedAt.getFullYear() === now.getFullYear() && updatedAt.getMonth() === now.getMonth();
  }).length;

  const usageCount = attribute.attributeGroups?.length ?? 0;
  const activeCount = usageCount;
  const inactiveCount = Math.max(totalEvents - activeCount, 0);

  const months = new Map<string, { value: number; label: string }>();
  history.forEach((entry) => {
    const date = new Date(entry.timestamp);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const label = date.toLocaleString('default', { month: 'short' });
    if (!months.has(key)) {
      months.set(key, { value: 0, label });
    }
    months.get(key)!.value += 1;
  });

  const sortedMonths = Array.from(months.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .slice(-6);

  const trends = sortedMonths.map(([_, { value, label }], index, array) => {
    const previous = array[index - 1]?.[1].value ?? value;
    const change = previous === 0 ? value : value - previous;
    return {
      period: label,
      value,
      change,
    };
  });

  const usageByActor = history.reduce<Map<string, number>>((acc, entry) => {
    const actor = extractActorName(entry);
    acc.set(actor, (acc.get(actor) ?? 0) + 1);
    return acc;
  }, new Map());

  const topUsers = Array.from(usageByActor.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([userName, count], index) => ({
      userId: String(index + 1),
      userName,
      count,
    }));

  return {
    totalCount: Math.max(totalEvents, 1),
    activeCount,
    inactiveCount,
    createdThisMonth,
    updatedThisMonth,
    usageCount,
    lastUsed: attribute.updatedAt,
    trends,
    topUsers,
  };
};

const buildDocumentationSections = (
  attribute: Attribute,
  history: HistoryEntry[],
): DocumentationSection[] => {
  const actor = attribute.updatedBy;
  const updatedBy =
    typeof actor === 'string'
      ? actor
      : actor
      ? actor.name || actor.email || actor.id
      : 'System';

  const groups = attribute.attributeGroups?.length
    ? attribute.attributeGroups
        .map((group) => `- **${group.name}** \`(${group.key})\``)
        .join('\n')
    : 'Henüz ilişkilendirilmiş attribute grubu bulunmuyor.';

  const validations =
    attribute.validation && Object.keys(attribute.validation).length > 0
      ? Object.entries(attribute.validation)
          .map(([key, value]) => `- **${key}**: \`${String(value)}\``)
          .join('\n')
      : 'Özel validasyon kuralı tanımlanmamış.';

  const recentChange = history[0];

  const sections: DocumentationSection[] = [
    {
      id: 'overview',
      title: 'Genel Bakış',
      content: `# ${attribute.name}

**Tip:** \`${attribute.type}\`

**Zorunlu:** ${attribute.required ? 'Evet' : 'Hayır'}

**Açıklama:** ${attribute.description ?? '—'}

## Bağlı Attribute Grupları
${groups}

## Son Güncelleme
- Tarih: ${new Date(attribute.updatedAt).toLocaleString()}
- Kullanıcı: ${updatedBy}
`,
      order: 0,
      type: 'markdown',
      lastUpdated: attribute.updatedAt,
      author: updatedBy,
    },
    {
      id: 'validation',
      title: 'Validasyon ve Varsayılan Değer',
      content: `# Varsayılan Değer

\`${formatDefaultValue(attribute.defaultValue, attribute.type)}\`

## Validasyon Kuralları
${validations}

## Tekillik
- Unique: ${attribute.unique ? 'Evet' : 'Hayır'}
`,
      order: 1,
      type: 'markdown',
      lastUpdated: attribute.updatedAt,
      author: updatedBy,
    },
    {
      id: 'history-overview',
      title: 'Değişiklik Özeti',
      content: `# Kaynak Geçmişi

Toplam ${history.length} aktivite kaydı tutuldu.

${
  recentChange
    ? `## Son Aktivite
- İşlem: **${recentChange.action}**
- Zaman: ${new Date(recentChange.timestamp).toLocaleString()}
- Kullanıcı: ${extractActorName(recentChange)}`
    : 'Henüz aktivite kaydı bulunmuyor.'
}
`,
      order: 2,
      type: 'markdown',
      lastUpdated: attribute.updatedAt,
      author: updatedBy,
    },
  ];

  return sections;
};

const buildApiEndpoints = (attribute: Attribute): APIEndpoint[] => [
  {
    id: 'list-attributes',
    method: 'GET',
    path: '/api/attributes',
    description: 'Attribute kayıtlarını listeleyin.',
    parameters: [
      { name: 'search', type: 'string', required: false, description: 'Key veya isim ile arama' },
      { name: 'type', type: 'string', required: false, description: 'Attribute tipi ile filtreleme' },
    ],
    responseExample: {
      items: [
        {
          id: attribute.id,
          key: attribute.key,
          name: attribute.name,
          type: attribute.type,
          required: attribute.required,
        },
      ],
      total: 1,
    },
    requiresAuth: true,
    permissions: [PERMISSIONS.CATALOG.ATTRIBUTES.LIST],
  },
  {
    id: 'get-attribute',
    method: 'GET',
    path: `/api/attributes/${attribute.id}`,
    description: 'Belirli attribute kaydını getirin.',
    parameters: [{ name: 'id', type: 'string', required: true, description: 'Attribute kimliği' }],
    responseExample: {
      id: attribute.id,
      key: attribute.key,
      type: attribute.type,
      required: attribute.required,
      defaultValue: attribute.defaultValue ?? null,
    },
    requiresAuth: true,
    permissions: [PERMISSIONS.CATALOG.ATTRIBUTES.VIEW],
  },
  {
    id: 'update-attribute',
    method: 'PUT',
    path: `/api/attributes/${attribute.id}`,
    description: 'Attribute kaydını güncelleyin.',
    parameters: [{ name: 'id', type: 'string', required: true, description: 'Attribute kimliği' }],
    requestBody: {
      isRequired: attribute.required,
      defaultValue: attribute.defaultValue ?? null,
      validationRules: attribute.validation ?? null,
      comment: 'Güncelleme nedeni burada açıklanır',
    },
    responseExample: {
      id: attribute.id,
      updatedAt: new Date().toISOString(),
    },
    requiresAuth: true,
    permissions: [PERMISSIONS.CATALOG.ATTRIBUTES.UPDATE],
  },
  {
    id: 'history-attribute',
    method: 'GET',
    path: `/api/history`,
    description: 'Attribute geçmişini görüntüleyin.',
    parameters: [
      { name: 'entityType', type: 'string', required: true, description: 'Entity tipi', example: 'Attribute' },
      { name: 'entityId', type: 'string', required: true, description: 'Attribute kimliği', example: attribute.id },
    ],
    responseExample: {
      items: [
        {
          id: 'history-1',
          action: 'updated',
          at: new Date().toISOString(),
          summary: `${attribute.name} güncellendi`,
        },
      ],
      pagination: { page: 1, pageSize: 25, totalItems: 1, totalPages: 1 },
    },
    requiresAuth: true,
    permissions: [PERMISSIONS.CATALOG.ATTRIBUTES.HISTORY],
  },
];

const AttributeDetailsTab: React.FC<{
  attribute: Attribute;
  editMode: boolean;
  onChange: (next: Attribute) => void;
  defaultValueInput: string;
  onDefaultValueChange: (value: string) => void;
  defaultValueError?: string | null;
  previewValue: unknown;
}> = ({
  attribute,
  editMode,
  onChange,
  defaultValueInput,
  onDefaultValueChange,
  defaultValueError,
  previewValue,
}) => {
  const { t } = useLanguage();
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    if (!editMode) {
      setNewOption('');
    }
  }, [editMode]);

  const handleRequiredToggle = (checked: boolean) => {
    onChange({ ...attribute, required: checked });
  };

  const handleUniqueToggle = (checked: boolean) => {
    onChange({ ...attribute, unique: checked });
  };

  const handleOptionRemove = (index: number) => {
    const nextOptions = (attribute.options ?? []).filter((_, idx) => idx !== index);
    onChange({ ...attribute, options: nextOptions });
  };

  const handleOptionAdd = () => {
    const value = newOption.trim();
    if (!value) {
      return;
    }
    if ((attribute.options ?? []).includes(value)) {
      return;
    }
    onChange({ ...attribute, options: [...(attribute.options ?? []), value] });
    setNewOption('');
  };

  const defaultValueLabel = t('attributes.default_value') || 'Varsayılan Değer';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title={t('attributes.basic_information')}
              subtitle={t('attributes.basic_information_subtitle')}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {t('attributes.type')}
                </label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{attribute.type}</Badge>
                  <Badge variant={attribute.required ? 'error' : 'secondary'}>
                    {attribute.required ? t('attributes.required') : t('attributes.optional')}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="inline-flex items-center space-x-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={attribute.required}
                    onChange={(e) => handleRequiredToggle(e.target.checked)}
                    disabled={!editMode}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span>{t('attributes.this_attribute_is_required')}</span>
                </label>
              </div>

              <div>
                <label className="inline-flex items-center space-x-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(attribute.unique)}
                    onChange={(e) => handleUniqueToggle(e.target.checked)}
                    disabled={!editMode}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span>{t('attributes.unique') ?? 'Unique'}</span>
                </label>
              </div>

              <Input
                label={defaultValueLabel}
                value={defaultValueInput}
                onChange={(e) => onDefaultValueChange(e.target.value)}
                placeholder={t('attributes.create.default_value_placeholder')}
                error={defaultValueError || undefined}
                disabled={!editMode}
              />
            </div>
          </Card>

          {OPTION_BASED_TYPES.has(attribute.type) && (
            <Card>
              <CardHeader
                title={t('attributes.available_options')}
                subtitle={t('attributes.available_options_subtitle')}
              />
              <div className="space-y-4">
                {(attribute.options ?? []).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attribute.options?.map((option, index) => (
                      <div
                        key={option}
                        className="group flex items-center justify-between p-3 bg-muted border border-border rounded-lg transition"
                      >
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span>{option}</span>
                        </div>
                        {editMode && (
                          <button
                            onClick={() => handleOptionRemove(index)}
                            className="opacity-0 group-hover:opacity-100 text-error hover:text-error-hover transition"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('attributes.no_options_defined') ?? 'Henüz seçenek eklenmedi.'}
                  </p>
                )}

                {editMode && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder={t('attributes.create.add_option_placeholder')}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleOptionAdd}
                      className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm"
                    >
                      {t('common.add') ?? 'Ekle'}
                    </button>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader
              title={t('attributes.attribute_preview')}
              subtitle={t('attributes.attribute_preview_subtitle')}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">
                  {t('attributes.edit_mode')}
                </h4>
                <div className="p-4 border-2 border-dashed border-border rounded-lg bg-muted">
                  <AttributeRenderer
                    attribute={attribute}
                    value={previewValue}
                    mode="edit"
                    onChange={() => {}}
                  />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">
                  {t('attributes.view_mode')}
                </h4>
                <div className="p-4 border-2 border-dashed border-border rounded-lg bg-muted">
                  <AttributeRenderer attribute={attribute} value={previewValue} mode="view" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={t('attributes.metadata')} />
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('attributes.attribute_id')}:</span>
                <p className="font-mono bg-muted px-2 py-1 rounded mt-1">{attribute.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('attributes.attribute_key')}:</span>
                <p className="font-mono bg-muted px-2 py-1 rounded mt-1">{attribute.key}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('attributes.created')}:</span>
                <p className="mt-1">{new Date(attribute.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('attributes.last_updated')}:</span>
                <p className="mt-1">{new Date(attribute.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={t('attributes.tags_title') ?? 'Etiketler'} />
            <div className="flex flex-wrap gap-2">
              {attribute.tags && attribute.tags.length > 0 ? (
                attribute.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t('attributes.no_tags') ?? 'Etiket tanımlanmamış.'}
                </span>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const AttributeGroupsTab: React.FC<{
  groups: AttributeGroupSummary[];
  editMode?: boolean;
  availableGroups?: AttributeGroup[];
  selectedGroupIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  loading?: boolean;
  error?: string | null;
}> = ({
  groups,
  editMode = false,
  availableGroups = [],
  selectedGroupIds = [],
  onSelectionChange,
  loading = false,
  error,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (editMode) {
    return (
      <Card>
        <CardHeader
          title={t('attributes.attribute_groups')}
          subtitle={
            t('attributes.attribute_groups_edit_subtitle') ??
            'Attribute gruplarını güncellemek için seçim yapın.'
          }
        />
        <div className="px-6 pb-6">
          {loading ? (
            <div className="text-sm text-muted-foreground">
              {t('common.loading') ?? 'Yükleniyor...'}
            </div>
          ) : error ? (
            <div className="text-sm text-error">{error}</div>
          ) : (
            <AttributeGroupSelector
              groups={availableGroups.map((group) => ({
                id: group.id,
                name: group.name,
                description: group.description,
                attributeCount: group.attributeIds?.length,
              }))}
              selectedGroups={selectedGroupIds}
              onSelectionChange={(ids) => onSelectionChange?.(ids)}
            />
          )}
        </div>
      </Card>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <Card>
        <div className="px-6 py-8 text-sm text-muted-foreground">
          {t('attributes.no_groups_selected') ?? 'Bu attribute henüz herhangi bir attribute grubuna bağlı değil.'}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.id} padding="md" className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <TagsIcon className="h-4 w-4 text-primary" />
              {group.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <Hash className="h-3 w-3" />
              <code>{group.key}</code>
            </p>
          </div>
          <button
            onClick={() => navigate(`/attribute-groups/${group.id}`)}
            className="px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition"
          >
            {t('common.view') ?? 'Görüntüle'}
          </button>
        </Card>
      ))}
    </div>
  );
};

export const AttributesDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const requiredLanguages = useRequiredLanguages();

  const canUpdateAttribute = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTES.UPDATE);
  const canDeleteAttribute = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTES.DELETE);
  const canViewAttributeGroupsTab = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.VIEW);
  const canViewAttributeHistory = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTES.HISTORY);
  const canViewNotifications = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.VIEW);
  const canViewAttributeInsights = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTES.VIEW);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [attribute, setAttribute] = useState<Attribute | null>(null);
  const [draftAttribute, setDraftAttribute] = useState<Attribute | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [defaultValueInput, setDefaultValueInput] = useState<string>('');
  const [defaultValueError, setDefaultValueError] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState<LocalizationState>({});
  const [descriptionDraft, setDescriptionDraft] = useState<LocalizationState>({});
  const [documentationSections, setDocumentationSections] = useState<DocumentationSection[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<APIEndpoint[]>([]);
  const [statisticsData, setStatisticsData] = useState<StatisticsType | null>(null);
  const [historySnapshot, setHistorySnapshot] = useState<HistoryEntry[]>([]);
  const [allAttributeGroups, setAllAttributeGroups] = useState<AttributeGroup[]>([]);
  const [attributeGroupsLoading, setAttributeGroupsLoading] = useState<boolean>(true);
  const [attributeGroupsError, setAttributeGroupsError] = useState<string | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const buildLocalizationState = useCallback(
    (translations?: Record<string, string> | null, fallback?: string): LocalizationState => {
      const next: LocalizationState = {};
      requiredLanguages.forEach(({ code }) => {
        const value = translations?.[code];
        if (typeof value === 'string') {
          next[code] = value;
        } else if (fallback) {
          next[code] = fallback;
        } else {
          next[code] = '';
        }
      });
      return next;
    },
    [requiredLanguages],
  );

  const buildTranslationPayload = useCallback(
    (values: LocalizationState, fallback?: LocalizationState): Record<string, string> => {
      const translations: Record<string, string> = {};
      requiredLanguages.forEach(({ code }) => {
        const primary = values[code]?.trim();
        if (primary) {
          translations[code] = primary;
          return;
        }
        const fallbackValue = fallback?.[code]?.trim();
        if (fallbackValue) {
          translations[code] = fallbackValue;
        }
      });
      return translations;
    },
    [requiredLanguages],
  );

  const getPrimaryValue = useCallback(
    (values: LocalizationState, fallback?: string): string => {
      for (const { code } of requiredLanguages) {
        const value = values[code]?.trim();
        if (value) {
          return value;
        }
      }
      if (fallback && fallback.trim()) {
        return fallback.trim();
      }
      return (
        Object.values(values)
          .map((value) => value?.trim())
          .find((value) => value && value.length > 0) ?? ''
      );
    },
    [requiredLanguages],
  );

  useEffect(() => {
    setNameDraft((prev) => buildLocalizationState(prev));
    setDescriptionDraft((prev) => buildLocalizationState(prev));
  }, [buildLocalizationState]);


  const loadAttributeGroups = useCallback(async () => {
    if (!canViewAttributeGroupsTab) {
      setAllAttributeGroups([]);
      setAttributeGroupsLoading(false);
      setAttributeGroupsError(null);
      return;
    }

    try {
      setAttributeGroupsLoading(true);
      setAttributeGroupsError(null);
      const groups = await attributeGroupsService.list();
      setAllAttributeGroups(groups);
    } catch (err) {
      console.error('Failed to load attribute groups', err);
      setAttributeGroupsError(
        t('attributes.failed_to_load_attribute_groups') ??
          'Attribute grupları yüklenemedi. Lütfen daha sonra tekrar deneyin.',
      );
    } finally {
      setAttributeGroupsLoading(false);
    }
  }, [canViewAttributeGroupsTab, t]);

  useEffect(() => {
    loadAttributeGroups().catch((err) => console.error(err));
  }, [loadAttributeGroups]);

  const resolveNameLabel = useCallback(
    (code: string, languageLabel: string) => {
      if (code === 'tr') {
        return (
          t('attributes.create.attribute_name_tr') ||
          `Attribute Name (${languageLabel})`
        );
      }
      if (code === 'en') {
        return (
          t('attributes.create.attribute_name_en') ||
          `Attribute Name (${languageLabel})`
        );
      }
      const dynamic = t('attributes.create.attribute_name_dynamic', { language: languageLabel });
      if (dynamic !== 'attributes.create.attribute_name_dynamic') {
        return dynamic;
      }
      return `Attribute Name (${languageLabel})`;
    },
    [t],
  );

  const resolveDescriptionLabel = useCallback(
    (code: string, languageLabel: string) => {
      if (code === 'tr') {
        return (
          t('attributes.create.description_tr') ||
          `Description (${languageLabel})`
        );
      }
      if (code === 'en') {
        return (
          t('attributes.create.description_en') ||
          `Description (${languageLabel})`
        );
      }
      const dynamic = t('attributes.create.description_dynamic', { language: languageLabel });
      if (dynamic !== 'attributes.create.description_dynamic') {
        return dynamic;
      }
      return `Description (${languageLabel})`;
    },
    [t],
  );

  const fetchInsights = useCallback(
    async (attributeData: Attribute) => {
      try {
        const history = await historyService.getHistory({
          entityType: 'Attribute',
          entityId: attributeData.id,
          page: 1,
          pageSize: 200,
        });
        setHistorySnapshot(history.items);
        setStatisticsData(buildStatistics(attributeData, history.items));
        setDocumentationSections(buildDocumentationSections(attributeData, history.items));
      } catch (err) {
        console.error('Failed to load attribute history', err);
        setDocumentationSections(buildDocumentationSections(attributeData, []));
        setStatisticsData(buildStatistics(attributeData, []));
      }
      setApiEndpoints(buildApiEndpoints(attributeData));
    },
    [],
  );

  const fetchAttribute = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await attributesService.getById(id);
      setAttribute(data);
      setDraftAttribute(data);
      setSelectedGroupIds(data.attributeGroups?.map((group) => group.id) ?? []);
      setDefaultValueInput(formatDefaultValue(data.defaultValue, data.type));
      setDefaultValueError(null);
      setNameDraft(buildLocalizationState(data.localization?.nameTranslations ?? null, data.name));
      setDescriptionDraft(
        buildLocalizationState(data.localization?.descriptionTranslations ?? null, data.description ?? ''),
      );
      await fetchInsights(data);
    } catch (err) {
      console.error('Failed to load attribute', err);
      setError(
        t('attributes.failed_to_load_attribute') ??
          'Attribute detayları yüklenemedi. Lütfen daha sonra tekrar deneyin.',
      );
    } finally {
      setLoading(false);
    }
  }, [buildLocalizationState, fetchInsights, id, t]);

  useEffect(() => {
    void fetchAttribute();
  }, [fetchAttribute]);

  useEffect(() => {
    if (!editMode && attribute) {
      setDraftAttribute(attribute);
      setDefaultValueInput(formatDefaultValue(attribute.defaultValue, attribute.type));
      setDefaultValueError(null);
      setNameDraft(
        buildLocalizationState(attribute.localization?.nameTranslations ?? null, attribute.name),
      );
      setDescriptionDraft(
        buildLocalizationState(
          attribute.localization?.descriptionTranslations ?? null,
          attribute.description ?? '',
        ),
      );
    }
  }, [attribute, buildLocalizationState, editMode]);

  const handleAttributeChange = (next: Attribute) => {
    setDraftAttribute(next);
  };

  const handleDefaultValueChange = (value: string) => {
    setDefaultValueInput(value);
    setDefaultValueError(null);
  };

  const handleGroupSelectionChange = useCallback(
    (ids: string[]) => {
      setSelectedGroupIds(ids);
      setAttributeGroupsError(null);
    },
    [setAttributeGroupsError],
  );

  const applyGroupAssignments = useCallback(async () => {
    if (!attribute) {
      return false;
    }

    if (!canViewAttributeGroupsTab) {
      return false;
    }

    try {
      setAttributeGroupsError(null);
      const updates: Array<Promise<unknown>> = [];

      allAttributeGroups.forEach((group) => {
        const hasAttribute = (group.attributeIds ?? []).includes(attribute.id);
        const shouldHave = selectedGroupIds.includes(group.id);
        if (hasAttribute === shouldHave) {
          return;
        }

        const nextIds = new Set(group.attributeIds ?? []);
        if (shouldHave) {
          nextIds.add(attribute.id);
        } else {
          nextIds.delete(attribute.id);
        }

        updates.push(
          attributeGroupsService.update(group.id, {
            attributeIds: Array.from(nextIds),
          }),
        );
      });

      if (updates.length === 0) {
        return false;
      }

      await Promise.all(updates);
      return true;
    } catch (err) {
      console.error('Failed to update attribute group assignments', err);
      setAttributeGroupsError(
        t('attributes.failed_to_update_attribute_groups') ??
          'Attribute grupları güncellenirken bir hata oluştu.',
      );
      throw err;
    }
  }, [
    attribute,
    allAttributeGroups,
    selectedGroupIds,
    canViewAttributeGroupsTab,
    t,
    setAttributeGroupsError,
  ]);

  const baseDefaultValue = useMemo(() => {
    if (!attribute) {
      return '';
    }
    return formatDefaultValue(attribute.defaultValue, attribute.type);
  }, [attribute]);

  const hasNameChanged = useMemo(() => {
    if (!attribute) {
      return false;
    }
    const original = buildLocalizationState(
      attribute.localization?.nameTranslations ?? null,
      attribute.name,
    );
    return requiredLanguages.some(({ code }) => (nameDraft[code] ?? '') !== (original[code] ?? ''));
  }, [attribute, buildLocalizationState, nameDraft, requiredLanguages]);

  const hasDescriptionChanged = useMemo(() => {
    if (!attribute) {
      return false;
    }
    const original = buildLocalizationState(
      attribute.localization?.descriptionTranslations ?? null,
      attribute.description ?? '',
    );
    return requiredLanguages.some(
      ({ code }) => (descriptionDraft[code] ?? '') !== (original[code] ?? ''),
    );
  }, [attribute, buildLocalizationState, descriptionDraft, requiredLanguages]);

  const originalGroupIds = useMemo(() => {
    if (!attribute?.attributeGroups) {
      return [] as string[];
    }
    return [...attribute.attributeGroups.map((group) => group.id)].sort();
  }, [attribute?.attributeGroups]);

  const hasGroupChanges = useMemo(() => {
    const sortedSelection = [...selectedGroupIds].sort();
    if (sortedSelection.length !== originalGroupIds.length) {
      return true;
    }
    return sortedSelection.some((id, index) => id !== originalGroupIds[index]);
  }, [selectedGroupIds, originalGroupIds]);

  useEffect(() => {
    if (!attribute || editMode) {
      return;
    }
    setSelectedGroupIds([...originalGroupIds]);
  }, [attribute, editMode, originalGroupIds]);

  const hasAttributeChanges = useMemo(() => {
    if (!attribute || !draftAttribute) {
      return false;
    }

    const requiredChanged = draftAttribute.required !== attribute.required;
    const uniqueChanged = Boolean(draftAttribute.unique) !== Boolean(attribute.unique);
    const optionsChanged =
      JSON.stringify(draftAttribute.options ?? []) !== JSON.stringify(attribute.options ?? []);
    const validationChanged =
      JSON.stringify(draftAttribute.validation ?? null) !==
      JSON.stringify(attribute.validation ?? null);
    const defaultChanged = defaultValueInput !== baseDefaultValue;

    return requiredChanged || uniqueChanged || optionsChanged || validationChanged || defaultChanged;
  }, [attribute, draftAttribute, defaultValueInput, baseDefaultValue]);

  const hasChanges =
    (hasAttributeChanges || hasNameChanged || hasDescriptionChanged || hasGroupChanges) &&
    !defaultValueError;

  const previewValue = useMemo(() => {
    if (!draftAttribute) {
      return undefined;
    }
    try {
      return normalizeDefaultValue(defaultValueInput, draftAttribute.type, draftAttribute.options ?? []) ??
        draftAttribute.defaultValue;
    } catch {
      return draftAttribute.defaultValue;
    }
  }, [defaultValueInput, draftAttribute]);

  const getChanges = useCallback(() => {
    if (!attribute || !draftAttribute) {
      return [];
    }
    const changes: Array<{ field: string; oldValue: string | number | boolean; newValue: string | number | boolean }> =
      [];

    if (draftAttribute.required !== attribute.required) {
      changes.push({
        field: t('attributes.required'),
        oldValue: attribute.required,
        newValue: draftAttribute.required,
      });
    }

    if (Boolean(draftAttribute.unique) !== Boolean(attribute.unique)) {
      changes.push({
        field: t('attributes.unique') ?? 'Unique',
        oldValue: Boolean(attribute.unique),
        newValue: Boolean(draftAttribute.unique),
      });
    }

    if (defaultValueInput !== baseDefaultValue) {
      changes.push({
        field: t('attributes.default_value'),
        oldValue: baseDefaultValue,
        newValue: defaultValueInput || '—',
      });
    }

    if (
      JSON.stringify(draftAttribute.options ?? []) !== JSON.stringify(attribute.options ?? [])
    ) {
      changes.push({
        field: t('attributes.option_values'),
        oldValue: (attribute.options ?? []).length,
        newValue: (draftAttribute.options ?? []).length,
      });
    }

    if (hasNameChanged) {
      changes.push({
        field: t('attributes.name'),
        oldValue: attribute.name,
        newValue: getPrimaryValue(nameDraft, attribute.name) || '—',
      });
    }

    if (hasDescriptionChanged) {
      changes.push({
        field: t('attributes.description'),
        oldValue: attribute.description || '—',
        newValue: getPrimaryValue(descriptionDraft, attribute.description ?? '') || '—',
      });
    }

    if (hasGroupChanges) {
      const originalNames = attribute.attributeGroups?.map((group) => group.name) ?? [];
      const selectedNames = selectedGroupIds.map((id) => {
        const fromAttribute = attribute.attributeGroups?.find((group) => group.id === id)?.name;
        if (fromAttribute) {
          return fromAttribute;
        }
        const fromAll = allAttributeGroups.find((group) => group.id === id)?.name;
        return fromAll ?? id;
      });

      changes.push({
        field: t('attributes.attribute_groups'),
        oldValue: originalNames.length > 0 ? originalNames.join(', ') : '—',
        newValue: selectedNames.length > 0 ? selectedNames.join(', ') : '—',
      });
    }

    return changes;
  }, [
    attribute,
    draftAttribute,
    defaultValueInput,
    baseDefaultValue,
    nameDraft,
    descriptionDraft,
    t,
    hasNameChanged,
    hasDescriptionChanged,
    getPrimaryValue,
    hasGroupChanges,
    selectedGroupIds,
    allAttributeGroups,
  ]);

  const handleSaveRequest = () => {
    if (!hasChanges) {
      return;
    }
    setChangeDialogOpen(true);
  };

  const handleSaveWithComment = async (comment: string) => {
    if (!attribute || !draftAttribute) {
      return;
    }

    try {
      let parsedDefault: unknown = attribute.defaultValue;
      if (defaultValueInput !== baseDefaultValue) {
        parsedDefault = normalizeDefaultValue(
          defaultValueInput,
          draftAttribute.type,
          draftAttribute.options ?? [],
        );
      }

      const updatePayload: Record<string, unknown> = {};

      if (draftAttribute.required !== attribute.required) {
        updatePayload.isRequired = draftAttribute.required;
      }
      if (Boolean(draftAttribute.unique) !== Boolean(attribute.unique)) {
        updatePayload.isUnique = Boolean(draftAttribute.unique);
      }
      if (defaultValueInput !== baseDefaultValue) {
        updatePayload.defaultValue = parsedDefault;
      }
      if (
        JSON.stringify(draftAttribute.options ?? []) !== JSON.stringify(attribute.options ?? []) &&
        OPTION_BASED_TYPES.has(draftAttribute.type)
      ) {
        updatePayload.uiSettings = {
          ...(draftAttribute.uiSettings ?? {}),
          options: draftAttribute.options ?? [],
        };
      }
      if (
        JSON.stringify(draftAttribute.validation ?? null) !==
        JSON.stringify(attribute.validation ?? null)
      ) {
        updatePayload.validationRules = draftAttribute.validation ?? null;
      }

      const namespace = 'attributes';
      const updates: Array<Promise<unknown>> = [];
      const nameTranslationsPayload = buildTranslationPayload(nameDraft);
      const descriptionTranslationsPayload = buildTranslationPayload(descriptionDraft, nameDraft);

      if (hasNameChanged && attribute.localization?.nameLocalizationId) {
        updates.push(
          localizationsService.update(attribute.localization.nameLocalizationId, {
            translations: nameTranslationsPayload,
          }),
        );
      }

      if (hasDescriptionChanged) {
        const existingId = attribute.localization?.descriptionLocalizationId;
        if (existingId) {
          updates.push(
            localizationsService.update(existingId, {
              translations: descriptionTranslationsPayload,
            }),
          );
        } else if (Object.keys(descriptionTranslationsPayload).length > 0) {
          const createdLocalization = await localizationsService.create({
            namespace,
            key: `${attribute.key}.description`,
            description: null,
            translations: descriptionTranslationsPayload,
          });
          updatePayload.descriptionLocalizationId = createdLocalization.id;
        }
      }

      await Promise.all(updates);

      let didUpdate = updates.length > 0;

      if (Object.keys(updatePayload).length > 0 || comment) {
        await attributesService.update(attribute.id, { ...updatePayload, comment });
        didUpdate = true;
      } else if (hasNameChanged || hasDescriptionChanged) {
        await attributesService.update(attribute.id, { comment });
        didUpdate = true;
      }

      if (hasGroupChanges) {
        const changed = await applyGroupAssignments();
        if (changed) {
          didUpdate = true;
          await loadAttributeGroups();
        }
      }

      if (didUpdate) {
        showToast({
          type: 'success',
          message:
            t('attributes.attribute_updated_successfully') ?? 'Attribute başarılı şekilde güncellendi.',
        });
      }

      setEditMode(false);
      setChangeDialogOpen(false);
      await fetchAttribute();
    } catch (err: any) {
      console.error('Failed to update attribute', err);
      const message =
        err?.response?.data?.error?.message ??
        err?.message ??
        attributeGroupsError ??
        (t('attributes.failed_to_update_attribute') ?? 'Attribute güncellenemedi.');
      showToast({
        type: 'error',
        message,
      });
    }
  };

  const handleDelete = useCallback(async () => {
    if (!attribute || deleting) {
      return;
    }
    try {
      setDeleting(true);
      await attributesService.delete(attribute.id);
      showToast({
        type: 'success',
        message: t('attributes.delete_success') || 'Attribute başarıyla silindi.',
      });
      navigate('/attributes', { replace: true });
    } catch (err: any) {
      console.error('Failed to delete attribute', err);
      const message =
        err?.response?.data?.error?.message ??
        err?.message ??
        t('attributes.delete_failed') ??
        'Attribute silinemedi.';
      showToast({ type: 'error', message });
    } finally {
      setDeleting(false);
    }
  }, [attribute, deleting, navigate, showToast, t]);

  if (loading) {
    return (
      <div className="px-6 py-12">
        <p className="text-sm text-muted-foreground">
          {t('common.loading') ?? 'Yükleniyor...'}
        </p>
      </div>
    );
  }

  if (error || !attribute || !draftAttribute) {
    return (
      <div className="px-6 py-12">
        <Card>
          <div className="px-6 py-8 text-sm text-error">
            {error ??
              t('attributes.failed_to_load_attribute') ??
              'Attribute detayları yüklenemedi.'}
          </div>
        </Card>
      </div>
    );
  }

  const headerTitle = editMode ? (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requiredLanguages.map(({ code, label }) => (
          <Input
            key={`attribute-edit-name-${code}`}
            label={resolveNameLabel(code, label)}
            value={nameDraft[code] ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              setNameDraft((prev) => ({ ...prev, [code]: value }));
            }}
            required
          />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requiredLanguages.map(({ code, label }) => (
          <Textarea
            key={`attribute-edit-description-${code}`}
            label={resolveDescriptionLabel(code, label)}
            value={descriptionDraft[code] ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              setDescriptionDraft((prev) => ({ ...prev, [code]: value }));
            }}
            rows={3}
          />
        ))}
      </div>
    </div>
  ) : (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-foreground">{attribute.name}</h1>
        <Badge variant="secondary">{attribute.type}</Badge>
        <Badge variant={attribute.required ? 'error' : 'secondary'}>
          {attribute.required ? t('attributes.required') : t('attributes.optional')}
        </Badge>
        {attribute.unique ? (
          <Badge variant="secondary">
            <Shield className="h-3 w-3 mr-1" />
            {t('attributes.unique') ?? 'Unique'}
          </Badge>
        ) : null}
      </div>
      {attribute.description ? (
        <p className="text-sm text-muted-foreground max-w-3xl">{attribute.description}</p>
      ) : null}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span>
          {t('attributes.last_updated')}:{' '}
          {new Date(attribute.updatedAt).toLocaleString()}
        </span>
        <span>
          {t('attributes.attribute_key')}:{' '}
          <code>{attribute.key}</code>
        </span>
      </div>
    </div>
  );

  const headerSubtitle = editMode ? null : (
    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
      <Activity className="h-3 w-3" />
      <span>
        {t('attributes.attribute_groups')}:{' '}
        {attribute.attributeGroups ? attribute.attributeGroups.length : 0}
      </span>
    </div>
  );

  const tabs = [
    {
      id: 'details',
      label: t('attributes.details'),
      icon: FileText,
      component: AttributeDetailsTab,
      props: {
        attribute: draftAttribute,
        editMode,
        onChange: handleAttributeChange,
        defaultValueInput,
        onDefaultValueChange: handleDefaultValueChange,
        defaultValueError,
        previewValue,
      },
    },
    {
      id: 'attribute-groups',
      label: t('attributes.attribute_groups'),
      icon: TagsIcon,
      component: AttributeGroupsTab,
      props: {
        groups: attribute.attributeGroups ?? [],
        editMode,
        availableGroups: allAttributeGroups,
        selectedGroupIds,
        onSelectionChange: handleGroupSelectionChange,
        loading: attributeGroupsLoading,
        error: attributeGroupsError,
      },
      badge: attribute.attributeGroups?.length,
      hidden: !canViewAttributeGroupsTab,
    },
    {
      id: 'notifications',
      label: t('attributes.notifications'),
      icon: Bell,
      component: EntityNotificationsTab,
      props: {
        entityType: 'attribute',
        entityId: attribute.id,
        entityName: attribute.name,
      },
      hidden: !canViewNotifications,
    },
    {
      id: 'statistics',
      label: t('attributes.statistics'),
      icon: BarChart3,
      component: Statistics,
      props: {
        entityType: 'attribute',
        entityId: attribute.id,
        statistics: statisticsData ?? undefined,
      },
      hidden: !canViewAttributeInsights,
    },
    {
      id: 'api',
      label: t('attributes.api'),
      icon: Globe,
      component: APITester,
      props: {
        entityType: 'attribute',
        entityId: attribute.id,
        endpoints: apiEndpoints,
        editMode: editMode,
      },
      hidden: !canViewAttributeInsights,
    },
    {
      id: 'documentation',
      label: t('attributes.documentation'),
      icon: BookOpen,
      component: Documentation,
      props: {
        entityType: 'attribute',
        entityId: attribute.id,
        sections: documentationSections,
        editMode,
      },
      hidden: !canViewAttributeInsights,
    },
    {
      id: 'history',
      label: t('attributes.history'),
      icon: HistoryIcon,
      component: HistoryTable,
      props: {
        entityType: 'Attribute',
        entityId: attribute.id,
        records: historySnapshot,
      },
      badge: historySnapshot.length,
      hidden: !canViewAttributeHistory,
    },
  ];

  const attributeName = attribute?.name?.trim() || attribute?.key || attribute?.id || '';
  const linkedGroupNames =
    attribute?.attributeGroups?.map((group) => group.name || group.key || group.id) ?? [];
  const attributeInUse = linkedGroupNames.length > 0;
  const canDeleteAttributeSafely = canDeleteAttribute;
  const deleteBlockedMessage = attributeInUse
    ? t('attributes.delete_blocked_in_groups', {
        groups: linkedGroupNames.join(', '),
      }) ||
      `Bu attribute şu gruplarda kullanılıyor: ${linkedGroupNames.join(', ')}`
    : null;

  return (
    <>
      <DetailsLayout
        title={headerTitle}
        subtitle={headerSubtitle}
        icon={<FileText className="h-6 w-6 text-white" />}
        tabs={tabs}
        defaultTab="details"
        backUrl="/attributes"
        editMode={editMode}
        hasChanges={hasChanges}
        onEdit={canUpdateAttribute ? () => setEditMode(true) : undefined}
        onSave={canUpdateAttribute ? handleSaveRequest : undefined}
        onCancel={() => {
          setEditMode(false);
          setDefaultValueInput(baseDefaultValue);
          setDefaultValueError(null);
          setSelectedGroupIds(attribute.attributeGroups?.map((group) => group.id) ?? []);
          setAttributeGroupsError(null);
        }}
        onDelete={canDeleteAttributeSafely ? handleDelete : undefined}
        deleteButtonLabel={t('common.delete') ?? 'Sil'}
        deleteDialogTitle={t('attributes.delete_title', { name: attributeName }) || 'Attribute silinsin mi?'}
        deleteDialogDescription={
          attributeInUse && deleteBlockedMessage
            ? deleteBlockedMessage
            : t('attributes.delete_description', { name: attributeName }) ||
              'Bu attribute kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz.'
        }
        deleteConfirmLabel={t('attributes.delete_action') || 'Attribute Sil'}
        deleteCancelLabel={t('common.cancel') || 'İptal'}
        deleteLoading={deleting}
        canDelete={canDeleteAttributeSafely}
        inlineActions={false}
      />

      <ChangeConfirmDialog
        open={canUpdateAttribute && changeDialogOpen}
        onClose={() => setChangeDialogOpen(false)}
        onConfirm={handleSaveWithComment}
        title={t('attributes.save_changes')}
        changes={getChanges()}
        entityName={t('attributes.attribute')}
      />
    </>
  );
};

export default AttributesDetails;
