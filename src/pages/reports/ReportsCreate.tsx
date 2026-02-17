import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { ReportBuilder } from './components/ReportBuilder';
import type { ReportCreatePayload } from '../../api/services/reports.service';
import { reportsService } from '../../api/services/reports.service';

export const ReportsCreate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  const handleSave = async (payload: ReportCreatePayload) => {
    const created = await reportsService.create(payload);
    navigate(`/reports/${created.id}`);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={tr('reports.create_title', 'Yeni Rapor')}
        description="Rapor tanımını oluşturun"
        actions={
          <Button variant="outline" onClick={() => navigate('/reports')}>
            İptal
          </Button>
        }
      />
      <ReportBuilder mode="create" onSave={handleSave} />
    </div>
  );
};
