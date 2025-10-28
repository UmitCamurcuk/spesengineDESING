import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle, XCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { notificationsService } from '../../api/services/notifications.service';

interface UserNotificationsTabProps {
  userId: string;
  userEmail: string;
  roleId: string | null;
  roleName: string | null;
}

interface NotificationRule {
  id: string;
  name: string;
  eventKey: string;
  isActive: boolean;
  channels: Array<{
    channelType: string;
    enabled: boolean;
  }>;
}

export const UserNotificationsTab: React.FC<UserNotificationsTabProps> = ({
  userId,
  userEmail,
  roleId,
  roleName,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRules();
  }, [userId, roleId]);

  const loadRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const rules = await notificationsService.listRules();
      
      // Filter rules that apply to this user (based on roleId or user-specific)
      const applicableRules = rules.filter((rule: any) => {
        // If rule has no specific filters, it applies to everyone
        if (!rule.filters || Object.keys(rule.filters).length === 0) {
          return true;
        }
        
        // Check if rule filters match this user's roleId
        if (rule.filters.roleId === roleId) {
          return true;
        }
        
        return false;
      });

      setRules(applicableRules);
    } catch (err) {
      console.error('Failed to load notification rules:', err);
      setError('Failed to load notification rules');
    } finally {
      setLoading(false);
    }
  };

  const getEventLabel = (eventKey: string): string => {
    const eventLabels: Record<string, string> = {
      'user.login': t('notifications.events.user.login') || 'User Login',
      'user.created': t('notifications.events.user.created') || 'User Created',
      'user.updated': t('notifications.events.user.updated') || 'User Updated',
      'user.deleted': t('notifications.events.user.deleted') || 'User Deleted',
      'user.role.changed': t('notifications.events.user.role.changed') || 'Role Changed',
      'auth.login.failed': t('notifications.events.auth.login.failed') || 'Failed Login',
      'item.created': t('notifications.events.item.created') || 'Item Created',
      'item.updated': t('notifications.events.item.updated') || 'Item Updated',
      'item.deleted': t('notifications.events.item.deleted') || 'Item Deleted',
    };
    return eventLabels[eventKey] || eventKey;
  };

  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'slack':
        return '💬';
      case 'email':
        return '📧';
      case 'webhook':
        return '🔗';
      default:
        return '📢';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={loadRules} variant="outline" className="mt-4">
            {t('common.retry') || 'Retry'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {t('notifications.user.title') || 'Kullanıcı Bildirimleri'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('notifications.user.subtitle') || 'Bu kullanıcı için geçerli bildirim kuralları'}
          </p>
        </div>
        <Button
          onClick={() => navigate('/notifications/rules')}
          variant="outline"
          size="sm"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          {t('notifications.rules.manage') || 'Kuralları Yönet'}
        </Button>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader
          title={t('notifications.user.info') || 'Kullanıcı Bilgileri'}
          subtitle={t('notifications.user.info_desc') || 'Bildirimler bu kullanıcıya göre filtrelenir'}
        />
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('common.email') || 'E-posta'}:
            </span>
            <span className="text-sm font-medium">{userEmail}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('common.role') || 'Rol'}:
            </span>
            <Badge variant="secondary">{roleName || t('common.noRole') || 'No Role'}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('notifications.user.applicable_rules') || 'Geçerli Kurallar'}:
            </span>
            <Badge variant="primary">{rules.length}</Badge>
          </div>
        </div>
      </Card>

      {/* Notification Rules */}
      <Card>
        <CardHeader
          title={t('notifications.rules.title') || 'Bildirim Kuralları'}
          subtitle={t('notifications.rules.subtitle') || 'Bu kullanıcı için aktif bildirim kuralları'}
        />
        <div className="p-6">
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {t('notifications.user.no_rules') || 'Bu kullanıcı için henüz bildirim kuralı yok'}
              </p>
              <Button
                onClick={() => navigate('/notifications/rules/create')}
                variant="outline"
              >
                {t('notifications.rules.create') || 'Kural Oluştur'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`p-2 rounded-lg ${rule.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {rule.isActive ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-foreground">{rule.name}</h4>
                        <Badge variant={rule.isActive ? 'success' : 'secondary'} size="sm">
                          {rule.isActive
                            ? (t('common.active') || 'Aktif')
                            : (t('common.inactive') || 'İnaktif')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('common.event') || 'Olay'}: {getEventLabel(rule.eventKey)}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        {rule.channels.map((channel, idx) => (
                          <Badge
                            key={idx}
                            variant={channel.enabled ? 'outline' : 'secondary'}
                            size="sm"
                          >
                            <span className="mr-1">{getChannelIcon(channel.channelType)}</span>
                            {channel.channelType}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/notifications/rules/${rule.id}`)}
                  >
                    {t('common.view') || 'Görüntüle'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {t('notifications.user.quick_actions') || 'Hızlı İşlemler'}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('notifications.user.quick_actions_desc') || 'Bildirim ayarlarını yönetin'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/notifications/templates')}
          >
            {t('notifications.templates.view') || 'Taslakları Gör'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/notifications/channels')}
          >
            {t('notifications.channels.view') || 'Kanalları Gör'}
          </Button>
        </div>
      </div>
    </div>
  );
};

