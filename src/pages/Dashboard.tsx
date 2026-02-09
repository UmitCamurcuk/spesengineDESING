import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Database,
  FolderTree,
  Layers,
  TrendingUp,
  Activity,
  Bell,
  Shield,
  Search as SearchIcon,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useLanguage } from '../contexts/LanguageContext';

type Mode = 'overview' | 'operations' | 'search';
type Range = '7d' | '30d';

const overviewStats = [
  { name: 'dashboard.total_items', value: '2,543', change: '+12%', icon: Package },
  { name: 'dashboard.item_types', value: '47', change: '+3', icon: Database },
  { name: 'dashboard.categories', value: '156', change: '+8', icon: FolderTree },
  { name: 'dashboard.active_families', value: '89', change: '+2', icon: Layers },
];

const opsStats = [
  { name: 'dashboard.pending_tasks', value: '18', change: '5 due today', icon: Activity },
  { name: 'dashboard.approvals', value: '6', change: 'Waiting review', icon: Shield },
  { name: 'dashboard.failed_jobs', value: '2', change: 'Last 24h', icon: AlertTriangle },
  { name: 'dashboard.success_rate', value: '97.2%', change: 'ETL & webhooks', icon: CheckCircle2 },
];

const searchStats = [
  { name: 'dashboard.search_uptime', value: '99.5%', change: 'Rolling 7d', icon: SearchIcon },
  { name: 'dashboard.indexed_entities', value: '8', change: 'Item, Category, User…', icon: Database },
  { name: 'dashboard.last_reindex', value: '02 Feb 2026', change: '4m 12s', icon: RefreshCw },
  { name: 'dashboard.search_latency', value: '120 ms', change: 'P95', icon: Zap },
];

const quickActions = [
  { name: 'dashboard.create_item', description: 'dashboard.create_item_description', href: '/items/create', icon: Package, color: 'bg-indigo-500' },
  { name: 'dashboard.new_item_type', description: 'dashboard.new_item_type_description', href: '/item-types/create', icon: Database, color: 'bg-teal-500' },
  { name: 'dashboard.add_category', description: 'dashboard.add_category_description', href: '/categories/create', icon: FolderTree, color: 'bg-emerald-500' },
  { name: 'dashboard.create_family', description: 'dashboard.create_family_description', href: '/families/create', icon: Layers, color: 'bg-blue-500' },
];

const recentItems = [
  { id: '1', name: 'Premium Coffee Beans', type: 'Product', category: 'Food & Beverage', status: 'active', updatedAt: '2 hours ago' },
  { id: '2', name: 'Wireless Headphones', type: 'Electronics', category: 'Audio Equipment', status: 'draft', updatedAt: '4 hours ago' },
  { id: '3', name: 'Office Chair', type: 'Furniture', category: 'Office Equipment', status: 'active', updatedAt: '6 hours ago' },
  { id: '4', name: 'Smart Watch', type: 'Electronics', category: 'Wearables', status: 'active', updatedAt: '1 day ago' },
  { id: '5', name: 'Running Shoes', type: 'Apparel', category: 'Sports Equipment', status: 'inactive', updatedAt: '2 days ago' },
];

const notifications = [
  { id: 'n1', title: 'Yeni attribute seti onay bekliyor', time: '12 dk önce', type: 'info' },
  { id: 'n2', title: 'Kategori ağaç senkronizasyonu tamamlandı', time: '1 saat önce', type: 'success' },
  { id: 'n3', title: 'ES indeks sağlığı uyarısı (items-v1)', time: '3 saat önce', type: 'warning' },
];

const workQueue = [
  { id: 't1', title: 'Attribute group mapping', status: 'In Progress', assignee: 'Elif' },
  { id: 't2', title: 'Family review - Wearables', status: 'Waiting Approval', assignee: 'Mert' },
  { id: 't3', title: 'Reindex categories', status: 'Scheduled', assignee: 'System' },
];

const activitySeries = [
  { day: 'Jan 10', created: 22, updated: 15 },
  { day: 'Jan 13', created: 35, updated: 20 },
  { day: 'Jan 16', created: 31, updated: 28 },
  { day: 'Jan 19', created: 44, updated: 33 },
  { day: 'Jan 22', created: 48, updated: 26 },
  { day: 'Jan 25', created: 52, updated: 30 },
  { day: 'Jan 28', created: 61, updated: 37 },
  { day: 'Jan 31', created: 58, updated: 41 },
  { day: 'Feb 03', created: 64, updated: 39 },
  { day: 'Feb 06', created: 70, updated: 44 },
];

const searchLatencySeries = [
  { day: 'Jan 10', p50: 82, p95: 140, volume: 9.2 },
  { day: 'Jan 13', p50: 90, p95: 155, volume: 10.5 },
  { day: 'Jan 16', p50: 87, p95: 149, volume: 11.2 },
  { day: 'Jan 19', p50: 95, p95: 165, volume: 12.1 },
  { day: 'Jan 22', p50: 92, p95: 158, volume: 13.4 },
  { day: 'Jan 25', p50: 98, p95: 170, volume: 12.8 },
  { day: 'Jan 28', p50: 101, p95: 176, volume: 14.0 },
  { day: 'Jan 31', p50: 96, p95: 168, volume: 15.1 },
  { day: 'Feb 03', p50: 94, p95: 160, volume: 15.8 },
  { day: 'Feb 06', p50: 90, p95: 152, volume: 16.4 },
];

const categorySplit = [
  { name: 'Elektronik', items: 420 },
  { name: 'Giyim', items: 310 },
  { name: 'Mobilya', items: 220 },
  { name: 'Gıda', items: 180 },
  { name: 'Spor', items: 140 },
];

const notificationsSplit = [
  { channel: 'Email', sent: 820, fail: 24 },
  { channel: 'Push', sent: 620, fail: 12 },
  { channel: 'Slack', sent: 540, fail: 18 },
  { channel: 'Webhook', sent: 460, fail: 35 },
];

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>('overview');
  const [range, setRange] = useState<Range>('7d');

  const activeStats = useMemo(() => {
    if (mode === 'operations') return opsStats;
    if (mode === 'search') return searchStats;
    return overviewStats;
  }, [mode]);

  const filteredActivity = useMemo(
    () => (range === '7d' ? activitySeries.slice(-7) : activitySeries),
    [range],
  );

  return (
    <div className="space-y-6">
      {/* Dashboard switcher */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'overview', label: 'Genel' },
          { id: 'operations', label: 'Operasyon' },
          { id: 'search', label: 'Arama & Kapsam' },
        ].map((opt) => (
          <Button
            key={opt.id}
            variant={mode === opt.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setMode(opt.id as Mode)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeStats.map((stat) => (
          <Card key={stat.name} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t(stat.name)}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary-hover shadow-sm">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-success mr-1" />
                <span className="font-medium text-success">{stat.change}</span>
                <span className="ml-1">{t('dashboard.from_last_month')}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Mode specific content */}
      {mode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader title={t('dashboard.quick_actions')} />
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    to={action.href}
                    className="flex items-center p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 hover:shadow-sm"
                  >
                    <div className={`p-2 rounded-xl ${action.color} shadow-sm`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-foreground">{t(action.name)}</h3>
                      <p className="text-xs text-muted-foreground">{t(action.description)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          {/* Recent Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader
                title={t('dashboard.recent_items')}
                subtitle={t('dashboard.recent_items_subtitle')}
                action={
                  <Button variant="outline" size="sm">
                    {t('dashboard.view_all')}
                  </Button>
                }
              />
              <div className="space-y-4">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 hover:bg-muted rounded-xl transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center shadow-sm">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">{item.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-muted-foreground">{item.type}</span>
                          <span className="text-xs text-border">•</span>
                          <span className="text-xs text-muted-foreground">{item.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant={
                          item.status === 'active' ? 'success' : item.status === 'draft' ? 'warning' : 'default'
                        }
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{item.updatedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {mode === 'operations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader title="Operasyon Kuyruğu" subtitle="Bekleyen işler ve sahipleri" />
            <div className="divide-y divide-border">
              {workQueue.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.status}</p>
                  </div>
                  <Badge variant="outline" size="sm">
                    {task.assignee}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Bildirimler" subtitle="Sistem & veri olayları" />
            <div className="space-y-3 p-4 pt-0">
              {notifications.map((n) => (
                <div key={n.id} className="p-3 rounded-lg bg-muted/60">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Bell className="h-4 w-4" />
                    <span>{n.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full">
                {t('dashboard.view_all')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {mode === 'search' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Arama Sağlık Durumu" subtitle="Elasticsearch & indeksler" />
            <div className="space-y-4 p-4 pt-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cluster health</span>
                <Badge variant="success" size="sm">
                  green
                </Badge>
              </div>
              <div className="space-y-2">
                {['items-v1', 'categories-v1', 'users-v1', 'notification-rules-v1'].map((idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{idx}</span>
                    <span className="text-muted-foreground">shards: 1 • docs: 12k</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <RefreshCw className="h-4 w-4 mr-1" /> {t('dashboard.reindex_now') || 'Reindex başlat'}
              </Button>
            </div>
          </Card>
          <Card>
            <CardHeader title="Arama Kullanımı" subtitle="Son 24 saat" />
            <div className="p-4 pt-0 space-y-3">
              {[
                { label: 'Sorgu sayısı', value: '18.4K' },
                { label: 'Başarılı oran', value: '99.1%' },
                { label: 'P95 latency', value: '120 ms' },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="text-foreground font-medium">{m.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Charts common to all modes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Günlük Kayıt Aktivitesi"
            subtitle="Yeni oluşturulan / güncellenen item sayıları"
            action={
              <div className="flex gap-2">
                {(['7d', '30d'] as Range[]).map((r) => (
                  <Button
                    key={r}
                    size="sm"
                    variant={range === r ? 'primary' : 'outline'}
                    onClick={() => setRange(r)}
                  >
                    {r.toUpperCase()}
                  </Button>
                ))}
              </div>
            }
          />
          <div className="h-64 pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredActivity}>
                <defs>
                  <linearGradient id="created" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="updated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Area type="monotone" dataKey="created" stroke="#3b82f6" fill="url(#created)" name="Oluşturulan" />
                <Area type="monotone" dataKey="updated" stroke="#22c55e" fill="url(#updated)" name="Güncellenen" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Arama Performansı" subtitle="Latency P50/P95 ve sorgu hacmi" />
          <div className="h-64 pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={searchLatencySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis yAxisId="left" stroke="#9ca3af" />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="p50" stroke="#3b82f6" name="P50 (ms)" dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="p95" stroke="#f97316" name="P95 (ms)" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#22c55e" name="Sorgu (k)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Kategori Dağılımı" subtitle="Top 5 kategori" />
          <div className="h-64 pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySplit}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="items" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Bildirim Kanalları" subtitle="Gönderim / hata sayısı" />
          <div className="h-64 pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={notificationsSplit}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
                <XAxis dataKey="channel" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Bar dataKey="sent" name="Gönderilen" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="fail" name="Hata" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
