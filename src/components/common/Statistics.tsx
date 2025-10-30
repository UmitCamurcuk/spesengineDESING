import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  TrendingDown,
  TrendingUp,
  Users,
  XOctagon,
  Edit2,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import {
  notificationsService,
  type NotificationRuleStatistics,
} from '../../api/services/notifications.service';
import { Statistics as StatisticsType } from '../../types/common';
import { historyService } from '../../api/services/history.service';

interface StatisticsProps {
  entityType: string;
  entityId: string;
  editMode?: boolean;
}

// Mock statistics data
const mockStatistics: StatisticsType = {
  totalCount: 1247,
  activeCount: 1089,
  inactiveCount: 158,
  createdThisMonth: 23,
  updatedThisMonth: 156,
  usageCount: 8934,
  lastUsed: '2024-01-25T10:30:00Z',
  trends: [
    { period: 'Jan', value: 120, change: 12 },
    { period: 'Feb', value: 135, change: 15 },
    { period: 'Mar', value: 128, change: -7 },
    { period: 'Apr', value: 142, change: 14 },
    { period: 'May', value: 156, change: 14 },
    { period: 'Jun', value: 149, change: -7 },
  ],
  topUsers: [
    { userId: '1', userName: 'John Doe', count: 234 },
    { userId: '2', userName: 'Jane Smith', count: 189 },
    { userId: '3', userName: 'Mike Johnson', count: 156 },
    { userId: '4', userName: 'Sarah Wilson', count: 134 },
    { userId: '5', userName: 'Tom Brown', count: 98 },
  ]
};

export const Statistics: React.FC<StatisticsProps> = ({
  entityType,
  entityId,
  editMode = false
}) => {
  const isNotificationRule = entityType === 'notification-rule';
  const isUser = entityType === 'user';
  const { t } = useLanguage();
  const { formatDateTime } = useDateFormatter();
  const [loading, setLoading] = useState<boolean>(isNotificationRule || isUser);
  const [error, setError] = useState<string | null>(null);
  const [ruleStats, setRuleStats] = useState<NotificationRuleStatistics | null>(null);
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    if (!isNotificationRule && !isUser) {
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    
    if (isNotificationRule) {
      const fetchStats = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await notificationsService.getRuleStatistics(entityId);
          if (!cancelled) {
            setRuleStats(response);
          }
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'İstatistikler alınırken bir hata oluştu.');
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };
      fetchStats();
    }

    if (isUser) {
      const fetchUserStats = async () => {
        try {
          setLoading(true);
          setError(null);
          // Fetch user history to calculate statistics
          const history = await historyService.getHistory({
            entityType: 'User',
            entityId,
            page: 1,
            pageSize: 1000, // Get all history records
          });

          // Calculate statistics from history
          const stats = {
            totalActivities: history.items.length,
            createdCount: history.items.filter(h => h.action === 'created').length,
            updatedCount: history.items.filter(h => h.action === 'updated').length,
            deletedCount: history.items.filter(h => h.action === 'deleted').length,
            viewedCount: history.items.filter(h => h.action === 'viewed').length,
            lastActivity: history.items[0]?.timestamp || null,
            createdThisMonth: history.items.filter(h => {
              if (h.action !== 'created') return false;
              const createdDate = new Date(h.timestamp);
              const now = new Date();
              return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
            }).length,
            updatedThisMonth: history.items.filter(h => {
              if (h.action !== 'updated') return false;
              const updatedDate = new Date(h.timestamp);
              const now = new Date();
              return updatedDate.getMonth() === now.getMonth() && updatedDate.getFullYear() === now.getFullYear();
            }).length,
          };

          if (!cancelled) {
            setUserStats(stats);
          }
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'İstatistikler alınırken bir hata oluştu.');
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };
      fetchUserStats();
    }

    return () => {
      cancelled = true;
    };
  }, [entityId, isNotificationRule, isUser]);

  const formatDuration = (ms?: number | null) => {
    if (!ms || ms <= 0) {
      return '—';
    }
    if (ms < 1000) {
      return `${ms} ms`;
    }
    const seconds = ms / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(1)} s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} dk ${remainingSeconds.toFixed(0)} sn`;
  };

  const overviewCards = useMemo(() => {
    if (!ruleStats) {
      return null;
    }

    return [
      {
        title: 'Toplam Tetikleme',
        value: ruleStats.totalEvents.toLocaleString(),
        helper: `${ruleStats.successCount.toLocaleString()} başarılı`,
        icon: <Activity className="h-6 w-6" />,
        tone: 'bg-primary/10 text-primary',
      },
      {
        title: 'Başarı Oranı',
        value: `${ruleStats.successRate.toFixed(1)}%`,
        helper: `${ruleStats.partialCount.toLocaleString()} kısmi`,
        icon: <TrendingUp className="h-6 w-6" />,
        tone: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
      },
      {
        title: 'Ortalama Süre',
        value: formatDuration(ruleStats.averageDurationMs),
        helper: `En iyi ${formatDuration(ruleStats.minDurationMs)} • En kötü ${formatDuration(ruleStats.maxDurationMs)}`,
        icon: <Clock className="h-6 w-6" />,
        tone: 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300',
      },
      {
        title: 'Son Gönderim',
        value: ruleStats.lastCompletedAt ? formatDateTime(ruleStats.lastCompletedAt) : '—',
        helper: ruleStats.lastFailedAt ? `Son hata ${formatDateTime(ruleStats.lastFailedAt)}` : 'Hata kaydı yok',
        icon: <CheckCircle2 className="h-6 w-6" />,
        tone: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300',
      },
    ];
  }, [ruleStats, formatDateTime]);

  const notificationContent = () => {
    if (loading) {
      return (
        <Card padding="lg">
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t('common.loading') ?? 'Yükleniyor'}</span>
          </div>
        </Card>
      );
    }

    if (error) {
      return (
        <Card padding="lg">
          <div className="flex items-center gap-3 text-rose-500 dark:text-rose-400">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">İstatistikler yüklenemedi</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </Card>
      );
    }

    if (!ruleStats || ruleStats.totalEvents === 0) {
      return (
        <Card padding="lg">
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-base font-medium text-foreground">Henüz istatistik yok</p>
              <p className="text-sm text-muted-foreground">
                Bu kural için herhangi bir bildirim gönderilmedi. İlk tetikleme gerçekleştiğinde veriler burada görünecek.
              </p>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewCards?.map((card) => (
            <Card key={card.title} padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.helper}</p>
                </div>
                <div className={`p-3 rounded-full ${card.tone}`}>
                  {card.icon}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader
                title="Kanal Dağılımı"
                subtitle="Kanal bazında başarı, hata ve deneme sayıları"
              />
              <div className="space-y-3 p-4 pt-0">
              {ruleStats.channelBreakdown.map((channel) => {
                const successRate =
                  channel.total > 0 ? ((channel.successCount / channel.total) * 100).toFixed(1) : '0.0';
                return (
                  <div
                    key={channel.channelType}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground capitalize">{channel.channelType}</p>
                      <p className="text-xs text-muted-foreground">
                        {channel.total.toLocaleString()} gönderim • Başarı %{successRate}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Badge variant="success" size="sm">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {channel.successCount}
                      </Badge>
                      <Badge variant="warning" size="sm">
                        <Activity className="h-3 w-3 mr-1" />
                        {channel.partialCount}
                      </Badge>
                      <Badge variant="error" size="sm">
                        <XOctagon className="h-3 w-3 mr-1" />
                        {channel.failureCount}
                      </Badge>
                      <Badge variant="secondary" size="sm">
                        {channel.averageAttempts.toFixed(1)} deneme
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

            <Card>
              <CardHeader
                title="Son Gönderimler"
                subtitle="En güncel bildirim olayları"
              />
              <div className="space-y-3 p-4 pt-0">
              {ruleStats.recentEvents.map((event) => {
                const statusVariant =
                  event.status === 'success'
                    ? 'success'
                    : event.status === 'failed'
                      ? 'error'
                      : event.status === 'partial'
                        ? 'warning'
                        : 'secondary';

                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formatDateTime(event.triggeredAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tamamlanma: {event.completedAt ? formatDateTime(event.completedAt) : '—'} • Süre:{' '}
                        {formatDuration(event.durationMs)}
                      </p>
                      {event.failureReason && (
                        <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">
                          {event.failureReason}
                        </p>
                      )}
                    </div>
                    <Badge variant={statusVariant} size="sm" className="capitalize">
                      {event.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </>
    );
  };

  const userContent = () => {
    if (loading) {
      return (
        <Card padding="lg">
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t('common.loading') ?? 'Yükleniyor'}</span>
          </div>
        </Card>
      );
    }

    if (error) {
      return (
        <Card padding="lg">
          <div className="flex items-center gap-3 text-rose-500 dark:text-rose-400">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">İstatistikler yüklenemedi</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </Card>
      );
    }

    if (!userStats) {
      return (
        <Card padding="lg">
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-base font-medium text-foreground">Henüz istatistik yok</p>
              <p className="text-sm text-muted-foreground">
                Bu kullanıcı için henüz aktivite kaydı bulunmuyor.
              </p>
            </div>
          </div>
        </Card>
      );
    }

    const overviewCards = [
      {
        title: 'Toplam Aktivite',
        value: userStats.totalActivities.toLocaleString(),
        helper: `${userStats.viewedCount} görüntüleme`,
        icon: <Activity className="h-6 w-6" />,
        tone: 'bg-primary/10 text-primary',
      },
      {
        title: 'Oluşturulan Kayıtlar',
        value: userStats.createdCount.toLocaleString(),
        helper: `${userStats.createdThisMonth} bu ay`,
        icon: <UserPlus className="h-6 w-6" />,
        tone: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
      },
      {
        title: 'Güncellenen Kayıtlar',
        value: userStats.updatedCount.toLocaleString(),
        helper: `${userStats.updatedThisMonth} bu ay`,
        icon: <Edit2 className="h-6 w-6" />,
        tone: 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300',
      },
      {
        title: 'Son Aktivite',
        value: userStats.lastActivity ? formatDateTime(userStats.lastActivity) : '—',
        helper: userStats.lastActivity ? `${Math.floor((Date.now() - new Date(userStats.lastActivity).getTime()) / (1000 * 60 * 60))} saat önce` : 'Aktivite yok',
        icon: <Clock className="h-6 w-6" />,
        tone: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300',
      },
    ];

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewCards.map((card) => (
            <Card key={card.title} padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.helper}</p>
                </div>
                <div className={`p-3 rounded-full ${card.tone}`}>
                  {card.icon}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader
              title="Aktivite Dağılımı"
              subtitle="Kullanıcı aktivitelerinin türlere göre dağılımı"
            />
            <div className="space-y-3 p-4 pt-0">
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Oluşturma</p>
                    <p className="text-xs text-muted-foreground">Yeni kayıtlar oluşturuldu</p>
                  </div>
                </div>
                <Badge variant="success" size="sm">
                  {userStats.createdCount}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300">
                    <Edit2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Güncelleme</p>
                    <p className="text-xs text-muted-foreground">Mevcut kayıtlar güncellendi</p>
                  </div>
                </div>
                <Badge variant="warning" size="sm">
                  {userStats.updatedCount}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300">
                    <Trash2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Silme</p>
                    <p className="text-xs text-muted-foreground">Kayıtlar silindi</p>
                  </div>
                </div>
                <Badge variant="error" size="sm">
                  {userStats.deletedCount}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Görüntüleme</p>
                    <p className="text-xs text-muted-foreground">Kayıtlar görüntülendi</p>
                  </div>
                </div>
                <Badge variant="secondary" size="sm">
                  {userStats.viewedCount}
                </Badge>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Aylık Aktivite"
              subtitle="Bu ay ve geçen ay aktivite karşılaştırması"
            />
            <div className="space-y-3 p-4 pt-0">
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Bu Ay Oluşturulan</p>
                  <p className="text-xs text-muted-foreground">Yeni kayıtlar</p>
                </div>
                <Badge variant="success" size="sm">
                  {userStats.createdThisMonth}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Bu Ay Güncellenen</p>
                  <p className="text-xs text-muted-foreground">Mevcut kayıtlar</p>
                </div>
                <Badge variant="warning" size="sm">
                  {userStats.updatedThisMonth}
                </Badge>
              </div>

              <div className="rounded-lg border border-border px-4 py-3 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">Toplam Aktivite Oranı</p>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${userStats.totalActivities > 0 ? Math.min((userStats.totalActivities / 1000) * 100, 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {userStats.totalActivities > 0 ? Math.min(userStats.totalActivities, 1000) : 0}/1000
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </>
    );
  };

  if (isNotificationRule) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Bildirim İstatistikleri</h3>
            <p className="text-sm text-muted-foreground">
              Kural performansı, kanal dağılımı ve son gönderimlerin özeti
            </p>
          </div>
          <Badge variant="primary" size="sm">
            <BarChart3 className="h-3 w-3 mr-1" />
            Canlı Veri
          </Badge>
        </div>

        {notificationContent()}
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Kullanıcı İstatistikleri</h3>
            <p className="text-sm text-muted-foreground">
              Kullanıcı aktiviteleri, oluşturulan kayıtlar ve performans metrikleri
            </p>
          </div>
          <Badge variant="primary" size="sm">
            <BarChart3 className="h-3 w-3 mr-1" />
            Canlı Veri
          </Badge>
        </div>

        {userContent()}
      </div>
    );
  }

  const fallbackStats = mockStatistics;

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-rose-500 dark:text-rose-400" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-emerald-500 dark:text-emerald-400';
    if (change < 0) return 'text-rose-500 dark:text-rose-400';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Statistics & Analytics</h3>
          <p className="text-sm text-muted-foreground">Usage statistics and performance metrics</p>
        </div>
        <Badge variant="primary" size="sm">
          <BarChart3 className="h-3 w-3 mr-1" />
          Live Data
        </Badge>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
              <p className="text-2xl font-bold text-foreground">{fallbackStats.usageCount.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Activity className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-emerald-500 dark:text-emerald-400 mr-1" />
            <span className="text-sm text-emerald-500 dark:text-emerald-400">+12% from last month</span>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Items</p>
              <p className="text-2xl font-bold text-foreground">{fallbackStats.activeCount.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <Eye className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-muted-foreground">
              {Math.round((fallbackStats.activeCount / fallbackStats.totalCount) * 100)}% of total
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-foreground">{fallbackStats.updatedThisMonth}</p>
            </div>
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300">
              <Edit2 className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-muted-foreground">Updates made</span>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Used</p>
              <p className="text-sm font-bold text-foreground">
                {fallbackStats.lastUsed ? new Date(fallbackStats.lastUsed).toLocaleDateString() : 'Never'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-300">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-muted-foreground">
              {fallbackStats.lastUsed ? `${Math.floor((Date.now() - new Date(fallbackStats.lastUsed).getTime()) / (1000 * 60 * 60 * 24))} days ago` : 'No usage recorded'}
            </span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trends */}
        <Card>
          <CardHeader 
            title="Usage Trends" 
            subtitle="Monthly usage over time"
          />
          <div className="space-y-4">
            {fallbackStats.trends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/60 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-8 bg-primary/10 rounded flex items-end justify-center">
                    <div
                      className="w-2 bg-primary rounded-t"
                      style={{ height: `${(trend.value / 200) * 100}%` }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{trend.period}</p>
                    <p className="text-xs text-muted-foreground">{trend.value} uses</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {getChangeIcon(trend.change)}
                  <span className={`text-sm font-medium ${getChangeColor(trend.change)}`}>
                    {trend.change > 0 ? '+' : ''}{trend.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Users */}
        <Card>
          <CardHeader 
            title="Top Users" 
            subtitle="Most active users of this attribute"
          />
          <div className="space-y-3">
            {fallbackStats.topUsers.map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{index + 1}</span>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.userName}</p>
                    <p className="text-xs text-muted-foreground">User ID: {user.userId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{user.count}</p>
                  <p className="text-xs text-muted-foreground">uses</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Additional Metrics */}
      <Card>
        <CardHeader 
          title="Detailed Metrics" 
          subtitle="Comprehensive usage statistics"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Status Distribution</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-muted rounded-full">
                    <div 
                      className="h-2 bg-emerald-500 rounded-full"
                      style={{ width: `${(fallbackStats.activeCount / fallbackStats.totalCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">{fallbackStats.activeCount}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inactive</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-muted rounded-full">
                    <div 
                      className="h-2 bg-rose-500 rounded-full"
                      style={{ width: `${(fallbackStats.inactiveCount / fallbackStats.totalCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">{fallbackStats.inactiveCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Monthly Activity</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <Badge variant="success" size="sm">{fallbackStats.createdThisMonth}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Updated</span>
                <Badge variant="warning" size="sm">{fallbackStats.updatedThisMonth}</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Performance</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Daily Usage</span>
                <span className="text-sm font-medium text-foreground">
                  {Math.round(fallbackStats.usageCount / 30)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Peak Usage</span>
                <span className="text-sm font-medium text-foreground">
                  {Math.max(...fallbackStats.trends.map(t => t.value))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
