import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Tags as TagsIcon,
  FileText,
  BarChart3,
  Globe,
  BookOpen,
  History as HistoryIcon,
  Layers,
  Hash,
  Activity,
  Clock,
  Check,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChangeConfirmDialog } from '../../components/ui/ChangeConfirmDialog';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { HistoryTable } from '../../components/common/HistoryTable';
import { EntityNotificationsTab } from '../../components/notifications/EntityNotificationsTab';
import { Documentation } from '../../components/common/Documentation';
import { Statistics } from '../../components/common/Statistics';
import { APITester } from '../../components/common/APITester';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { AttributeGroup, Attribute } from '../../types';
import { TabConfig, DocumentationSection, APIEndpoint, Statistics as StatisticsType } from '../../types/common';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import { attributesService } from '../../api/services/attributes.service';
import { localizationsService } from '../../api/services/localizations.service';
import { UserInfoWithRole } from '../../components/common/UserInfoWithRole';
import { PERMISSIONS } from '../../config/permissions';
import { useRequiredLanguages } from '../../hooks/useRequiredLanguages';
import type { LocalizationRecord } from '../../api/types/api.types';
import { logosService } from '../../api/services/logos.service';

interface AttributeGroupDetailsTabProps {
  group: AttributeGroup;
  editMode?: boolean;
  requiredLanguages: ReturnType<typeof useRequiredLanguages>;
  nameDraft: LocalizationState;
  descriptionDraft: LocalizationState;
  noteDraft: LocalizationState;
  onNameChange: (code: string, value: string) => void;
  onDescriptionChange: (code: string, value: string) => void;
  onNoteChange: (code: string, value: string) => void;
  displayOrderDraft: number;
  onDisplayOrderChange: (value: number) => void;
  tagsRaw: string;
  onTagsRawChange: (value: string) => void;
  formErrors?: FormErrors;
  localizationsLoading?: boolean;
  localizationsError?: string | null;
}

interface AttributeGroupAttributesTabProps {
  attributes: Attribute[];
  isLoading: boolean;
  editMode?: boolean;
  availableAttributes?: Attribute[];
  selectedAttributeIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  selectionLoading?: boolean;
  selectionError?: string | null;
  onRetryLoad?: () => void;
}

type LocalizationState = Record<string, string>;
type FormErrors = Record<string, string>;

const parseTags = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const AttributeGroupDetailsTab: React.FC<AttributeGroupDetailsTabProps> = ({
  group,
  editMode = false,
  requiredLanguages,
  nameDraft,
  descriptionDraft,
  noteDraft,
  onNameChange,
  onDescriptionChange,
  onNoteChange,
  displayOrderDraft,
  onDisplayOrderChange,
  tagsRaw,
  onTagsRawChange,
  formErrors = {},
  localizationsLoading = false,
  localizationsError = null,
}) => {
  const { t } = useLanguage();
  const attributeCount = group.attributeIds?.length ?? group.attributes.length ?? 0;

  if (editMode) {
    const tagError = formErrors.tags;
    const orderError = formErrors.displayOrder;

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {t('attributeGroups.basic_information') || 'Temel Bilgiler'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('attributeGroups.basic_information_edit_help') ||
                'Grubun temel bilgilerini ve çevirilerini güncelleyin.'}
            </p>
          </div>

          {localizationsLoading ? (
            <div className="text-sm text-muted-foreground">
              {t('attributeGroups.loading_localizations') ?? 'Çeviri kayıtları yükleniyor...'}
            </div>
          ) : null}
          {localizationsError ? (
            <div className="text-sm text-error">{localizationsError}</div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label={t('attributeGroups.key') || 'Anahtar'}
              value={group.key ?? ''}
              disabled
              helperText={t('attributeGroups.key_edit_helper') || 'Anahtar düzenlenemez.'}
            />

            <Input
              label={t('attributeGroups.display_order') || 'Gösterim Sırası'}
              type="number"
              value={displayOrderDraft.toString()}
              onChange={(event) => {
                const value = Number(event.target.value);
                onDisplayOrderChange(Number.isNaN(value) ? 0 : value);
              }}
              error={orderError}
              min={0}
            />

            {requiredLanguages.map(({ code, label }) => (
              <Input
                key={`group-name-${code}`}
                label={`${t('attributeGroups.name_label', { language: label }) || 'Ad'} (${label})`}
                value={nameDraft[code] ?? ''}
                onChange={(event) => onNameChange(code, event.target.value)}
                required
                error={formErrors[`name.${code}`]}
              />
            ))}

            {requiredLanguages.map(({ code, label }) => (
              <Textarea
                key={`group-description-${code}`}
                label={`${t('attributeGroups.description_label', { language: label }) || 'Açıklama'} (${label})`}
                value={descriptionDraft[code] ?? ''}
                onChange={(event) => onDescriptionChange(code, event.target.value)}
                rows={3}
                error={formErrors[`description.${code}`]}
              />
            ))}

            {requiredLanguages.map(({ code, label }) => (
              <Textarea
                key={`group-note-${code}`}
                label={`${t('attributeGroups.note_label', { language: label }) || 'Not'} (${label})`}
                value={noteDraft[code] ?? ''}
                onChange={(event) => onNoteChange(code, event.target.value)}
                rows={3}
                error={formErrors[`note.${code}`]}
              />
            ))}

            <div className="md:col-span-2 space-y-2">
              <Input
                label={t('attributeGroups.tags_label') || 'Etiketler'}
                placeholder={t('attributeGroups.tags_placeholder') || 'tag1, tag2, tag3'}
                value={tagsRaw}
                onChange={(event) => {
                  const raw = event.target.value;
                  onTagsRawChange(raw);
                }}
                helperText={
                  tagError ??
                  t('attributeGroups.tags_helper') ??
                  'Etiketleri virgülle ayırarak girebilirsiniz.'
                }
                error={tagError}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {t('attributeGroups.basic_information') || 'Temel Bilgiler'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('attributeGroups.basic_information_subtitle') ||
              'Öznitelik grubuna ait temel meta verileri görüntüleyin.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1 text-sm">
            <span className="text-muted-foreground">{t('attributeGroups.key') || 'Anahtar'}</span>
            <p className="font-mono bg-muted px-2 py-1 rounded inline-block">{group.key ?? group.id}</p>
          </div>

          <div className="space-y-1 text-sm">
            <span className="text-muted-foreground">
              {t('attributeGroups.display_order') || 'Gösterim Sırası'}
            </span>
            <p>{group.order ?? 0}</p>
          </div>

          <div className="space-y-1 text-sm md:col-span-2">
            <span className="text-muted-foreground">{t('attributeGroups.description') || 'Açıklama'}</span>
            <p className="text-foreground">{group.description || '—'}</p>
          </div>

          {group.note ? (
            <div className="space-y-1 text-sm md:col-span-2">
              <span className="text-muted-foreground">{t('attributeGroups.note') || 'Not'}</span>
              <p className="text-foreground">{group.note}</p>
            </div>
          ) : null}

          <div className="space-y-1 text-sm">
            <span className="text-muted-foreground">{t('attributeGroups.created_at') || 'Oluşturulma'}</span>
            <p>{new Date(group.createdAt).toLocaleString()}</p>
          </div>

          <div className="space-y-1 text-sm">
            <span className="text-muted-foreground">{t('attributeGroups.updated_at') || 'Güncellenme'}</span>
            <p>{new Date(group.updatedAt).toLocaleString()}</p>
          </div>

          <div className="space-y-1 text-sm">
            <span className="text-muted-foreground">{t('attributeGroups.created_by') || 'Oluşturan'}</span>
            <UserInfoWithRole user={group.createdBy} />
          </div>

          <div className="space-y-1 text-sm">
            <span className="text-muted-foreground">{t('attributeGroups.updated_by') || 'Güncelleyen'}</span>
            <UserInfoWithRole user={group.updatedBy} />
          </div>

          <div className="space-y-1 text-sm md:col-span-2">
            <span className="text-muted-foreground">{t('attributeGroups.tags_label') || 'Etiketler'}</span>
            {group.tags && group.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p>—</p>
            )}
          </div>

          <div className="space-y-1 text-sm md:col-span-2">
            <span className="text-muted-foreground">{t('attributeGroups.attribute_count')}</span>
            <Badge variant="primary">{attributeCount}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

const AttributeGroupAttributesTab: React.FC<AttributeGroupAttributesTabProps> = ({
  attributes,
  isLoading,
  editMode = false,
  availableAttributes = [],
  selectedAttributeIds = [],
  onSelectionChange,
  selectionLoading = false,
  selectionError,
  onRetryLoad,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!editMode) {
      setSearchTerm('');
    }
  }, [editMode]);

  const filteredAttributes = useMemo(() => {
    if (!editMode) {
      return [];
    }
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return availableAttributes;
    }
    return availableAttributes.filter((attribute) => {
      const haystack = [
        attribute.name,
        attribute.key ?? '',
        attribute.description ?? '',
        ...(attribute.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [availableAttributes, editMode, searchTerm]);

  const selectedMetadata = useMemo(() => {
    if (!selectedAttributeIds || selectedAttributeIds.length === 0) {
      return [];
    }
    const merged = new Map<string, Attribute>();
    availableAttributes.forEach((attribute) => merged.set(attribute.id, attribute));
    attributes.forEach((attribute) => {
      if (!merged.has(attribute.id)) {
        merged.set(attribute.id, attribute);
      }
    });
    return selectedAttributeIds
      .map((id) => merged.get(id))
      .filter((value): value is Attribute => Boolean(value));
  }, [availableAttributes, attributes, selectedAttributeIds]);

  const handleToggle = (attributeId: string) => {
    if (!onSelectionChange) {
      return;
    }
    const isSelected = selectedAttributeIds.includes(attributeId);
    const nextIds = isSelected
      ? selectedAttributeIds.filter((id) => id !== attributeId)
      : [...selectedAttributeIds, attributeId];
    onSelectionChange(nextIds);
  };

  if (editMode) {
    return (
      <Card>
        <CardHeader
          title={t('attributeGroups.manage_attributes_title') ?? 'Attribute Seçimi'}
          subtitle={
            t('attributeGroups.manage_attributes_subtitle') ??
            'Attribute grubuna dahil edeceğiniz attribute’ları seçin.'
          }
        />
        <div className="px-6 pb-6 space-y-4">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t('attributeGroups.search_attributes_placeholder') ?? 'Attribute ara'}
            disabled={selectionLoading}
          />

          {selectionError ? (
            <div className="space-y-3">
              <div className="text-sm text-error">{selectionError}</div>
              {onRetryLoad ? (
                <Button size="sm" variant="outline" onClick={onRetryLoad}>
                  {t('common.retry') ?? 'Tekrar dene'}
                </Button>
              ) : null}
            </div>
          ) : selectionLoading ? (
            <div className="text-sm text-muted-foreground">
              {t('common.loading') ?? 'Yükleniyor...'}
            </div>
          ) : filteredAttributes.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {t('attributeGroups.no_matching_attributes') ?? 'Eşleşen attribute bulunamadı.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAttributes.map((attribute) => {
                const isSelected = selectedAttributeIds.includes(attribute.id);
                return (
                  <button
                    type="button"
                    key={attribute.id}
                    onClick={() => handleToggle(attribute.id)}
                    className={`relative p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border hover:border-primary/60 hover:bg-muted/60'
                    }`}
                  >
                    {isSelected ? (
                      <div className="absolute top-3 right-3">
                        <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                          <Check className="h-3 w-3" />
                        </div>
                      </div>
                    ) : null}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-foreground">{attribute.name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Hash className="h-3 w-3" />
                          <code>{attribute.key ?? attribute.id}</code>
                        </p>
                        {attribute.description ? (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {attribute.description}
                          </p>
                        ) : null}
                      </div>
                      <Badge variant="secondary">{attribute.type}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedMetadata.length > 0 ? (
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium text-foreground mb-2">
                {t('attributeGroups.selected_attributes_count', { count: selectedMetadata.length }) ??
                  `Seçilen attribute: ${selectedMetadata.length}`}
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedMetadata.map((attribute) => (
                  <Badge key={attribute.id} variant="outline">
                    {attribute.name}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <div className="px-6 py-10 text-sm text-muted-foreground">
          {t('common.loading') || 'Yükleniyor...'}
        </div>
      </Card>
    );
  }

  if (attributes.length === 0) {
    return (
      <Card>
        <div className="px-6 py-10 text-sm text-muted-foreground">
          {t('attributeGroups.no_attributes') || 'Bu attribute grubu henüz attribute içermiyor.'}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {attributes.map((attribute) => (
        <Card key={attribute.id} padding="md">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                {attribute.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                <code>{attribute.key ?? attribute.id}</code>
              </p>
            </div>
            <Badge variant="secondary">{attribute.type}</Badge>
          </div>
          <div className="mt-3 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Hash className="h-3 w-3" />
              <span>
                {attribute.required
                  ? t('attributes.required') ?? 'Zorunlu'
                  : t('attributes.optional') ?? 'Opsiyonel'}
              </span>
            </div>
            {attribute.description ? <p>{attribute.description}</p> : null}
          </div>
        </Card>
      ))}
    </div>
  );
};

export const AttributeGroupsDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const requiredLanguages = useRequiredLanguages();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<AttributeGroup | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<Attribute[]>([]);
  const [availableAttributesLoading, setAvailableAttributesLoading] = useState(false);
  const [availableAttributesError, setAvailableAttributesError] = useState<string | null>(null);
	  const [saving, setSaving] = useState(false);
	  const attributesLoadedRef = useRef(false);
	  const headerLogoInputRef = useRef<HTMLInputElement>(null);
	  const [logoFileDraft, setLogoFileDraft] = useState<File | null>(null);
	  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [groupDraft, setGroupDraft] = useState<AttributeGroup | null>(null);
  const [nameDraft, setNameDraft] = useState<LocalizationState>({});
  const [descriptionDraft, setDescriptionDraft] = useState<LocalizationState>({});
  const [noteDraft, setNoteDraft] = useState<LocalizationState>({});
  const [initialNameState, setInitialNameState] = useState<LocalizationState>({});
  const [initialDescriptionState, setInitialDescriptionState] = useState<LocalizationState>({});
  const [initialNoteState, setInitialNoteState] = useState<LocalizationState>({});
  const [displayOrderDraft, setDisplayOrderDraft] = useState<number>(0);
  const [initialDisplayOrder, setInitialDisplayOrder] = useState<number>(0);
  const [tagsRaw, setTagsRaw] = useState<string>('');
  const [tagsDraft, setTagsDraft] = useState<string[]>([]);
  const [initialTags, setInitialTags] = useState<string[]>([]);
  const [detailsErrors, setDetailsErrors] = useState<FormErrors>({});
  const localizationCacheRef = useRef<Record<string, LocalizationRecord>>({});
  const [localizationsLoading, setLocalizationsLoading] = useState(false);
  const [localizationsError, setLocalizationsError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<
    { field: string; oldValue: string | number | boolean; newValue: string | number | boolean }[]
  >([]);

  const buildLocalizationState = useCallback(
    (translations?: Record<string, string> | null, fallback?: string): LocalizationState => {
      const normalized = new Map<string, string>();
      if (translations) {
        Object.entries(translations).forEach(([code, value]) => {
          if (typeof value === 'string') {
            normalized.set(code.toLowerCase(), value);
          }
        });
      }

      const next: LocalizationState = {};
      requiredLanguages.forEach(({ code }) => {
        const normalizedCode = code.toLowerCase();
        const translatedValue = normalized.get(normalizedCode);
        next[code] =
          typeof translatedValue === 'string'
            ? translatedValue
            : fallback && normalizedCode === requiredLanguages[0]?.code.toLowerCase()
            ? fallback
            : '';
      });
      return next;
    },
    [requiredLanguages],
  );

  const buildTranslationPayload = useCallback(
    (values: LocalizationState): Record<string, string> => {
      const payload: Record<string, string> = {};
      requiredLanguages.forEach(({ code }) => {
        const value = values[code]?.trim();
        if (value) {
          payload[code] = value;
        }
      });
      return payload;
    },
    [requiredLanguages],
  );

  useEffect(() => {
    setNameDraft((prev) => buildLocalizationState(prev));
    setDescriptionDraft((prev) => buildLocalizationState(prev));
    setNoteDraft((prev) => buildLocalizationState(prev));
    setInitialNameState((prev) => buildLocalizationState(prev));
    setInitialDescriptionState((prev) => buildLocalizationState(prev));
    setInitialNoteState((prev) => buildLocalizationState(prev));
  }, [buildLocalizationState]);

  const loadLocalizationDetails = useCallback(
    async (groupData: AttributeGroup, resetInitial = true) => {
      const nameId = groupData.localization?.nameLocalizationId ?? null;
      const descriptionId = groupData.localization?.descriptionLocalizationId ?? null;
      const noteId = groupData.localization?.noteLocalizationId ?? null;

      const ids = [nameId, descriptionId, noteId].filter(
        (value): value is string => Boolean(value),
      );

      if (ids.length === 0) {
        const fallbackName = buildLocalizationState(null, groupData.name);
        const fallbackDescription = buildLocalizationState(null, groupData.description ?? '');
        const fallbackNote = buildLocalizationState(null, groupData.note ?? '');
        setNameDraft(fallbackName);
        setDescriptionDraft(fallbackDescription);
        setNoteDraft(fallbackNote);
        setLocalizationsLoading(false);
        setLocalizationsError(null);
        if (resetInitial) {
          setInitialNameState(fallbackName);
          setInitialDescriptionState(fallbackDescription);
          setInitialNoteState(fallbackNote);
        }
        return;
      }

      setLocalizationsLoading(true);
      setLocalizationsError(null);
      const fetched: Record<string, LocalizationRecord> = {};

      await Promise.all(
        ids.map(async (localizationId) => {
          try {
            const cache = localizationCacheRef.current;
            if (cache[localizationId]) {
              fetched[localizationId] = cache[localizationId];
              return;
            }
            const record = await localizationsService.getById(localizationId);
            fetched[localizationId] = record;
          } catch (err) {
            console.error('Failed to load localization record', localizationId, err);
            setLocalizationsError(
              t('attributeGroups.failed_to_load_localizations') ||
                'Çeviri kayıtları yüklenemedi.',
            );
          }
        }),
      );

      setLocalizationsLoading(false);

      const nextCache = { ...localizationCacheRef.current, ...fetched };
      localizationCacheRef.current = nextCache;

      const nameTranslations = nameId ? nextCache[nameId]?.translations ?? null : null;
      const descriptionTranslations = descriptionId
        ? nextCache[descriptionId]?.translations ?? null
        : null;
      const noteTranslations = noteId ? nextCache[noteId]?.translations ?? null : null;

      const nextNameState = buildLocalizationState(nameTranslations, groupData.name);
      const nextDescriptionState = buildLocalizationState(
        descriptionTranslations,
        groupData.description ?? '',
      );
      const nextNoteState = buildLocalizationState(noteTranslations, groupData.note ?? '');

      setNameDraft(nextNameState);
      setDescriptionDraft(nextDescriptionState);
      setNoteDraft(nextNoteState);

      if (resetInitial) {
        setInitialNameState(nextNameState);
        setInitialDescriptionState(nextDescriptionState);
        setInitialNoteState(nextNoteState);
      }
    },
    [buildLocalizationState, t],
  );

  useEffect(() => {
    if (!logoFileDraft) {
      setLogoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFileDraft);
    setLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFileDraft]);

  const canUpdateGroup = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.UPDATE);
  const canDeleteGroup = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.DELETE);
  const attributeGroupLogoPermission = PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.LOGO;
  const canEditLogo = attributeGroupLogoPermission ? hasPermission(attributeGroupLogoPermission) : false;
  const canViewAttributesTab = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTES.VIEW);
  const canViewHistory = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.HISTORY);
  const canViewNotifications = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.VIEW);
  const canViewStatistics = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.VIEW);
  const canViewDocumentation = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.VIEW);
  const canViewApi = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.VIEW);

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await attributeGroupsService.getById(id);
        if (cancelled) return;
        setGroup(data);
        setGroupDraft(data);
        setAttributes(Array.isArray(data.attributes) ? data.attributes : []);
        const attributeIds = Array.isArray(data.attributeIds) ? data.attributeIds : [];
        setSelectedAttributeIds(attributeIds);
        setEditMode(false);
        setAvailableAttributes([]);
        setAvailableAttributesError(null);
        attributesLoadedRef.current = false;

        const order = data.order ?? 0;
        setDisplayOrderDraft(order);
        setInitialDisplayOrder(order);

        const nextTags = (data.tags ?? []).map((tag) => tag.trim()).filter(Boolean);
        setTagsDraft(nextTags);
        setInitialTags(nextTags);
        setTagsRaw(nextTags.join(', '));
        setDetailsErrors({});

        await loadLocalizationDetails(data, true);
      } catch (err: any) {
        console.error('Failed to load attribute group', err);
        if (cancelled) return;
        setError(
          err?.response?.data?.error?.message ??
            t('attributeGroups.failed_to_load') ??
            'Attribute grubu yüklenemedi.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [id, t, loadLocalizationDetails]);

  useEffect(() => {
    if (!group) {
      return;
    }
    setGroupDraft(group);
    const order = group.order ?? 0;
    setDisplayOrderDraft(order);
    setInitialDisplayOrder(order);

    const nextTags = (group.tags ?? []).map((tag) => tag.trim()).filter(Boolean);
    setTagsDraft(nextTags);
    setInitialTags(nextTags);
    setTagsRaw(nextTags.join(', '));

    void loadLocalizationDetails(group, true);
  }, [group, loadLocalizationDetails]);

  useEffect(() => {
    if (!editMode) {
      const currentIds = Array.isArray(group?.attributeIds) ? group?.attributeIds : [];
      setSelectedAttributeIds(currentIds);
      setNameDraft(initialNameState);
      setDescriptionDraft(initialDescriptionState);
      setNoteDraft(initialNoteState);
      setDisplayOrderDraft(initialDisplayOrder);
      setTagsDraft(initialTags);
      setTagsRaw(initialTags.join(', '));
      setDetailsErrors({});
      setLocalizationsError(null);
    }
  }, [
    editMode,
    group?.attributeIds,
    initialNameState,
    initialDescriptionState,
    initialNoteState,
    initialDisplayOrder,
    initialTags,
  ]);

  const loadAvailableAttributes = useCallback(
    async (force = false) => {
      if (!canUpdateGroup) {
        return;
      }
      if (!force && attributesLoadedRef.current) {
        return;
      }

      try {
        setAvailableAttributesLoading(true);
        setAvailableAttributesError(null);
        const items = await attributesService.list();
        setAvailableAttributes(items);
        attributesLoadedRef.current = true;
      } catch (err) {
        console.error('Failed to load attributes for attribute group editing', err);
        setAvailableAttributesError(
          t('attributeGroups.failed_to_load_available_attributes') ??
            'Attribute listesi yüklenirken bir hata oluştu.',
        );
        attributesLoadedRef.current = false;
      } finally {
        setAvailableAttributesLoading(false);
      }
    },
    [canUpdateGroup, t],
  );

  useEffect(() => {
    if (editMode) {
      void loadAvailableAttributes();
    }
  }, [editMode, loadAvailableAttributes]);

  const originalAttributeIds = useMemo(() => {
    if (!group?.attributeIds) {
      return [] as string[];
    }
    return [...group.attributeIds].sort();
  }, [group?.attributeIds]);

  const hasAttributeAssignmentChanges = useMemo(() => {
    if (!editMode) {
      return false;
    }
    const sortedSelection = [...selectedAttributeIds].sort();
    if (sortedSelection.length !== originalAttributeIds.length) {
      return true;
    }
    return sortedSelection.some((id, index) => id !== originalAttributeIds[index]);
  }, [editMode, originalAttributeIds, selectedAttributeIds]);

  const hasNameChanges = useMemo(
    () =>
      requiredLanguages.some(
        ({ code }) => (nameDraft[code] ?? '').trim() !== (initialNameState[code] ?? '').trim(),
      ),
    [nameDraft, initialNameState, requiredLanguages],
  );

  const hasDescriptionChanges = useMemo(
    () =>
      requiredLanguages.some(
        ({ code }) =>
          (descriptionDraft[code] ?? '').trim() !== (initialDescriptionState[code] ?? '').trim(),
      ),
    [descriptionDraft, initialDescriptionState, requiredLanguages],
  );

  const hasNoteChanges = useMemo(
    () =>
      requiredLanguages.some(
        ({ code }) => (noteDraft[code] ?? '').trim() !== (initialNoteState[code] ?? '').trim(),
      ),
    [noteDraft, initialNoteState, requiredLanguages],
  );

  const hasDisplayOrderChange = useMemo(
    () => displayOrderDraft !== initialDisplayOrder,
    [displayOrderDraft, initialDisplayOrder],
  );

  const hasTagsChange = useMemo(() => {
    const current = tagsDraft.map((tag) => tag.trim()).filter(Boolean);
    const original = initialTags.map((tag) => tag.trim()).filter(Boolean);
    if (current.length !== original.length) {
      return true;
    }
    return current.some((tag, index) => tag !== original[index]);
  }, [tagsDraft, initialTags]);

  const hasLogoChange = useMemo(() => editMode && Boolean(logoFileDraft), [editMode, logoFileDraft]);

  const hasDetailsChanges =
    hasNameChanges ||
    hasDescriptionChanges ||
    hasNoteChanges ||
    hasDisplayOrderChange ||
    hasTagsChange ||
    hasLogoChange;

  const hasChanges = (hasDetailsChanges || hasAttributeAssignmentChanges) && !saving;

  const handleNameDraftChange = useCallback((code: string, value: string) => {
    setNameDraft((prev) => ({ ...prev, [code]: value }));
    setDetailsErrors((prev) => {
      if (!prev[`name.${code}`]) {
        return prev;
      }
      const next = { ...prev };
      delete next[`name.${code}`];
      return next;
    });
  }, []);

  const handleDescriptionDraftChange = useCallback((code: string, value: string) => {
    setDescriptionDraft((prev) => ({ ...prev, [code]: value }));
    setDetailsErrors((prev) => {
      if (!prev[`description.${code}`]) {
        return prev;
      }
      const next = { ...prev };
      delete next[`description.${code}`];
      return next;
    });
  }, []);

  const handleNoteDraftChange = useCallback((code: string, value: string) => {
    setNoteDraft((prev) => ({ ...prev, [code]: value }));
    setDetailsErrors((prev) => {
      if (!prev[`note.${code}`]) {
        return prev;
      }
      const next = { ...prev };
      delete next[`note.${code}`];
      return next;
    });
  }, []);

  const handleDisplayOrderChange = useCallback((value: number) => {
    setDisplayOrderDraft(value);
    setDetailsErrors((prev) => {
      if (!prev.displayOrder) {
        return prev;
      }
      const next = { ...prev };
      delete next.displayOrder;
      return next;
    });
  }, []);

  const handleTagsRawChange = useCallback((value: string) => {
    setTagsRaw(value);
    setTagsDraft(parseTags(value));
    setDetailsErrors((prev) => {
      if (!prev.tags) {
        return prev;
      }
      const next = { ...prev };
      delete next.tags;
      return next;
    });
  }, []);

  const handleEnterEdit = useCallback(() => {
    setEditMode(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditMode(false);
    setLogoFileDraft(null);
    const currentIds = Array.isArray(group?.attributeIds) ? [...group.attributeIds] : [];
    setSelectedAttributeIds(currentIds);
    setAvailableAttributesError(null);
  }, [group]);

  const handleCloseCommentDialog = useCallback(() => {
    if (saving) return;
    setCommentDialogOpen(false);
  }, [saving]);

  const getPrimaryValue = useCallback(
    (state: LocalizationState, fallback = '') => {
      const primaryCode = requiredLanguages[0]?.code;
      if (!primaryCode) return fallback;
      return state[primaryCode] ?? fallback;
    },
    [requiredLanguages],
  );

  const allAttributesMap = useMemo(() => {
    const map = new Map<string, Attribute>();
    [...attributes, ...availableAttributes].forEach((attr) => {
      if (attr?.id) {
        map.set(attr.id, attr);
      }
    });
    return map;
  }, [attributes, availableAttributes]);

  const formatAttributeNames = useCallback(
    (ids: string[]) => {
      if (!ids || ids.length === 0) {
        return t('attributeGroups.no_attributes') ?? 'Bağlı attribute yok';
      }
      const names = ids.map((id) => {
        const attr = allAttributesMap.get(id);
        return attr?.name || attr?.key || id;
      });
      const filtered = names.filter(Boolean);
      if (filtered.length === 0) {
        return t('attributeGroups.no_attributes') ?? 'Bağlı attribute yok';
      }
      return filtered.join(', ');
    },
    [allAttributesMap, t],
  );

  const buildPendingChanges = useCallback(() => {
    if (!group) return [];
    const changes: {
      field: string;
      oldValue: string | number | boolean;
      newValue: string | number | boolean;
    }[] = [];

    if (hasAttributeAssignmentChanges) {
      const currentAttrNames = formatAttributeNames(selectedAttributeIds);
      const previousAttrNames = formatAttributeNames(group.attributeIds ?? []);

      changes.push({
        field: t('attributeGroups.fields.attributes') ?? 'Attributes',
        oldValue: previousAttrNames,
        newValue: currentAttrNames,
      });
    }
    if (hasDisplayOrderChange) {
      changes.push({
        field: t('attributeGroups.fields.display_order') ?? 'Display Order',
        oldValue: initialDisplayOrder,
        newValue: displayOrderDraft,
      });
    }
    if (hasTagsChange) {
      changes.push({
        field: t('attributeGroups.fields.tags') ?? 'Tags',
        oldValue: initialTags.join(', '),
        newValue: tagsDraft.join(', '),
      });
    }
    if (hasNameChanges) {
      changes.push({
        field: t('attributeGroups.fields.name') ?? 'Name',
        oldValue: getPrimaryValue(initialNameState, group.name ?? ''),
        newValue: getPrimaryValue(nameDraft, group.name ?? ''),
      });
    }
    if (hasDescriptionChanges) {
      changes.push({
        field: t('attributeGroups.fields.description') ?? 'Description',
        oldValue: getPrimaryValue(initialDescriptionState, group.description ?? ''),
        newValue: getPrimaryValue(descriptionDraft, group.description ?? ''),
      });
    }
    if (hasNoteChanges) {
      changes.push({
        field: t('attributeGroups.fields.note') ?? 'Note',
        oldValue: getPrimaryValue(initialNoteState, group.note ?? ''),
        newValue: getPrimaryValue(noteDraft, group.note ?? ''),
      });
    }
    if (hasLogoChange) {
      changes.push({
        field: t('attributeGroups.fields.logo') ?? 'Logo',
        oldValue: group.logoUrl ? (t('common.yes') ?? 'Var') : (t('common.no') ?? 'Yok'),
        newValue: 'Logo güncellendi',
      });
    }

    return changes;
  }, [
    group,
    hasAttributeAssignmentChanges,
    hasDescriptionChanges,
    hasDisplayOrderChange,
    hasNameChanges,
    hasNoteChanges,
    hasTagsChange,
    hasLogoChange,
    initialDisplayOrder,
    displayOrderDraft,
    initialTags,
    tagsDraft,
    initialNameState,
    nameDraft,
    getPrimaryValue,
    initialDescriptionState,
    descriptionDraft,
    initialNoteState,
    noteDraft,
    t,
    selectedAttributeIds,
    formatAttributeNames,
  ]);

  const handleSave = useCallback(() => {
    if (!group || saving) {
      return;
    }

    const errors: FormErrors = {};
    requiredLanguages.forEach(({ code, label }) => {
      if (!nameDraft[code]?.trim()) {
        errors[`name.${code}`] =
          t('attributeGroups.validation.name_required', { language: label }) ||
          `${label} ${t('attributeGroups.name') || 'Ad'} zorunludur.`;
      }
    });

    if (displayOrderDraft < 0) {
      errors.displayOrder =
        t('attributeGroups.validation.order_non_negative') ||
        'Gösterim sırası 0 veya daha büyük olmalıdır.';
    }

    if (Object.keys(errors).length > 0) {
      setDetailsErrors(errors);
      showToast({
        type: 'error',
        message:
          t('attributeGroups.validation_fix_errors') ||
          'Kaydetmeden önce lütfen form hatalarını düzeltin.',
      });
      return;
    }

    const changes = buildPendingChanges();
    if (changes.length === 0) {
      setEditMode(false);
      return;
    }

    setPendingChanges(changes);
    setCommentDialogOpen(true);
  }, [
    group,
    saving,
    requiredLanguages,
    nameDraft,
    displayOrderDraft,
    t,
    setDetailsErrors,
    showToast,
    buildPendingChanges,
  ]);

  const handleConfirmSave = useCallback(
    async (comment: string) => {
      if (!group || saving) {
        return;
      }

      setSaving(true);

      try {
        let nameLocalizationId = group.localization?.nameLocalizationId ?? null;
        let descriptionLocalizationId = group.localization?.descriptionLocalizationId ?? null;
        let noteLocalizationId = group.localization?.noteLocalizationId ?? null;

        const localizationPromises: Promise<unknown>[] = [];

        if (!nameLocalizationId || hasNameChanges) {
          const translations = buildTranslationPayload(nameDraft);
          if (nameLocalizationId) {
            localizationPromises.push(
              localizationsService.update(nameLocalizationId, { translations }),
            );
          } else {
            const createdLocalization = await localizationsService.create({
              namespace: 'attribute_groups',
              key: `${group.key}.name`,
              description: null,
              translations,
            });
            nameLocalizationId = createdLocalization.id;
          }
        }

        const descriptionTranslations = buildTranslationPayload(descriptionDraft);
        const noteTranslations = buildTranslationPayload(noteDraft);
        const descriptionHasContent = Object.keys(descriptionTranslations).length > 0;
        const noteHasContent = Object.keys(noteTranslations).length > 0;

        if (descriptionLocalizationId && !descriptionHasContent && hasDescriptionChanges) {
          descriptionLocalizationId = null;
        } else if (descriptionHasContent && (hasDescriptionChanges || !descriptionLocalizationId)) {
          if (descriptionLocalizationId) {
            localizationPromises.push(
              localizationsService.update(descriptionLocalizationId, {
                translations: descriptionTranslations,
              }),
            );
          } else {
            const createdLocalization = await localizationsService.create({
              namespace: 'attribute_groups',
              key: `${group.key}.description`,
              description: null,
              translations: descriptionTranslations,
            });
            descriptionLocalizationId = createdLocalization.id;
          }
        }

        if (noteLocalizationId && !noteHasContent && hasNoteChanges) {
          noteLocalizationId = null;
        } else if (noteHasContent && (hasNoteChanges || !noteLocalizationId)) {
          if (noteLocalizationId) {
            localizationPromises.push(
              localizationsService.update(noteLocalizationId, { translations: noteTranslations }),
            );
          } else {
            const createdLocalization = await localizationsService.create({
              namespace: 'attribute_groups',
              key: `${group.key}.note`,
              description: null,
              translations: noteTranslations,
            });
            noteLocalizationId = createdLocalization.id;
          }
        }

        if (localizationPromises.length > 0) {
          await Promise.all(localizationPromises);
        }

        const updatePayload: Record<string, unknown> = {};

        if (hasAttributeAssignmentChanges) {
          updatePayload.attributeIds = selectedAttributeIds;
        }
        if (hasDisplayOrderChange) {
          updatePayload.displayOrder = displayOrderDraft;
        }
        if (hasTagsChange) {
          updatePayload.tags = tagsDraft;
        }
        if (descriptionLocalizationId !== group.localization?.descriptionLocalizationId) {
          updatePayload.descriptionLocalizationId = descriptionLocalizationId ?? undefined;
        }
        if (noteLocalizationId !== group.localization?.noteLocalizationId) {
          updatePayload.noteLocalizationId = noteLocalizationId ?? undefined;
        }
        if (nameLocalizationId !== group.localization?.nameLocalizationId) {
          updatePayload.nameLocalizationId = nameLocalizationId ?? undefined;
        }
        const trimmedComment = comment.trim();
        const hasNonLogoChanges =
          hasNameChanges ||
          hasDescriptionChanges ||
          hasNoteChanges ||
          hasAttributeAssignmentChanges ||
          hasDisplayOrderChange ||
          hasTagsChange;

        const shouldUpdateGroup =
          Object.keys(updatePayload).length > 0 || (hasNonLogoChanges && trimmedComment.length > 0);

        if (shouldUpdateGroup && trimmedComment.length > 0) {
          updatePayload.comment = trimmedComment;
        }

        let updatedGroup: AttributeGroup;
        if (shouldUpdateGroup) {
          updatedGroup = await attributeGroupsService.update(group.id, updatePayload);
        } else {
          updatedGroup = await attributeGroupsService.getById(group.id);
        }

        let refreshedGroup = updatedGroup;
        if (logoFileDraft && canEditLogo) {
          try {
            await logosService.upload('attribute-groups', updatedGroup.id, logoFileDraft, trimmedComment);
            refreshedGroup = await attributeGroupsService.getById(updatedGroup.id);
          } catch (error) {
            console.error('Attribute group logo upload failed', error);
            showToast({
              type: 'warning',
              message:
                t('attribute_groups.create.logo_upload_failed') ??
                'Logo yüklenemedi, lütfen daha sonra tekrar deneyin.',
            });
          } finally {
            setLogoFileDraft(null);
          }
        } else {
          setLogoFileDraft(null);
        }

        setGroup(refreshedGroup);
        setGroupDraft(refreshedGroup);
        setAttributes(Array.isArray(refreshedGroup.attributes) ? refreshedGroup.attributes : []);
        setSelectedAttributeIds(
          Array.isArray(refreshedGroup.attributeIds) ? refreshedGroup.attributeIds : [],
        );

        const refreshedOrder = refreshedGroup.order ?? 0;
        setDisplayOrderDraft(refreshedOrder);
        setInitialDisplayOrder(refreshedOrder);

        const refreshedTags = refreshedGroup.tags ?? [];
        setTagsDraft(refreshedTags);
        setInitialTags(refreshedTags);
        setTagsRaw(refreshedTags.join(', '));

        await loadLocalizationDetails(refreshedGroup, true);

        setEditMode(false);
        setAvailableAttributesError(null);
        setCommentDialogOpen(false);
        setPendingChanges([]);

        showToast({
          type: 'success',
          message:
            t('attributeGroups.updated_successfully') ?? 'Attribute grubu başarıyla güncellendi.',
        });
      } catch (err: any) {
        console.error('Failed to update attribute group', err);
        const message =
          err?.response?.data?.error?.message ??
          err?.message ??
          (t('attributeGroups.failed_to_update') ?? 'Attribute grubu güncellenemedi.');
        showToast({
          type: 'error',
          message,
        });
      } finally {
        setSaving(false);
      }
    },
    [
      group,
      saving,
      logoFileDraft,
      canEditLogo,
      hasNameChanges,
      hasDescriptionChanges,
      hasNoteChanges,
      hasAttributeAssignmentChanges,
      hasDisplayOrderChange,
      hasTagsChange,
      selectedAttributeIds,
      displayOrderDraft,
      tagsDraft,
      buildTranslationPayload,
      nameDraft,
      descriptionDraft,
      noteDraft,
      loadLocalizationDetails,
      showToast,
      t,
    ],
  );


  const handleDelete = useCallback(async () => {
    if (!group || deleting) {
      return;
    }
    try {
      setDeleting(true);
      await attributeGroupsService.delete(group.id);
      showToast({
        type: 'success',
        message:
          t('attributeGroups.delete_success') || 'Attribute grubu başarıyla silindi.',
      });
      navigate('/attribute-groups');
    } catch (err: any) {
      console.error('Failed to delete attribute group', err);
      const message =
        err?.response?.data?.error?.message ??
        err?.message ??
        t('attributeGroups.delete_failed') ??
        'Attribute grubu silinemedi.';
      showToast({ type: 'error', message });
    } finally {
      setDeleting(false);
    }
  }, [group, deleting, showToast, t, navigate]);

  const statisticsData: StatisticsType | null = useMemo(() => {
    if (!group) {
      return null;
    }
    const total = attributes.length;
    const requiredCount = attributes.filter((attribute) => attribute.required).length;
    const optionalCount = total - requiredCount;

    return {
      totalCount: total,
      activeCount: requiredCount,
      inactiveCount: optionalCount,
      createdThisMonth: 0,
      updatedThisMonth: 0,
      usageCount: total,
      lastUsed: group.updatedAt,
      trends: [
        { period: 'Jan', value: total, change: 0 },
        { period: 'Feb', value: total, change: 0 },
      ],
      topUsers: [
        {
          userId: group.updatedBy && typeof group.updatedBy !== 'string' ? group.updatedBy.id ?? 'user' : 'user',
          userName:
            (group.updatedBy && typeof group.updatedBy !== 'string'
              ? group.updatedBy.name ?? group.updatedBy.email
              : 'System') ?? 'System',
          count: total,
        },
      ],
    };
  }, [attributes, group]);

  const documentationSections: DocumentationSection[] = useMemo(() => {
    if (!group) {
      return [];
    }

    const attributesList =
      attributes.length > 0
        ? attributes.map((attribute) => `- **${attribute.name}** (\`${attribute.type}\`)`).join('\n')
        : 'Henüz attribute eklenmemiş.';

    return [
      {
        id: 'overview',
        title: 'Genel Bakış',
        content: `# ${group.name}

**Anahtar:** \`${group.key}\`

**Attribute Say2ısı:** ${group.attributeIds?.length ?? 0}

**Açıklama:** ${group.description ?? '—'}

## Attribute Listesi
${attributesList}
`,
        order: 0,
        type: 'markdown',
        lastUpdated: group.updatedAt,
        author:
          typeof group.updatedBy === 'string'
            ? group.updatedBy
            : group.updatedBy?.name ?? group.updatedBy?.email ?? 'System',
      },
      {
        id: 'structure',
        title: 'Kullanım Notları',
        content: `# Kullanım Notları

- Attribute grupları item type, kategori veya family seviyesinde bağlanabilir.
- Bu grupta ${attributes.filter((attribute) => attribute.required).length} adet zorunlu attribute bulunuyor.
- Eğer attribute eklemek isterseniz, attribute detay sayfasından bu gruba bağlayabilirsiniz.
`,
        order: 1,
        type: 'markdown',
        lastUpdated: group.updatedAt,
        author:
          typeof group.createdBy === 'string'
            ? group.createdBy
            : group.createdBy?.name ?? group.createdBy?.email ?? 'System',
      },
    ];
  }, [attributes, group]);

  const apiEndpoints: APIEndpoint[] = useMemo(() => {
    if (!group) {
      return [];
    }

    return [
      {
        id: 'list-groups',
        method: 'GET',
        path: '/api/attribute-groups',
        description: 'Attribute gruplarını listeler.',
        responseExample: {
          items: [{ id: group.id, key: group.key, name: group.name }],
          total: 1,
        },
        requiresAuth: true,
        permissions: ['attributeGroups.attributeGroup.list'],
      },
      {
        id: 'get-group',
        method: 'GET',
        path: `/api/attribute-groups/${group.id}`,
        description: 'Attribute grubuna ait detayları döner.',
        responseExample: {
          id: group.id,
          key: group.key,
          name: group.name,
          attributeIds: group.attributeIds ?? [],
        },
        requiresAuth: true,
        permissions: ['attributeGroups.attributeGroup.view'],
      },
      {
        id: 'update-group',
        method: 'PUT',
        path: `/api/attribute-groups/${group.id}`,
        description: 'Attribute grubu günceller.',
        requestBody: {
          nameLocalizationId: group.localization?.nameLocalizationId,
          attributeIds: group.attributeIds ?? [],
          comment: 'Güncelleme notu',
        },
        responseExample: {
          id: group.id,
          updatedAt: new Date().toISOString(),
        },
        requiresAuth: true,
        permissions: ['attributeGroups.attributeGroup.update'],
      },
    ];
  }, [group]);

  const groupName = group?.name?.trim() || group?.key || group?.id || '';
  const attachedAttributes = group?.attributes ?? [];
  const hasLinkedAttributes =
    (group?.attributeIds?.length ?? attachedAttributes.length ?? 0) > 0;
  const linkedAttributeNames =
    attachedAttributes.length > 0
      ? attachedAttributes
          .map((attribute) => attribute.name || attribute.key || attribute.id)
          .filter(Boolean)
      : group?.attributeIds ?? [];
  const canDeleteGroupSafely = canDeleteGroup;
  const deleteBlockedMessage = hasLinkedAttributes
    ? t('attributeGroups.delete_blocked_with_attributes', {
        attributes: linkedAttributeNames.join(', '),
      }) ||
      `Bu attribute grubu aşağıdaki attribute'lara bağlı olduğu için silinemez: ${linkedAttributeNames.join(', ')}`
    : null;

  if (!id) {
    return null;
  }

  if (loading) {
    return (
      <div className="px-6 py-12">
        <p className="text-sm text-muted-foreground">{t('common.loading') || 'Yükleniyor...'}</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="px-6 py-12">
        <Card>
          <div className="px-6 py-10 text-sm text-error">
            {error ??
              t('attributeGroups.failed_to_load') ??
              'Attribute grubu yüklenemedi. Lütfen daha sonra tekrar deneyin.'}
          </div>
        </Card>
      </div>
    );
  }

  const tabs: TabConfig[] = [
    {
      id: 'details',
      label: t('attributeGroups.details_tab') || 'Detaylar',
      icon: FileText,
      component: AttributeGroupDetailsTab,
      props: {
        group: groupDraft ?? group,
        editMode,
        requiredLanguages,
        nameDraft,
        descriptionDraft,
        noteDraft,
        onNameChange: handleNameDraftChange,
        onDescriptionChange: handleDescriptionDraftChange,
        onNoteChange: handleNoteDraftChange,
        displayOrderDraft,
        onDisplayOrderChange: handleDisplayOrderChange,
        tagsRaw,
        onTagsRawChange: handleTagsRawChange,
        formErrors: detailsErrors,
        localizationsLoading,
        localizationsError,
      },
    },
    {
      id: 'attributes',
      label: t('attributeGroups.attributes_tab') || 'Attribute\'lar',
      icon: TagsIcon,
      component: AttributeGroupAttributesTab,
      props: {
        attributes,
        isLoading: loading,
        editMode,
        availableAttributes,
        selectedAttributeIds,
        onSelectionChange: setSelectedAttributeIds,
        selectionLoading: availableAttributesLoading,
        selectionError: availableAttributesError,
        onRetryLoad: () => loadAvailableAttributes(true),
      },
      badge: attributes.length || group.attributeIds?.length || 0,
      hidden: !canViewAttributesTab,
    },
    {
      id: 'statistics',
      label: t('attributeGroups.statistics_tab') || 'İstatistikler',
      icon: BarChart3,
      component: Statistics,
      props: {
        entityType: 'attribute-group',
        entityId: group.id,
        statistics: statisticsData ?? undefined,
      },
      hidden: !canViewStatistics,
    },
    {
      id: 'documentation',
      label: t('attributeGroups.documentation_tab') || 'Dokümantasyon',
      icon: BookOpen,
      component: Documentation,
      props: {
        entityType: 'attribute-group',
        entityId: group.id,
        sections: documentationSections,
        editMode,
      },
      hidden: !canViewDocumentation,
    },
    {
      id: 'api',
      label: t('attributeGroups.api_tab') || 'API',
      icon: Globe,
      component: APITester,
      props: {
        entityType: 'attribute-group',
        entityId: group.id,
        endpoints: apiEndpoints,
        editMode,
      },
      hidden: !canViewApi,
    },
    {
      id: 'notifications',
      label: t('attributeGroups.notifications_tab') || 'Bildirimler',
      icon: Activity,
      component: EntityNotificationsTab,
      props: {
        entityType: 'attribute-group',
        entityId: group.id,
        entityName: group.name,
      },
      hidden: !canViewNotifications,
    },
    {
      id: 'history',
      label: t('attributeGroups.history_tab') || 'Geçmiş',
      icon: HistoryIcon,
      component: HistoryTable,
      props: { entityType: 'AttributeGroup', entityId: group.id },
      hidden: !canViewHistory,
    },
  ];

  const headerLogoUrl = editMode && logoPreviewUrl ? logoPreviewUrl : group.logoUrl ?? null;

  return (
    <>
      <DetailsLayout
        title={
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-bold text-foreground">{group.name}</span>
              <Badge variant="secondary">
                {group.attributeIds?.length ?? 0}{' '}
                {t('attributeGroups.attribute_unit') || 'attribute'}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span>
                <Clock className="inline h-3 w-3 mr-1" />
                {new Date(group.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        }
        subtitle={group.description ?? undefined}
        icon={
          <div
            className={`w-full h-full relative flex items-center justify-center overflow-hidden rounded-xl ${
              editMode && canEditLogo ? 'cursor-pointer' : ''
            }`}
            onClick={() => {
              if (!editMode || !canEditLogo) {
                return;
              }
              headerLogoInputRef.current?.click();
            }}
          >
            {headerLogoUrl ? (
              <>
                <div className="absolute inset-0 bg-card" aria-hidden="true" />
                <div className="absolute inset-0 flex items-center justify-center p-1">
                  <img
                    src={headerLogoUrl}
                    alt={group.name}
                    className="w-full h-full object-contain rounded-lg relative z-10"
                    loading="lazy"
                  />
                </div>
              </>
            ) : (
              <TagsIcon className="h-6 w-6 text-white" />
            )}
            {editMode && canEditLogo ? (
              <>
                <div className="absolute inset-0 bg-black/25 opacity-0 hover:opacity-100 transition flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-white">
                    {t('attribute_groups.create.logo_change') || 'Logo Seç'}
                  </span>
                </div>
                <input
                  ref={headerLogoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setLogoFileDraft(file);
                    e.target.value = '';
                  }}
                />
              </>
            ) : null}
          </div>
        }
        tabs={tabs}
        defaultTab="details"
        backUrl="/attribute-groups"
        editMode={editMode}
        hasChanges={hasChanges}
        iconContainerClassName={
          headerLogoUrl ? 'bg-transparent shadow-sm border border-border' : undefined
        }
        onEdit={canUpdateGroup ? handleEnterEdit : undefined}
        onSave={canUpdateGroup ? handleSave : undefined}
        onCancel={canUpdateGroup ? handleCancelEdit : undefined}
        inlineActions={false}
        onDelete={canDeleteGroupSafely ? handleDelete : undefined}
        deleteLoading={deleting}
        deleteButtonLabel={t('attributeGroups.delete_action') || 'Attribute Grubu Sil'}
        deleteDialogTitle={
          t('attributeGroups.delete_title', { name: groupName }) || 'Attribute grubu silinsin mi?'
        }
        deleteDialogDescription={
          hasLinkedAttributes && deleteBlockedMessage
            ? deleteBlockedMessage
            : t('attributeGroups.delete_description', { name: groupName }) ||
              'Bu attribute grubu kalıcı olarak silinecek. Bu işlem geri alınamaz.'
        }
        canDelete={canDeleteGroupSafely}
      />

      <ChangeConfirmDialog
        open={commentDialogOpen}
        onClose={handleCloseCommentDialog}
        onConfirm={handleConfirmSave}
        changes={pendingChanges}
        loading={saving}
        entityName={group.name}
        title={t('attributeGroups.review_changes_title') || 'Değişiklikleri Onayla'}
      />
    </>
  );
};

export default AttributeGroupsDetails;
