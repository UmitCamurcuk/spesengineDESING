import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, Radio } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { notificationsService, type NotificationChannel } from '../../api/services/notifications.service';
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

export const NotificationChannelsList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const canView = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.CHANNELS.VIEW);

  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const data = await notificationsService.listChannels();
      setChannels(data);
    } catch (error: any) {
      console.error('Failed to load notification channels:', error);
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
    void loadChannels();

    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    {
      key: 'name',
      title: t('notifications.channels.columns.name') ?? 'Channel Name',
      sortable: true,
      render: (_value: string, channel: NotificationChannel) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{channel.name}</div>
            <div className="flex items-center text-xs text-gray-500">
              <Radio className="h-3 w-3 mr-1" />
              {channel.type}
            </div>
          </div>
        </div>
      ),
      mobileRender: (channel: NotificationChannel) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="text-sm font-semibold text-foreground">{channel.name}</div>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Radio className="h-3 w-3 mr-1" />
                {channel.type}
              </div>
            </div>
            <Badge variant={channel.isEnabled ? 'success' : 'default'} size="sm">
              {channel.isEnabled ? t('common.active') : t('common.inactive')}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {t('notifications.channels.columns.type')}
              </div>
              <Badge variant="secondary" size="sm">
                {channel.type}
              </Badge>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {t('notifications.channels.columns.updated_at')}
              </div>
              <div className="text-sm text-gray-600">{formatDate(channel.updatedAt)}</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      title: t('notifications.channels.columns.type') ?? 'Type',
      sortable: true,
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'isEnabled',
      title: t('notifications.channels.columns.status') ?? 'Status',
      sortable: true,
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'default'} size="sm">
          {value ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    {
      key: 'updatedAt',
      title: t('notifications.channels.columns.updated_at') ?? 'Updated',
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
        title={t('notifications.channels.title') ?? 'Notification Channels'}
        subtitle={t('notifications.channels.subtitle') ?? 'Configure notification delivery channels'}
      />

      <div className="flex-1 mt-6">
        <DataTable
          data={channels}
          columns={columns}
          loading={loading}
          onRowClick={canView ? (channel) => navigate(`/notifications/channels/${channel.id}`) : undefined}
          emptyState={{
            icon: <Bell className="h-12 w-12" />,
            title: t('notifications.channels.empty_title') ?? 'No notification channels',
            description:
              t('notifications.channels.empty_description') ??
              'Channels will appear here once created',
          }}
        />
      </div>
    </div>
  );
};
