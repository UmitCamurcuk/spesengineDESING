import React from 'react';
import {
  Activity,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Download,
  Upload,
  LogIn,
  LogOut,
  Clock,
} from 'lucide-react';
import { DataTable, UserInfo } from '../ui/DataTable';
import { Badge } from '../ui/Badge';
import { HistoryEntry, HistoryChange } from '../../types/common';

interface HistoryTableProps {
  entityType?: string;
  entityId?: string;
  records?: HistoryEntry[];
  loading?: boolean;
  title?: string;
  description?: string;
  editMode?: boolean;
}

const mockHistoryData: HistoryEntry[] = [
  {
    id: '1',
    tenantId: 'demo',
    entityType: 'User',
    entityId: 'user-1',
    action: 'updated',
    summary: 'Profile information updated',
    timestamp: '2024-01-25T10:30:00Z',
    actor: { userId: '1', name: 'John Doe', email: 'john.doe@company.com' },
    actorName: 'John Doe',
    actorEmail: 'john.doe@company.com',
    changes: [
      { field: 'firstName', oldValue: 'John', newValue: 'Jonathan' },
      { field: 'location', oldValue: 'Istanbul', newValue: 'Ankara' },
    ],
    tags: ['profile'],
    request: { source: 'api' },
  },
  {
    id: '2',
    tenantId: 'demo',
    entityType: 'User',
    entityId: 'user-1',
    action: 'login',
    summary: 'Successful login',
    timestamp: '2024-01-24T09:45:00Z',
    actor: { userId: '1', email: 'john.doe@company.com', ip: '192.168.1.12' },
    actorName: 'john.doe',
    actorEmail: 'john.doe@company.com',
    tags: ['authentication'],
    request: { source: 'api' },
  },
  {
    id: '3',
    tenantId: 'demo',
    entityType: 'User',
    entityId: 'user-1',
    action: 'created',
    summary: 'User account created',
    timestamp: '2024-01-20T14:15:00Z',
    actorName: 'System',
    tags: ['bootstrap'],
    request: { source: 'system' },
  },
];

const getActionIcon = (action: string) => {
  switch (action) {
    case 'created':
      return <Plus className="h-4 w-4" />;
    case 'updated':
      return <Edit2 className="h-4 w-4" />;
    case 'deleted':
      return <Trash2 className="h-4 w-4" />;
    case 'viewed':
      return <Eye className="h-4 w-4" />;
    case 'exported':
      return <Download className="h-4 w-4" />;
    case 'imported':
      return <Upload className="h-4 w-4" />;
    case 'login':
      return <LogIn className="h-4 w-4" />;
    case 'logout':
      return <LogOut className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'created':
      return 'success';
    case 'updated':
      return 'warning';
    case 'deleted':
      return 'error';
    case 'viewed':
      return 'secondary';
    case 'exported':
    case 'imported':
      return 'primary';
    case 'login':
      return 'primary';
    case 'logout':
      return 'secondary';
    default:
      return 'default';
  }
};

const formatLabel = (value: string) =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatChangeValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (_error) {
      return '[object]';
    }
  }

  return String(value);
};

const getActorName = (entry: HistoryEntry): string =>
  entry.actorName ??
  entry.actor?.name ??
  entry.actor?.email ??
  entry.actor?.userId ??
  entry.actor?.ip ??
  'System';

const getActorEmail = (entry: HistoryEntry): string =>
  entry.actorEmail ?? entry.actor?.email ?? entry.actor?.ip ?? '—';

const renderChanges = (changes: HistoryChange[] | undefined) => {
  if (!changes || changes.length === 0) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const MAX_VISIBLE = 4;
  const visibleChanges = changes.slice(0, MAX_VISIBLE);
  const remaining = changes.length - visibleChanges.length;

  return (
    <div className="space-y-2">
      {visibleChanges.map((change) => (
        <div key={change.field} className="text-xs">
          <div className="font-medium text-foreground">{change.field}</div>
          <div className="mt-1 space-y-0.5">
            <div className="text-error line-through">
              {formatChangeValue(change.oldValue)}
            </div>
            <div className="text-success">
              {formatChangeValue(change.newValue)}
            </div>
          </div>
        </div>
      ))}
      {remaining > 0 && (
        <div className="text-xs text-muted-foreground">+{remaining} more changes</div>
      )}
    </div>
  );
};

export const HistoryTable: React.FC<HistoryTableProps> = ({
  records,
  loading = false,
  title = 'Activity History',
  description = 'Complete audit trail of all changes and activities',
}) => {
  const data = records ?? mockHistoryData;

  const actionOptions = Array.from(new Set(data.map((entry) => entry.action))).map(
    (action) => ({
      value: action,
      label: formatLabel(action),
    }),
  );

  const actorOptions = Array.from(
    new Set(data.map((entry) => getActorName(entry))),
  ).map((name) => ({
    value: name,
    label: name,
  }));

  const columns = [
    {
      key: 'action',
      title: 'Action',
      render: (value: string, entry: HistoryEntry) => (
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-full bg-${getActionColor(value)}-100`}>
            {getActionIcon(value)}
          </div>
          <Badge variant={getActionColor(value) as any} size="sm">
            {formatLabel(value)}
          </Badge>
        </div>
      ),
      mobileRender: (entry: HistoryEntry) => (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`p-1.5 rounded-full bg-${getActionColor(entry.action)}-100`}>
                {getActionIcon(entry.action)}
              </div>
              <Badge variant={getActionColor(entry.action) as any} size="sm">
                {formatLabel(entry.action)}
              </Badge>
            </div>
            <div className="flex items-center text-xs text-muted-foreground space-x-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{new Date(entry.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">
              {entry.summary ?? formatLabel(entry.action)}
            </div>
            <div className="text-xs text-muted-foreground">
              {entry.entityType} · {entry.entityId}
            </div>
          </div>

          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="secondary" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div>{renderChanges(entry.changes)}</div>

          <div className="text-xs text-muted-foreground">
            {getActorName(entry)} • {getActorEmail(entry)}
          </div>
        </div>
      ),
    },
    {
      key: 'summary',
      title: 'Details',
      render: (_: string, entry: HistoryEntry) => (
        <div className="space-y-1">
          <div className="text-sm font-medium text-foreground">
            {entry.summary ?? formatLabel(entry.action)}
          </div>
          <div className="text-xs text-muted-foreground">
            {entry.entityType} · {entry.entityId}
          </div>
          {entry.request?.source && (
            <div className="text-xs text-muted-foreground">
              Source: {formatLabel(entry.request.source)}
            </div>
          )}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="secondary" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'changes',
      title: 'Changes',
      render: (_: HistoryChange[] | undefined, entry: HistoryEntry) =>
        renderChanges(entry.changes),
    },
    {
      key: 'timestamp',
      title: 'Performed',
      sortable: true,
      render: (value: string, entry: HistoryEntry) => (
        <UserInfo
          name={getActorName(entry)}
          email={getActorEmail(entry)}
          date={value}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search history..."
        filters={[
          {
            key: 'action',
            label: 'All Actions',
            type: 'select',
            options: actionOptions,
          },
          {
            key: 'actorName',
            label: 'All Users',
            type: 'select',
            options: actorOptions,
          },
        ]}
        pageSize={20}
        emptyState={{
          icon: <Activity className="h-12 w-12" />,
          title: 'No history found',
          description: 'No activities have been recorded yet.',
        }}
      />
    </div>
  );
};
