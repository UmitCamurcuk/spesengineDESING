import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Attribute, AttributeType, UserReference } from '../../types';
import { UserInfoWithRole } from '../../components/common/UserInfoWithRole';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { attributesService } from '../../api/services/attributes.service';
import { ATTRIBUTE_TYPE_META } from '../../components/ui/AttributeTypeCard';

const getAttributeTypeMeta = (type: AttributeType) =>
  ATTRIBUTE_TYPE_META[type] ?? {
    icon: Package,
    color: 'from-gray-500 to-gray-600',
    translation: 'unknown',
  };

export const AttributesList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canCreateAttribute = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTES.CREATE);

  type UserInfoPayload = {
    id: string;
    email: string;
    name: string;
    profilePhotoUrl?: string;
    role?: UserReference['role'] | string;
  };

  const toUserInfo = (user: Attribute['updatedBy'] | Attribute['createdBy']): UserInfoPayload | undefined => {
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

  useEffect(() => {
    let mounted = true;

    const fetchAttributes = async () => {
      try {
        setIsLoading(true);
        const data = await attributesService.list();
        if (!mounted) {
          return;
        }
        setItems(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load attributes', err);
        if (mounted) {
          setError('Attribute listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAttributes();
    return () => {
      mounted = false;
    };
  }, [t]);

  const columns = useMemo(
    () => [
      {
        key: 'name',
        title: t('attributes.name'),
        sortable: true,
        render: (value: string, attribute: Attribute) => {
          const meta = getAttributeTypeMeta(attribute.type);
          const IconComponent = meta.icon;
          const typeLabel = t(`attributes.types.${meta.translation}.name`);

          return (
            <div className="flex items-center space-x-3">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 bg-gradient-to-br ${meta.color} rounded-xl flex items-center justify-center shadow-sm`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-muted-foreground mt-1">{typeLabel}</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-foreground">{value}</span>
                  {attribute.required && (
                    <Badge variant="error" size="sm">
                      {t('attributes.required')}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">ID: {attribute.id}</div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'description',
        title: t('attributes.description'),
        render: (_: string, attribute: Attribute) => (
          <span className="text-sm text-muted-foreground line-clamp-2">
            {attribute.description ?? '—'}
          </span>
        ),
      },
      {
        key: 'key',
        title: t('attributes.attribute_key'),
        render: (_: string, attribute: Attribute) => (
          <code className="text-xs bg-muted px-2 py-1 rounded">{attribute.key || attribute.id}</code>
        ),
      },
      {
        key: 'updatedAt',
        title: t('attributes.updated_at'),
        sortable: true,
        render: (_: unknown, attribute: Attribute) => (
          <UserInfoWithRole user={toUserInfo(attribute.updatedBy)} date={attribute.updatedAt} />
        ),
      },
    ],
    [t],
  );

  const handleRowClick = (attribute: Attribute) => {
    navigate(`/attributes/${attribute.id}`);
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('attributes.title')}
        subtitle={t('attributes.subtitle')}
        actions={
          canCreateAttribute
            ? [
                <Button key="create" onClick={() => navigate('/attributes/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('attributes.create_title')}
                </Button>,
              ]
            : undefined
        }
      />

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 mt-6">
        <DataTable<Attribute>
          data={items}
          columns={columns}
          loading={isLoading}
          searchPlaceholder="Search attributes..."
          onRowClick={handleRowClick}
          emptyState={{
            icon: <Package className="h-12 w-12" />,
            title: t('attributes.no_attributes'),
            description: t('attributes.create_new_attribute'),
            action: canCreateAttribute ? (
              <Button onClick={() => navigate('/attributes/create')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('attributes.create_title')}
              </Button>
            ) : undefined,
          }}
        />
      </div>
    </div>
  );
};

export default AttributesList;
