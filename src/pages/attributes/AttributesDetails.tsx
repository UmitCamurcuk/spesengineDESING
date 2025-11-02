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
import { NotificationSettings } from '../../components/common/NotificationSettings';
import { APITester } from '../../components/common/APITester';
import { Documentation } from '../../components/common/Documentation';
import { Statistics } from '../../components/common/Statistics';
import { ChangeConfirmDialog } from '../../components/ui/ChangeConfirmDialog';
import { attributesService } from '../../api/services/attributes.service';
import { localizationsService } from '../../api/services/localizations.service';
import { useRequiredLanguages } from '../../hooks/useRequiredLanguages';
import { historyService } from '../../api/services/history.service';
import { Attribute, AttributeGroupSummary, AttributeType } from '../../types';
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
}> = ({ groups }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

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
  const requiredLanguages = useRequiredLanguages();

  const canUpdateAttribute = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTES.UPDATE);

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

  const hasChanges = (hasAttributeChanges || hasNameChanged || hasDescriptionChanged) && !defaultValueError;

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

      if (Object.keys(updatePayload).length > 0 || comment) {
        await attributesService.update(attribute.id, { ...updatePayload, comment });
      } else if (hasNameChanged || hasDescriptionChanged) {
        await attributesService.update(attribute.id, { comment });
      }

      showToast({
        type: 'success',
        message:
          t('attributes.attribute_updated_successfully') ?? 'Attribute başarılı şekilde güncellendi.',
      });
      setEditMode(false);
      setChangeDialogOpen(false);
      await fetchAttribute();
    } catch (err: any) {
      console.error('Failed to update attribute', err);
      showToast({
        type: 'error',
        message:
          err?.response?.data?.error?.message ??
          err?.message ??
          (t('attributes.failed_to_update_attribute') ?? 'Attribute güncellenemedi.'),
      });
    }
  };

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
      props: { groups: attribute.attributeGroups ?? [] },
      badge: attribute.attributeGroups?.length,
    },
    {
      id: 'notifications',
      label: t('attributes.notifications'),
      icon: Bell,
      component: NotificationSettings,
      props: { entityType: 'attribute', entityId: attribute.id },
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
        editMode: false,
      },
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
        editMode: false,
      },
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
    },
  ];

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
        onCancel={() => setEditMode(false)}
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
