import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderTree, Plus } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { Category } from '../../types';
import { categoriesService } from '../../api/services/categories.service';

export const CategoriesList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const canCreateCategory = hasPermission(PERMISSIONS.CATALOG.CATEGORIES.CREATE);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

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

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader
          title={t('categories.list_title') || 'Category Records'}
          subtitle={
            loading
              ? t('common.loading') || 'Loading...'
              : `${categories.length} ${t('categories.count_suffix') || 'records'}`
          }
        />
        {error ? (
          <div className="px-6 py-10 text-sm text-red-500">{error}</div>
        ) : loading ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">
            {t('common.loading') || 'Loading...'}
          </div>
        ) : categories.length === 0 ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">
            {t('categories.empty_state') || 'Henüz kategori oluşturulmadı.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('categories.columns.name') || 'Name'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('categories.columns.key') || 'Key'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('categories.columns.parent') || 'Parent'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('categories.columns.default_item_type') || 'Default Item Type'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('categories.columns.attribute_groups') || 'Attribute Groups'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('categories.columns.updated_at') || 'Updated'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/categories/${category.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-sm">
                          <FolderTree className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{category.name}</div>
                          <div className="text-xs text-muted-foreground">ID: {category.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                      {category.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {category.parentCategoryId ? (
                        <Badge variant="outline">{category.parentCategoryId}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          {t('categories.root_label') || 'Root Category'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {category.defaultItemTypeId ? (
                        <Badge variant="secondary">{category.defaultItemTypeId}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge variant="outline">{category.attributeGroupCount ?? 0}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(category.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
