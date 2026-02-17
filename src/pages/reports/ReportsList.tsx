import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Star, Play, Copy, Trash2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { Report } from '../../types';
import { reportsService } from '../../api/services/reports.service';

const VISUALIZATION_LABELS: Record<string, string> = {
  table: 'Tablo',
  bar: 'Çubuk',
  pie: 'Pasta',
  line: 'Çizgi',
  number: 'Sayı',
};

const VISIBILITY_LABELS: Record<string, string> = {
  private: 'Özel',
  roles: 'Roller',
  all: 'Herkese Açık',
};

const VISIBILITY_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  private: 'secondary',
  roles: 'outline',
  all: 'default',
};

export const ReportsList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'templates' | 'favorites'>('all');
  const [executing, setExecuting] = useState<string | null>(null);

  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await reportsService.list({
        search: search || undefined,
        isTemplate: activeTab === 'templates' ? true : undefined,
      });
      let items = result.items ?? [];
      if (activeTab === 'favorites') {
        items = items.filter((r) => r.isFavorite);
      }
      setReports(items);
    } catch (err: any) {
      console.error('Failed to load reports', err);
      setError(err?.response?.data?.error?.message ?? 'Raporlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await reportsService.list({
          search: search || undefined,
          isTemplate: activeTab === 'templates' ? true : undefined,
        });
        let items = result.items ?? [];
        if (activeTab === 'favorites') items = items.filter((r) => r.isFavorite);
        if (!cancelled) setReports(items);
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.error?.message ?? 'Raporlar yüklenemedi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [search, activeTab]);

  const handleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await reportsService.toggleFavorite(id);
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      console.error('Favori güncellenemedi', err);
    }
  };

  const handleExecute = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExecuting(id);
    try {
      await reportsService.execute(id);
      navigate(`/reports/${id}`);
    } catch (err) {
      console.error('Rapor çalıştırılamadı', err);
    } finally {
      setExecuting(null);
    }
  };

  const handleClone = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const cloned = await reportsService.clone(id);
      navigate(`/reports/${cloned.id}`);
    } catch (err) {
      console.error('Rapor kopyalanamadı', err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bu raporu silmek istediğinizden emin misiniz?')) return;
    try {
      await reportsService.delete(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Rapor silinemedi', err);
    }
  };

  const columns = [
    {
      key: 'name',
      title: tr('reports.name', 'Rapor Adı'),
      render: (_val: unknown, report: Report) => (
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div>
            <div className="font-medium text-foreground">{report.name}</div>
            {report.description && (
              <div className="text-xs text-muted-foreground truncate max-w-xs">{report.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'primaryItemTypeName',
      title: tr('reports.data_source', 'Veri Kaynağı'),
      render: (_val: unknown, report: Report) => (
        <span className="text-sm text-foreground">{report.primaryItemTypeName}</span>
      ),
    },
    {
      key: 'visualization',
      title: tr('reports.visualization', 'Görünüm'),
      render: (_val: unknown, report: Report) => (
        <Badge variant="secondary">{VISUALIZATION_LABELS[report.visualization] ?? report.visualization}</Badge>
      ),
    },
    {
      key: 'visibility',
      title: tr('reports.visibility', 'Görünürlük'),
      render: (_val: unknown, report: Report) => (
        <Badge variant={VISIBILITY_VARIANTS[report.visibility] ?? 'secondary'}>
          {VISIBILITY_LABELS[report.visibility] ?? report.visibility}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: '',
      render: (_val: unknown, report: Report) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            className={`p-1 rounded hover:bg-muted transition-colors ${report.isFavorite ? 'text-yellow-500' : 'text-muted-foreground'}`}
            title={tr('reports.favorite', 'Favori')}
            onClick={(e) => handleFavorite(report.id, e)}
          >
            <Star className="h-4 w-4" fill={report.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
            title={tr('reports.run', 'Çalıştır')}
            disabled={executing === report.id}
            onClick={(e) => handleExecute(report.id, e)}
          >
            <Play className="h-4 w-4" />
          </button>
          <button
            className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
            title={tr('reports.clone', 'Kopyala')}
            onClick={(e) => handleClone(report.id, e)}
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            className="p-1 rounded hover:bg-muted text-destructive transition-colors"
            title="Sil"
            onClick={(e) => handleDelete(report.id, e)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const tabs = [
    { key: 'all', label: tr('reports.tab.all', 'Tümü') },
    { key: 'templates', label: tr('reports.tab.templates', 'Şablonlar') },
    { key: 'favorites', label: tr('reports.tab.favorites', 'Favoriler') },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={tr('reports.list_title', 'Raporlar')}
        description="Dinamik raporlarınızı yönetin ve çalıştırın"
        actions={
          <Button onClick={() => navigate('/reports/create')}>
            {tr('reports.create_title', 'Yeni Rapor')}
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Rapor ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={reports}
        loading={loading}
        onRowClick={(report) => navigate(`/reports/${report.id}`)}
        emptyState={{ title: tr('reports.no_reports', 'Rapor bulunamadı') }}
      />
    </div>
  );
};
