import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, Languages } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { notificationsService, type NotificationTemplate } from '../../api/services/notifications.service';
import { PERMISSIONS } from '../../config/permissions';

const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
};

export const NotificationTemplatesList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const canView = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.TEMPLATES.VIEW);

  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await notificationsService.listTemplates();
      setTemplates(data);
    } catch (error: any) {
      console.error('Failed to load notification templates:', error);
      showToast({
        type: 'error',
        message: error?.message || t('common.error'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    void loadTemplates();

    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    {
      key: 'name',
      title: 'Template Name',
      sortable: true,
      render: (_value: string, template: NotificationTemplate) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{template.name}</div>
            <div className="flex items-center text-xs text-gray-500">
              <Languages className="h-3 w-3 mr-1" />
              {template.language}
            </div>
          </div>
        </div>
      ),
      mobileRender: (template: NotificationTemplate) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="text-sm font-semibold text-foreground">{template.name}</div>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Languages className="h-3 w-3 mr-1" />
                {template.language}
              </div>
            </div>
            <Badge variant={template.isDefault ? 'success' : 'secondary'} size="sm">
              {template.isDefault ? 'Default' : 'Custom'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Channel Type</div>
              <Badge variant="secondary" size="sm">
                {template.channelType}
              </Badge>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Updated</div>
              <div className="text-sm text-gray-600">{formatDate(template.updatedAt)}</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'channelType',
      title: 'Channel Type',
      sortable: true,
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'eventKey',
      title: 'Event Key',
      sortable: true,
      render: (value: string) => (
        <Badge variant="outline" size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'language',
      title: 'Language',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-600 uppercase">{value}</span>
      ),
    },
    {
      key: 'isDefault',
      title: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? 'Default' : 'Custom'}
        </Badge>
      ),
    },
    {
      key: 'updatedAt',
      title: 'Updated',
      sortable: true,
      render: (value: string | null | undefined) => (
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          {formatDate(value)}
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Notification Templates"
        subtitle="Manage notification message templates"
      />

      <div className="flex-1 mt-6">
        <DataTable
          data={templates}
          columns={columns}
          loading={loading}
          onRowClick={canView ? (template) => navigate(`/notifications/templates/${template.id}`) : undefined}
          emptyState={{
            icon: <FileText className="h-12 w-12" />,
            title: 'No notification templates',
            description: 'Templates will appear here once created',
          }}
        />
      </div>
    </div>
  );
};
