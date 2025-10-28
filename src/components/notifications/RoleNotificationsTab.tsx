import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle, XCircle, AlertCircle, Loader2, ExternalLink, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { notificationsService } from '../../api/services/notifications.service';

interface RoleNotificationsTabProps {
  roleId: string;
  roleName: string;
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
  filters?: Record<string, any>;
}

export const RoleNotificationsTab: React.FC<RoleNotificationsTabProps> = ({
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
  }, [roleId]);

  const loadRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const rules = await notificationsService.listRules();
      
      // Filter rules that apply to this role
      const roleRules = rules.filter((rule: any) => {
        // If rule has roleId filter matching this role
        if (rule.filters?.roleId === roleId) {
          return true;
        }
        
        // If rule has no filters, it applies to all users (including this role)
        if (!rule.filters || Object.keys(rule.filters).length === 0) {
          return true;
        }
        
        return false;
      });

      setRules(roleRules);
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

  const getRoleSpecificRules = () => {
    return rules.filter(rule => rule.filters?.roleId === roleId);
  };

  const getGeneralRules = () => {
    return rules.filter(rule => !rule.filters || Object.keys(rule.filters).length === 0);
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

  const roleSpecificRules = getRoleSpecificRules();
  const generalRules = getGeneralRules();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {t('notifications.role.title') || 'Rol Bildirimleri'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('notifications.role.subtitle') || 'Bu role sahip kullanıcılar için bildirim kuralları'}
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

      {/* Role Info Card */}
      <Card>
        <CardHeader
          title={t('notifications.role.info') || 'Rol Bilgileri'}
          subtitle={t('notifications.role.info_desc') || 'Bu role özel bildirim ayarları'}
        />
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('common.roleName') || 'Rol Adı'}:
            </span>
            <span className="text-sm font-medium">{roleName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('notifications.role.specific_rules') || 'Role Özel Kurallar'}:
            </span>
            <Badge variant="primary">{roleSpecificRules.length}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('notifications.role.general_rules') || 'Genel Kurallar'}:
            </span>
            <Badge variant="secondary">{generalRules.length}</Badge>
          </div>
        </div>
      </Card>

      {/* Role-Specific Rules */}
      {roleSpecificRules.length > 0 && (
        <Card>
          <CardHeader
            title={t('notifications.role.specific_rules') || 'Role Özel Kurallar'}
            subtitle={t('notifications.role.specific_rules_desc') || 'Sadece bu role sahip kullanıcılar için'}
          />
          <div className="p-6 space-y-3">
            {roleSpecificRules.map((rule) => (
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
                      <Badge variant="primary" size="sm">
                        <Users className="h-3 w-3 mr-1" />
                        {t('notifications.role.role_specific') || 'Role Özel'}
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
        </Card>
      )}

      {/* General Rules */}
      {generalRules.length > 0 && (
        <Card>
          <CardHeader
            title={t('notifications.role.general_rules') || 'Genel Kurallar'}
            subtitle={t('notifications.role.general_rules_desc') || 'Tüm kullanıcılar için geçerli'}
          />
          <div className="p-6 space-y-3">
            {generalRules.map((rule) => (
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
        </Card>
      )}

      {/* No Rules */}
      {rules.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {t('notifications.role.no_rules') || 'Bu rol için henüz bildirim kuralı yok'}
            </p>
            <Button
              onClick={() => navigate('/notifications/rules/create')}
              variant="outline"
            >
              {t('notifications.rules.create') || 'Kural Oluştur'}
            </Button>
          </div>
        </Card>
      )}

      {/* Info Box */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {t('notifications.role.info_title') || 'Bilgilendirme'}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('notifications.role.info_text') || 'Bu sayfada bu role sahip tüm kullanıcılar için geçerli bildirim kuralları listelenir'}
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
            variant="primary"
            size="sm"
            onClick={() => navigate('/notifications/rules/create')}
          >
            {t('notifications.rules.create') || 'Yeni Kural'}
          </Button>
        </div>
      </div>
    </div>
  );
};

