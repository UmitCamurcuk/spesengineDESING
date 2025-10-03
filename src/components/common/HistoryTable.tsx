import React from 'react';
import { Calendar, User, Activity, Eye, Edit2, Trash2, Plus, Download, Upload } from 'lucide-react';
import { DataTable, UserInfo } from '../ui/DataTable';
import { Badge } from '../ui/Badge';
import { HistoryEntry } from '../../types/common';

interface HistoryTableProps {
  entityType: string;
  entityId: string;
  editMode?: boolean;
}

// Mock history data
const mockHistoryData: HistoryEntry[] = [
  {
    id: '1',
    entityType: 'attribute',
    entityId: 'attr-1',
    action: 'updated',
    field: 'name',
    oldValue: 'Product Name',
    newValue: 'Item Name',
    userId: '1',
    userName: 'John Doe',
    userEmail: 'john.doe@company.com',
    timestamp: '2024-01-25T10:30:00Z',
    metadata: { source: 'web_ui' }
  },
  {
    id: '2',
    entityType: 'attribute',
    entityId: 'attr-1',
    action: 'created',
    userId: '1',
    userName: 'John Doe',
    userEmail: 'john.doe@company.com',
    timestamp: '2024-01-20T14:15:00Z',
    metadata: { source: 'api' }
  },
  {
    id: '3',
    entityType: 'attribute',
    entityId: 'attr-1',
    action: 'viewed',
    userId: '2',
    userName: 'Jane Smith',
    userEmail: 'jane.smith@company.com',
    timestamp: '2024-01-24T09:45:00Z',
    metadata: { source: 'web_ui', ip: '192.168.1.100' }
  }
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
    default:
      return 'default';
  }
};

export const HistoryTable: React.FC<HistoryTableProps> = ({
  entityType,
  entityId,
  editMode = false
}) => {
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
            {value}
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
                {entry.action}
              </Badge>
            </div>
            <div className="text-xs text-gray-500">
              {new Date(entry.timestamp).toLocaleDateString()}
            </div>
          </div>
          
          {entry.field && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Field Changed</div>
              <div className="text-sm font-medium text-gray-900">{entry.field}</div>
              {entry.oldValue && entry.newValue && (
                <div className="text-xs text-gray-600 mt-1">
                  <span className="line-through text-red-600">{String(entry.oldValue)}</span>
                  {' → '}
                  <span className="text-green-600">{String(entry.newValue)}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <User className="h-3 w-3 text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{entry.userName}</div>
              <div className="text-xs text-gray-500">{entry.userEmail}</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'field',
      title: 'Field',
      render: (value: string) => (
        value ? (
          <span className="font-medium text-gray-900">{value}</span>
        ) : (
          <span className="text-gray-400">—</span>
        )
      ),
    },
    {
      key: 'changes',
      title: 'Changes',
      render: (_: any, entry: HistoryEntry) => (
        entry.oldValue && entry.newValue ? (
          <div className="space-y-1">
            <div className="text-xs text-red-600 line-through">
              {String(entry.oldValue)}
            </div>
            <div className="text-xs text-green-600">
              {String(entry.newValue)}
            </div>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )
      ),
    },
    {
      key: 'timestamp',
      title: 'When',
      sortable: true,
      render: (value: string, entry: HistoryEntry) => (
        <UserInfo
          name={entry.userName}
          email={entry.userEmail}
          date={value}
        />
      ),
    },
  ];

  const filters = [
    {
      key: 'action',
      label: 'All Actions',
      type: 'select' as const,
      options: [
        { value: 'created', label: 'Created' },
        { value: 'updated', label: 'Updated' },
        { value: 'deleted', label: 'Deleted' },
        { value: 'viewed', label: 'Viewed' },
        { value: 'exported', label: 'Exported' },
        { value: 'imported', label: 'Imported' },
      ]
    },
    {
      key: 'userName',
      label: 'All Users',
      type: 'select' as const,
      options: [
        { value: 'John Doe', label: 'John Doe' },
        { value: 'Jane Smith', label: 'Jane Smith' },
      ]
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Activity History</h3>
          <p className="text-sm text-gray-500">Complete audit trail of all changes and activities</p>
        </div>
      </div>

      <DataTable
        data={mockHistoryData}
        columns={columns}
        searchPlaceholder="Search history..."
        filters={filters}
        pageSize={20}
        emptyState={{
          icon: <Activity className="h-12 w-12" />,
          title: 'No history found',
          description: 'No activities have been recorded for this item yet'
        }}
      />
    </div>
  );
};