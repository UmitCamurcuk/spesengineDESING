import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Database, 
  FolderTree, 
  Layers, 
  Tags, 
  FileText,
  TrendingUp,
  Users,
  Activity,
  BarChart3
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useLanguage } from '../contexts/LanguageContext';

const stats = [
  {
    name: 'dashboard.total_items',
    value: '2,543',
    change: '+12%',
    changeType: 'increase' as const,
    icon: Package,
  },
  {
    name: 'dashboard.item_types',
    value: '47',
    change: '+3',
    changeType: 'increase' as const,
    icon: Database,
  },
  {
    name: 'dashboard.categories',
    value: '156',
    change: '+8',
    changeType: 'increase' as const,
    icon: FolderTree,
  },
  {
    name: 'dashboard.active_families',
    value: '89',
    change: '+2',
    changeType: 'increase' as const,
    icon: Layers,
  },
];

const quickActions = [
  {
    name: 'dashboard.create_item',
    description: 'dashboard.create_item_description',
    href: '/items/create',
    icon: Package,
    color: 'bg-indigo-500',
  },
  {
    name: 'dashboard.new_item_type',
    description: 'dashboard.new_item_type_description',
    href: '/item-types/create',
    icon: Database,
    color: 'bg-teal-500',
  },
  {
    name: 'dashboard.add_category',
    description: 'dashboard.add_category_description',
    href: '/categories/create',
    icon: FolderTree,
    color: 'bg-emerald-500',
  },
  {
    name: 'dashboard.create_family',
    description: 'dashboard.create_family_description',
    href: '/families/create',
    icon: Layers,
    color: 'bg-blue-500',
  },
];

const recentItems = [
  {
    id: '1',
    name: 'Premium Coffee Beans',
    type: 'Product',
    category: 'Food & Beverage',
    status: 'active',
    updatedAt: '2 hours ago',
  },
  {
    id: '2',
    name: 'Wireless Headphones',
    type: 'Electronics',
    category: 'Audio Equipment',
    status: 'draft',
    updatedAt: '4 hours ago',
  },
  {
    id: '3',
    name: 'Office Chair',
    type: 'Furniture',
    category: 'Office Equipment',
    status: 'active',
    updatedAt: '6 hours ago',
  },
  {
    id: '4',
    name: 'Smart Watch',
    type: 'Electronics',
    category: 'Wearables',
    status: 'active',
    updatedAt: '1 day ago',
  },
  {
    id: '5',
    name: 'Running Shoes',
    type: 'Apparel',
    category: 'Sports Equipment',
    status: 'inactive',
    updatedAt: '2 days ago',
  },
];

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t(stat.name)}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br from-primary to-primary-hover shadow-sm`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUp className="h-4 w-4 text-success mr-1" />
                <span className="text-sm font-medium text-success">{stat.change}</span>
                <span className="text-sm text-muted-foreground ml-1">{t('dashboard.from_last_month')}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

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
                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted rounded-xl transition-all duration-200">
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
                        item.status === 'active' ? 'success' : 
                        item.status === 'draft' ? 'warning' : 'default'
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
    </div>
  );
};