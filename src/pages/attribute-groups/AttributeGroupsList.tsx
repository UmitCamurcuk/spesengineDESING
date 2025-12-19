import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layers, Hash, ListOrdered } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AttributeGroup, UserReference } from '../../types';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { PERMISSIONS } from '../../config/permissions';
import { UserInfoWithRole } from '../../components/common/UserInfoWithRole';

type UserInfoPayload = {
  id: string;
  email: string;
  name: string;
  profilePhotoUrl?: string;
  role?: UserReference['role'] | string;
};

const toUserInfo = (
  user: AttributeGroup['updatedBy'] | AttributeGroup['createdBy'],
): UserInfoPayload | undefined => {
  if (!user) {
    return undefined;
  }

  if (typeof user === 'string') {
    return {
      id: user,
      email: user,
      name: user,
    };
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    profilePhotoUrl: user.profilePhotoUrl,
    role: user.role,
  };
};

export const AttributeGroupsList: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { t } = useLanguage();
  const canCreateGroup = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTE_GROUPS.CREATE);

  const [items, setItems] = useState<AttributeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await attributeGroupsService.list();
        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        console.error('Attribute groups failed to load', err);
        if (!cancelled) {
          setError('Attribute grupları yüklenemedi. Lütfen tekrar deneyin.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchGroups();

    return () => {
      cancelled = true;
    };
  }, []);

  const columns = useMemo(
    () => [
      {
        key: 'name',
        title: t('attributeGroups.name_label') || 'Grup Adı',
        sortable: true,
        render: (_: string, group: AttributeGroup) => (
          <div className="flex items-center gap-3">
            <div
              className={
                group.logoUrl
                  ? 'w-10 h-10 rounded-xl bg-card shadow-sm overflow-hidden flex-shrink-0'
                  : 'w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0'
              }
            >
              {group.logoUrl ? (
                <img
                  src={group.logoUrl}
                  alt={group.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <Layers className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="space-y-1">
              <span className="text-sm font-semibold text-foreground">{group.name}</span>
              {group.description ? (
                <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
              ) : null}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Hash className="h-3 w-3" />
                <code>{group.key ?? group.id}</code>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'attributeCount',
        title: t('attributeGroups.attribute_count'),
        render: (_: number, group: AttributeGroup) => (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <ListOrdered className="h-4 w-4 text-primary" />
            <span>{group.attributeCount ?? group.attributeIds?.length ?? 0}</span>
          </div>
        ),
      },
      {
        key: 'tags',
        title: t('attributeGroups.tags_label') || 'Etiketler',
        render: (_: string[], group: AttributeGroup) =>
          group.tags && group.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {group.tags.map((tag) => (
                <Badge key={tag} size="sm" variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        key: 'updatedAt',
        title: t('attributeGroups.updated_at') || 'Güncellendi',
        sortable: true,
        render: (_: unknown, group: AttributeGroup) => (
          <UserInfoWithRole user={toUserInfo(group.updatedBy)} date={group.updatedAt} />
        ),
      },
    ],
    [t],
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={t('attributeGroups.title') || 'Attribute Grupları'}
        subtitle={t('attributeGroups.subtitle') || 'Öğe verisi için kullanılan attribute grupları'}
        actions={
          canCreateGroup
            ? [
                <Button key="create" onClick={() => navigate('/attribute-groups/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('attributeGroups.create')}
                </Button>,
              ]
            : undefined
        }
      />

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex-1 mt-6">
        <DataTable<AttributeGroup>
          data={items}
          columns={columns}
          loading={loading}
          onRowClick={(group) => navigate(`/attribute-groups/${group.id}`)}
          searchPlaceholder={t('attributeGroups.search_placeholder') || 'Attribute grubu ara...'}
          emptyState={{
            icon: <Layers className="h-12 w-12" />,
            title: t('attributeGroups.empty_title') ,
            description:
              t('attributeGroups.empty_description') ,
            action: canCreateGroup ? (
              <Button onClick={() => navigate('/attribute-groups/create')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('attributeGroups.create')}
              </Button>
            ) : undefined,
          }}
        />
      </div>
    </div>
  );
};

export default AttributeGroupsList;
