import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Users, Activity, Calendar, Eye, Edit2 } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Statistics as StatisticsType } from '../../types/common';

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
  const stats = mockStatistics;

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
              <p className="text-2xl font-bold text-foreground">{stats.usageCount.toLocaleString()}</p>
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
              <p className="text-2xl font-bold text-foreground">{stats.activeCount.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <Eye className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-muted-foreground">
              {Math.round((stats.activeCount / stats.totalCount) * 100)}% of total
            </span>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-foreground">{stats.updatedThisMonth}</p>
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
                {stats.lastUsed ? new Date(stats.lastUsed).toLocaleDateString() : 'Never'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-300">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-muted-foreground">
              {stats.lastUsed ? `${Math.floor((Date.now() - new Date(stats.lastUsed).getTime()) / (1000 * 60 * 60 * 24))} days ago` : 'No usage recorded'}
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
            {stats.trends.map((trend, index) => (
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
            {stats.topUsers.map((user, index) => (
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
                      style={{ width: `${(stats.activeCount / stats.totalCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">{stats.activeCount}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inactive</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-muted rounded-full">
                    <div 
                      className="h-2 bg-rose-500 rounded-full"
                      style={{ width: `${(stats.inactiveCount / stats.totalCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">{stats.inactiveCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Monthly Activity</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <Badge variant="success" size="sm">{stats.createdThisMonth}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Updated</span>
                <Badge variant="warning" size="sm">{stats.updatedThisMonth}</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Performance</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Daily Usage</span>
                <span className="text-sm font-medium text-foreground">
                  {Math.round(stats.usageCount / 30)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Peak Usage</span>
                <span className="text-sm font-medium text-foreground">
                  {Math.max(...stats.trends.map(t => t.value))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
