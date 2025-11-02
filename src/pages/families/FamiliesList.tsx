import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layers } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import type { Family } from '../../types';
import { familiesService } from '../../api/services/families.service';

export const FamiliesList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const canCreateFamily = hasPermission(PERMISSIONS.CATALOG.FAMILIES.CREATE);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchFamilies = async () => {
      try {
        setLoading(true);
        setError(null);
        const { items } = await familiesService.list();
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

    fetchFamilies();

    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader
          title={t('families.list_title') || 'Family Records'}
          subtitle={
            loading
              ? t('common.loading') || 'Loading...'
              : `${families.length} ${t('families.count_suffix') || 'records'}`
          }
        />
        {error ? (
          <div className="px-6 py-10 text-sm text-red-500">{error}</div>
        ) : loading ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">
            {t('common.loading') || 'Loading...'}
          </div>
        ) : families.length === 0 ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">
            {t('families.empty_state') ||
              'Henüz family oluşturulmadı. Yeni bir kayıt ekleyerek başlayın.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('families.columns.name') || 'Name'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('families.columns.key') || 'Key'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('families.columns.category') || 'Category'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('families.columns.attribute_groups') || 'Attribute Groups'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('families.columns.updated_at') || 'Updated'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {families.map((family) => (
                  <tr
                    key={family.id}
                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/families/${family.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
                          <Layers className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{family.name}</div>
                          <div className="text-xs text-muted-foreground">ID: {family.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                      {family.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {family.categoryId ? (
                        <Badge variant="secondary">{family.categoryId}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          {t('families.root_category') || 'Unassigned'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge variant="outline">{family.attributeGroupCount ?? 0}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(family.updatedAt).toLocaleString()}
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
