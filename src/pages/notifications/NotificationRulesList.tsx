import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Activity } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { notificationsService, type NotificationRule } from '../../api/services/notifications.service';
import { PERMISSIONS } from '../../config/permissions';
import { UserInfoWithRole } from '../../components/common/UserInfoWithRole';

export const NotificationRulesList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const canView = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.VIEW);

  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await notificationsService.listRules();
      setRules(data);
    } catch (error: any) {
      console.error('Failed to load notification rules:', error);
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
    void loadRules();

    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    {
      key: 'name',
      title: t('notifications.rules.columns.name') ?? 'Rule Name',
      sortable: true,
      render: (_value: string, rule: NotificationRule) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-sm">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{rule.name}</div>
            <div className="flex items-center text-xs text-gray-500">
              <Activity className="h-3 w-3 mr-1" />
              {rule.eventKey}
            </div>
          </div>
        </div>
      ),
      mobileRender: (rule: NotificationRule) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-sm">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="text-sm font-semibold text-foreground">{rule.name}</div>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Activity className="h-3 w-3 mr-1" />
                {rule.eventKey}
              </div>
            </div>
            <Badge variant={rule.isActive ? 'success' : 'default'} size="sm">
              {rule.isActive ? t('common.active') : t('common.inactive')}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Recipients</div>
              <Badge variant="secondary" size="sm">
                {rule.recipients?.length || 0} recipients
              </Badge>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {t('notifications.rules.columns.updated_at')}
              </div>
              <UserInfoWithRole user={rule.updatedBy} date={rule.updatedAt} />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'eventKey',
      title: 'Event Key',
      sortable: true,
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      title: t('notifications.rules.columns.status') ?? 'Status',
      sortable: true,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'default'} size="sm">
          {value ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    {
      key: 'recipients',
      title: 'Recipients',
      render: (recipients: any[]) => (
        <span className="text-sm text-gray-600">{recipients?.length || 0} recipients</span>
      ),
    },
    {
      key: 'updatedAt',
      title: t('notifications.rules.columns.updated_at') ?? 'Updated',
      sortable: true,
      render: (_value: string | null | undefined, rule: NotificationRule) => (
        <UserInfoWithRole user={rule.updatedBy} date={rule.updatedAt} />
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('notifications.rules.title') ?? 'Notification Rules'}
        subtitle={t('notifications.rules.subtitle') ?? 'Manage event-based notification rules'}
      />

      <div className="flex-1 mt-6">
        <DataTable
          data={rules}
          columns={columns}
          loading={loading}
          onRowClick={canView ? (rule) => navigate(`/notifications/rules/${rule.id}`) : undefined}
          emptyState={{
            icon: <Zap className="h-12 w-12" />,
            title: t('notifications.rules.empty_title') ?? 'No notification rules',
            description: t('notifications.rules.empty_description') ?? 'Rules will appear here once created',
          }}
        />
      </div>
    </div>
  );
};
