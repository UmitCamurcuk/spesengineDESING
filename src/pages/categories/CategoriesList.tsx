import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderTree, Plus } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import type { Category } from '../../types';
import { categoriesService } from '../../api/services/categories.service';
import { UserInfoWithRole } from '../../components/common/UserInfoWithRole';

export const CategoriesList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const canCreateCategory = hasPermission(PERMISSIONS.CATALOG.CATEGORIES.CREATE);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const toUserInfo = useCallback((user: Category['updatedBy'] | Category['createdBy']) => {
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
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const { items } = await categoriesService.list({ limit: 200 });
        if (!cancelled) {
          setCategories(items);
        }
      } catch (err: any) {
        console.error('Failed to load categories', err);
        if (!cancelled) {
          setError(
            err?.response?.data?.error?.message ??
              t('categories.failed_to_load') ??
              'Kategori listesi yüklenemedi.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleRowClick = useCallback(
    (category: Category) => {
      navigate(`/categories/${category.id}`);
    },
    [navigate],
  );

  const columns = useMemo(
    () => [
      {
        key: 'name',
        title: t('categories.columns.name') || 'Name',
        sortable: true,
        render: (_: string, category: Category) => (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-sm">
              <FolderTree className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{category.name}</div>
              <div className="text-xs text-muted-foreground">ID: {category.id}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'key',
        title: t('categories.columns.key') || 'Key',
        render: (_: string, category: Category) => (
          <code className="text-xs bg-muted px-2 py-1 rounded">{category.key}</code>
        ),
      },
      {
        key: 'parentCategoryId',
        title: t('categories.columns.parent') || 'Parent',
        render: (_: string | null | undefined, category: Category) =>
          category.parentCategoryId ? (
            <Badge variant="outline" size="sm">
              {category.parentCategoryId}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">
              {t('categories.root_label') || 'Root Category'}
            </span>
          ),
      },
      {
        key: 'defaultItemTypeId',
        title: t('categories.columns.default_item_type') || 'Default Item Type',
        render: (_: string | null | undefined, category: Category) =>
          category.defaultItemTypeId ? (
            <Badge variant="secondary" size="sm">
              {category.defaultItemTypeId}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        key: 'attributeGroupCount',
        title: t('categories.columns.attribute_groups') || 'Attribute Groups',
        render: (_: number | undefined, category: Category) => (
          <Badge variant="outline" size="sm">
            {category.attributeGroupCount ?? category.attributeGroupIds?.length ?? 0}
          </Badge>
        ),
      },
      {
        key: 'updatedAt',
        title: t('categories.columns.updated_at') || 'Updated',
        sortable: true,
        render: (_: string, category: Category) => (
          <UserInfoWithRole user={toUserInfo(category.updatedBy)} date={category.updatedAt} />
        ),
      },
    ],
    [t, toUserInfo],
  );

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('categories.title') || 'Categories'}
        description={
          t('categories.subtitle') || 'Kategori hiyerarşisini yönetin ve attribute gruplarını atayın'
        }
        actions={
          canCreateCategory ? (
            <Button onClick={() => navigate('/categories/create')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('categories.create') || 'Create Category'}
            </Button>
          ) : undefined
        }
      />

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 mt-6">
        <DataTable<Category>
          data={categories}
          columns={columns}
          loading={loading}
          searchPlaceholder={t('categories.search_placeholder') || 'Search categories...'}
          onRowClick={handleRowClick}
          emptyState={{
            icon: <FolderTree className="h-12 w-12" />,
            title: t('categories.empty_state') || 'Henüz kategori oluşturulmadı.',
            description:
              t('categories.create_new') ||
              'İlk kategori kaydınızı oluşturarak öğe sınıflandırmanızı başlatın.',
            action: canCreateCategory ? (
              <Button onClick={() => navigate('/categories/create')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('categories.create') || 'Create Category'}
              </Button>
            ) : undefined,
          }}
        />
      </div>
    </div>
  );
};
