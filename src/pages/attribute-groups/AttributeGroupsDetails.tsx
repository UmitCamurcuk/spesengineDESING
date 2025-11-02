import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { HistoryTable } from '../../components/common/HistoryTable';
import { NotificationSettings } from '../../components/common/NotificationSettings';
import { Documentation } from '../../components/common/Documentation';
import { Statistics } from '../../components/common/Statistics';
import { APITester } from '../../components/common/APITester';
import { AttributeGroup, Attribute } from '../../types';
import { TabConfig, DocumentationSection, APIEndpoint, Statistics as StatisticsType } from '../../types/common';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import { UserInfoWithRole } from '../../components/common/UserInfoWithRole';

interface AttributeGroupDetailsTabProps {
  group: AttributeGroup;
}

interface AttributeGroupAttributesTabProps {
  attributes: Attribute[];
  isLoading: boolean;
}

const AttributeGroupDetailsTab: React.FC<AttributeGroupDetailsTabProps> = ({ group }) => {
  const { t } = useLanguage();
  const attributeCount = group.attributeIds?.length ?? group.attributes.length ?? 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('attributeGroups.basic_information') || 'Temel Bilgiler'}
          subtitle={t('attributeGroups.basic_information_subtitle') || 'Attribute grubuna ait meta veriler'}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pb-6">
          <div className="space-y-2 text-sm">
            <span className="text-muted-foreground">{t('attributeGroups.key') || 'Anahtar'}</span>
            <p className="font-mono bg-muted px-2 py-1 rounded">{group.key ?? group.id}</p>
          </div>

          <div className="space-y-2 text-sm">
            <span className="text-muted-foreground">
              {t('attributeGroups.display_order') || 'Gösterim Sırası'}
            </span>
            <p>{group.order ?? 0}</p>
          </div>

          <div className="space-y-2 text-sm md:col-span-2">
            <span className="text-muted-foreground">{t('attributeGroups.description') || 'Açıklama'}</span>
            <p>{group.description || '—'}</p>
          </div>

          <div className="space-y-2 text-sm">
            <span className="text-muted-foreground">{t('attributeGroups.created_at') || 'Oluşturulma'}</span>
            <p>{new Date(group.createdAt).toLocaleString()}</p>
          </div>

          <div className="space-y-2 text-sm">
            <span className="text-muted-foreground">{t('attributeGroups.updated_at') || 'Güncellenme'}</span>
            <p>{new Date(group.updatedAt).toLocaleString()}</p>
          </div>

          <div className="space-y-2 text-sm">
            <span className="text-muted-foreground">{t('attributeGroups.created_by') || 'Oluşturan'}</span>
            <UserInfoWithRole user={group.createdBy} />
          </div>

          <div className="space-y-2 text-sm">
            <span className="text-muted-foreground">{t('attributeGroups.updated_by') || 'Güncelleyen'}</span>
            <UserInfoWithRole user={group.updatedBy} />
          </div>

          <div className="space-y-2 text-sm md:col-span-2">
            <span className="text-muted-foreground">
              {t('attributeGroups.tags_label') || 'Etiketler'}
            </span>
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

          <div className="space-y-2 text-sm md:col-span-2">
            <span className="text-muted-foreground">
              {t('attributeGroups.attribute_count') || 'Attribute Sayısı'}
            </span>
            <Badge variant="primary">{attributeCount}</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};

const AttributeGroupAttributesTab: React.FC<AttributeGroupAttributesTabProps> = ({
  attributes,
  isLoading,
}) => {
  const { t } = useLanguage();

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
              <span>{attribute.required ? 'Zorunlu' : 'Opsiyonel'}</span>
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
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<AttributeGroup | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);

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
        setAttributes(Array.isArray(data.attributes) ? data.attributes : []);
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
  }, [id, t]);

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

**Attribute Sayısı:** ${group.attributeIds?.length ?? 0}

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
      props: { group },
    },
    {
      id: 'attributes',
      label: t('attributeGroups.attributes_tab') || 'Attribute\'lar',
      icon: TagsIcon,
      component: AttributeGroupAttributesTab,
      props: { attributes, isLoading: loading },
      badge: attributes.length,
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
        editMode: false,
      },
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
        editMode: false,
      },
    },
    {
      id: 'history',
      label: t('attributeGroups.history_tab') || 'Geçmiş',
      icon: HistoryIcon,
      component: HistoryTable,
      props: { entityType: 'AttributeGroup', entityId: group.id },
    },
    {
      id: 'notifications',
      label: t('attributeGroups.notifications_tab') || 'Bildirimler',
      icon: Activity,
      component: NotificationSettings,
      props: { entityType: 'attribute-group', entityId: group.id },
    },
  ];

  return (
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
      icon={<TagsIcon className="h-6 w-6 text-white" />}
      tabs={tabs}
      defaultTab="details"
      backUrl="/attribute-groups"
      inlineActions={false}
    />
  );
};

export default AttributeGroupsDetails;
