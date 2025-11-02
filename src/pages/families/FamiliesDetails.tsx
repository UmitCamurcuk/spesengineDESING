import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, Link as LinkIcon } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import type { Family } from '../../types';
import { familiesService } from '../../api/services/families.service';
import { Button } from '../../components/ui/Button';
import { localizationsService } from '../../api/services/localizations.service';
import { useRequiredLanguages } from '../../hooks/useRequiredLanguages';

type LocalizationState = Record<string, string>;

export const FamiliesDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const requiredLanguages = useRequiredLanguages();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [nameTranslations, setNameTranslations] = useState<LocalizationState>({});
  const [descriptionTranslations, setDescriptionTranslations] = useState<LocalizationState>({});

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
    setNameTranslations((prev) => buildLocalizationState(prev));
    setDescriptionTranslations((prev) => buildLocalizationState(prev));
  }, [buildLocalizationState]);

  const displayName = useMemo(
    () => getPrimaryValue(nameTranslations, family?.name ?? ''),
    [family, getPrimaryValue, nameTranslations],
  );

  const displayDescription = useMemo(
    () => getPrimaryValue(descriptionTranslations, family?.description ?? ''),
    [descriptionTranslations, family, getPrimaryValue],
  );

  useEffect(() => {
    if (!id) {
      return;
    }
    let cancelled = false;

    const fetchFamily = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await familiesService.getById(id);
        const [nameLocalization, descriptionLocalization] = await Promise.all([
          data.nameLocalizationId
            ? localizationsService
                .getById(data.nameLocalizationId)
                .catch((err) => {
                  console.error('Failed to load family name localization', err);
                  return null;
                })
            : Promise.resolve(null),
          data.descriptionLocalizationId
            ? localizationsService
                .getById(data.descriptionLocalizationId)
                .catch((err) => {
                  console.error('Failed to load family description localization', err);
                  return null;
                })
            : Promise.resolve(null),
        ]);

        if (!cancelled) {
          setFamily(data);
          setNameTranslations(
            buildLocalizationState(nameLocalization?.translations ?? null, data.name),
          );
          setDescriptionTranslations(
            buildLocalizationState(
              descriptionLocalization?.translations ?? null,
              data.description ?? '',
            ),
          );
        }
      } catch (err: any) {
        console.error('Failed to load family', err);
        if (!cancelled) {
          setError(
            err?.response?.data?.error?.message ??
              t('families.failed_to_load') ??
              'Family bilgisi yüklenemedi.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchFamily();

    return () => {
      cancelled = true;
    };
  }, [buildLocalizationState, id, t]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={displayName || t('families.details_title') || 'Family Details'}
        description={
          displayDescription ||
          t('families.details_subtitle') ||
          'Family hiyerarşisi ve bağlı attribute grupları'
        }
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back') || 'Back'}
          </Button>
        }
      />

      {error ? (
        <Card>
          <div className="px-6 py-10 text-sm text-red-500">{error}</div>
        </Card>
      ) : loading || !family ? (
        <Card>
          <div className="px-6 py-10 text-sm text-muted-foreground">
            {t('common.loading') || 'Loading...'}
          </div>
        </Card>
      ) : (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader
              title={t('families.basic_information') || 'Basic Information'}
              subtitle={displayDescription || undefined}
            />
            <div className="px-6 pb-6 space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('families.fields.key') || 'Key'}</span>
                <p className="font-mono text-sm text-foreground mt-1">{family.key}</p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t('families.fields.name') || 'Name'}
                </span>
                <div className="mt-1 space-y-1">
                  {requiredLanguages.map(({ code, label }) => (
                    <div key={`family-name-${code}`}>
                      <span className="text-muted-foreground">{label}:</span>{' '}
                      {nameTranslations[code]?.trim() || '—'}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t('families.fields.description') || 'Description'}
                </span>
                <div className="mt-1 space-y-1">
                  {requiredLanguages.map(({ code, label }) => (
                    <div key={`family-description-${code}`}>
                      <span className="text-muted-foreground">{label}:</span>{' '}
                      {descriptionTranslations[code]?.trim() || '—'}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">
                    {t('families.fields.parent') || 'Parent Family'}
                  </span>
                  <p className="mt-1">
                    {family.parentFamilyId ? (
                      <Badge variant="outline">{family.parentFamilyId}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        {t('families.root_label') || 'Root Family'}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t('families.fields.category') || 'Category'}
                  </span>
                  <p className="mt-1">
                    {family.categoryId ? (
                      <Badge variant="secondary">{family.categoryId}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        {t('families.no_category') || 'Not Assigned'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t('families.fields.hierarchy_path') || 'Hierarchy Path'}
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {family.hierarchyPath.length > 0 ? (
                    family.hierarchyPath.map((nodeId) => (
                      <Badge key={nodeId} variant="outline">
                        {nodeId}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      {t('families.root_label') || 'Root Family'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title={t('families.attribute_groups') || 'Attribute Groups'}
              subtitle={t('families.attribute_group_subtitle') || 'Bağlı attribute grupları'}
            />
            <div className="px-6 pb-6 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t('families.attribute_group_count') || 'Total'}
                </span>
                <Badge variant="outline">{family.attributeGroupCount ?? 0}</Badge>
              </div>
              {family.attributeGroupBindings.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t('families.no_attribute_groups') || 'Bu family için attribute group atanmadı.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {family.attributeGroupBindings.map((binding) => (
                    <div
                      key={binding.id}
                      className="flex items-center justify-between border border-border rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <LinkIcon className="h-4 w-4 text-primary" />
                        <span>{binding.attributeGroupId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {binding.inherited ? (
                          <Badge variant="secondary" size="sm">
                            {t('families.inherited') || 'Inherited'}
                          </Badge>
                        ) : null}
                        {binding.required ? (
                          <Badge variant="outline" size="sm">
                            {t('families.required') || 'Required'}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader title={t('families.metadata') || 'Metadata'} />
          <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t('families.created_at') || 'Created'}</span>
              <p className="mt-1">{new Date(family.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t('families.updated_at') || 'Updated'}</span>
              <p className="mt-1">{new Date(family.updatedAt).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t('families.created_by') || 'Created By'}</span>
              <p className="mt-1 text-sm">
                {typeof family.createdBy === 'string'
                  ? family.createdBy
                  : family.createdBy?.name ?? family.createdBy?.email ?? '-'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">{t('families.updated_by') || 'Updated By'}</span>
              <p className="mt-1 text-sm">
                {typeof family.updatedBy === 'string'
                  ? family.updatedBy
                  : family.updatedBy?.name ?? family.updatedBy?.email ?? '-'}
              </p>
            </div>
          </div>
        </Card>
        </>
      )}
    </div>
  );
};
