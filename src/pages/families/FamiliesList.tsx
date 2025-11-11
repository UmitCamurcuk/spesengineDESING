import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layers } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import type { Category, Family } from '../../types';
import { familiesService } from '../../api/services/families.service';
import { categoriesService } from '../../api/services/categories.service';
import { UserInfoWithRole } from '../../components/common/UserInfoWithRole';

export const FamiliesList: React.FC = () => {
  const navigate = useNavigate();
  const { t, resolveLocalization } = useLanguage();
  const { hasPermission } = useAuth();
  const canCreateFamily = hasPermission(PERMISSIONS.CATALOG.FAMILIES.CREATE);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const toUserInfo = useCallback((user: Family['updatedBy'] | Family['createdBy']) => {
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

    const fetchFamilies = async () => {
      try {
        setLoading(true);
        setError(null);
        const { items } = await familiesService.list({ limit: 200 });
        if (!cancelled) {
          setFamilies(items);
        }
      } catch (err: any) {
        console.error('Failed to load families', err);
        if (!cancelled) {
          setError(
            err?.response?.data?.error?.message ??
              t('families.failed_to_load') ??
              'Family listesi yüklenemedi.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const fetchCategories = async () => {
      try {
        const { items } = await categoriesService.list({ limit: 200 });
        if (!cancelled) {
          setCategories(items);
        }
      } catch (err) {
        console.error('Failed to load categories for families list', err);
      }
    };

    fetchFamilies();
    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleRowClick = useCallback(
    (family: Family) => {
      navigate(`/families/${family.id}`);
    },
    [navigate],
  );

  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => {
      const label =
        (category.nameLocalizationId ? resolveLocalization(category.nameLocalizationId) : null) ||
        category.name ||
        category.key ||
        category.id;
      map.set(category.id, label);
    });
    return map;
  }, [categories, resolveLocalization]);

  const columns = useMemo(
    () => [
      {
        key: 'name',
        title: t('families.columns.name') || 'Name',
        sortable: true,
        render: (_: string, family: Family) => {
          const label =
            (family.nameLocalizationId ? resolveLocalization(family.nameLocalizationId) : null) ||
            family.name ||
            family.key ||
            family.id;
          return (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground">ID: {family.id}</div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'key',
        title: t('families.columns.key') || 'Key',
        render: (_: string, family: Family) => (
          <code className="text-xs bg-muted px-2 py-1 rounded">{family.key}</code>
        ),
      },
      {
        key: 'categoryId',
        title: t('families.columns.category') || 'Category',
        render: (_: string | null | undefined, family: Family) => {
          if (!family.categoryId) {
            return (
              <span className="text-xs text-muted-foreground">
                {t('families.root_label') || 'Root'}
              </span>
            );
          }
          const categoryLabel = categoryNameMap.get(family.categoryId) ?? family.categoryId;
          return (
            <Badge variant="secondary" size="sm">
              {categoryLabel}
            </Badge>
          );
        },
      },
      {
        key: 'attributeGroupCount',
        title: t('families.columns.attribute_groups') || 'Attribute Groups',
        render: (_: number | undefined, family: Family) => (
          <Badge variant="outline" size="sm">
            {family.attributeGroupCount ?? family.attributeGroupIds?.length ?? 0}
          </Badge>
        ),
      },
      {
        key: 'updatedAt',
        title: t('families.columns.updated_at') || 'Updated',
        sortable: true,
        render: (_: string, family: Family) => (
          <UserInfoWithRole user={toUserInfo(family.updatedBy)} date={family.updatedAt} />
        ),
      },
    ],
    [categoryNameMap, resolveLocalization, t, toUserInfo],
  );

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('families.title') || 'Families'}
        description={t('families.subtitle') || 'Manage product families and their hierarchy'}
        actions={
          canCreateFamily ? (
            <Button onClick={() => navigate('/families/create')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('families.create') || 'Create Family'}
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
        <DataTable<Family>
          data={families}
          columns={columns}
          loading={loading}
          searchPlaceholder={t('families.search_placeholder') || 'Search families...'}
          onRowClick={handleRowClick}
          emptyState={{
            icon: <Layers className="h-12 w-12" />,
            title: t('families.empty_state') || 'Henüz family oluşturulmadı.',
            description:
              t('families.create_new') ||
              'İlk family kaydınızı oluşturarak öğe hiyerarşinizi başlatın.',
            action: canCreateFamily ? (
              <Button onClick={() => navigate('/families/create')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('families.create') || 'Create Family'}
              </Button>
            ) : undefined,
          }}
        />
      </div>
    </div>
  );
};
