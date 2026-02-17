import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Play, Copy, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import type { Report, ReportExecution, ReportFilter } from '../../types';
import { reportsService } from '../../api/services/reports.service';
import { ReportBuilder } from './components/ReportBuilder';
import { ReportResultsView } from './components/ReportResultsView';
import { ReportExecutionHistory } from './components/ReportExecutionHistory';
import type { ReportUpdatePayload } from '../../api/services/reports.service';

type Tab = 'results' | 'definition' | 'history';

export const ReportsDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('results');
  const [execution, setExecution] = useState<ReportExecution | null>(null);
  const [executing, setExecuting] = useState(false);

  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await reportsService.getById(id);
        if (!cancelled) setReport(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.error?.message ?? 'Rapor yüklenemedi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchReport();
    return () => { cancelled = true; };
  }, [id]);

  const handleExecute = async (runtimeFilters?: ReportFilter[]) => {
    if (!id) return;
    setExecuting(true);
    try {
      const result = await reportsService.execute(id, runtimeFilters);
      setExecution(result);
      setActiveTab('results');
    } catch (err: any) {
      console.error('Rapor çalıştırılamadı', err);
    } finally {
      setExecuting(false);
    }
  };

  const handleFavorite = async () => {
    if (!id) return;
    try {
      const updated = await reportsService.toggleFavorite(id);
      setReport(updated);
    } catch (err) {
      console.error('Favori güncellenemedi', err);
    }
  };

  const handleClone = async () => {
    if (!id) return;
    try {
      const cloned = await reportsService.clone(id);
      navigate(`/reports/${cloned.id}`);
    } catch (err) {
      console.error('Rapor kopyalanamadı', err);
    }
  };

  const handleSave = async (payload: ReportUpdatePayload) => {
    if (!id) return;
    try {
      const updated = await reportsService.update(id, payload);
      setReport(updated);
      setActiveTab('results');
    } catch (err) {
      console.error('Rapor güncellenemedi', err);
    }
  };

  const tabs = [
    { key: 'results' as Tab, label: tr('reports.tab.results', 'Sonuçlar') },
    { key: 'definition' as Tab, label: tr('reports.tab.definition', 'Tanım') },
    { key: 'history' as Tab, label: tr('reports.tab.history', 'Geçmiş') },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-md bg-destructive/10 text-destructive">{error ?? 'Rapor bulunamadı.'}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={report.name}
        description={report.description ?? report.primaryItemTypeName}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Geri
            </Button>
            <button
              className={`p-2 rounded-md border transition-colors ${report.isFavorite ? 'text-yellow-500 border-yellow-400' : 'text-muted-foreground border-border'}`}
              onClick={handleFavorite}
            >
              <Star className="h-4 w-4" fill={report.isFavorite ? 'currentColor' : 'none'} />
            </button>
            <Button variant="outline" size="sm" onClick={handleClone}>
              <Copy className="h-4 w-4 mr-1" />
              {tr('reports.clone', 'Kopyala')}
            </Button>
            <Button
              size="sm"
              disabled={executing}
              onClick={() => handleExecute()}
            >
              <Play className="h-4 w-4 mr-1" />
              {executing ? tr('reports.running', 'Çalışıyor...') : tr('reports.run', 'Çalıştır')}
            </Button>
          </div>
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

      {/* Tab content */}
      {activeTab === 'results' && (
        <ReportResultsView
          report={report}
          execution={execution}
          executing={executing}
          onExecute={handleExecute}
        />
      )}

      {activeTab === 'definition' && (
        <ReportBuilder mode="edit" report={report} onSave={handleSave} />
      )}

      {activeTab === 'history' && id && (
        <ReportExecutionHistory reportId={id} onView={(exec) => { setExecution(exec); setActiveTab('results'); }} />
      )}
    </div>
  );
};
