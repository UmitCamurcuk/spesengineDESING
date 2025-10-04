import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Key, Shield } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, UserInfo } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Permission } from '../../types';

// Mock data
const mockPermissions: Permission[] = [
  {
    id: '1',
    name: 'Create Items',
    description: 'Ability to create new items in the system',
    resource: 'items',
    action: 'create',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: '2',
    name: 'Edit Items',
    description: 'Ability to modify existing items',
    resource: 'items',
    action: 'update',
    createdAt: '2024-01-02T09:15:00Z',
    updatedAt: '2024-01-19T16:45:00Z',
  },
  {
    id: '3',
    name: 'Delete Items',
    description: 'Ability to delete items from the system',
    resource: 'items',
    action: 'delete',
    createdAt: '2024-01-03T11:20:00Z',
    updatedAt: '2024-01-22T13:10:00Z',
  },
  {
    id: '4',
    name: 'Manage Users',
    description: 'Full user management capabilities',
    resource: 'users',
    action: 'manage',
    createdAt: '2024-01-04T15:30:00Z',
    updatedAt: '2024-01-21T10:20:00Z',
  },
];

export const PermissionsList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const columns = [
    {
      key: 'name',
      title: 'Permission',
      sortable: true,
      render: (value: string, permission: Permission) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
            <Key className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{value}</div>
            <div className="text-xs text-gray-500">ID: {permission.id}</div>
          </div>
        </div>
      ),
      mobileRender: (permission: Permission) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
              <Key className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">{permission.name}</div>
              <div className="text-xs text-gray-500">ID: {permission.id}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Resource</div>
              <Badge variant="primary" size="sm">
                {permission.resource}
              </Badge>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Action</div>
              <Badge variant="secondary" size="sm">
                {permission.action}
              </Badge>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</div>
            <div className="text-sm text-gray-600">{permission.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'resource',
      title: 'Resource',
      sortable: true,
      render: (value: string) => (
        <Badge variant="primary" size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'action',
      title: 'Action',
      sortable: true,
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      render: (value: string) => (
        <span className="text-sm text-gray-600 line-clamp-2">{value}</span>
      ),
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      sortable: true,
      render: (value: string) => (
        <UserInfo
          name="System Admin"
          email="admin@company.com"
          date={value}
        />
      ),
    },
  ];

  const filters = [
    {
      key: 'resource',
      label: 'All Resources',
      type: 'select' as const,
      options: [
        { value: 'items', label: 'Items' },
        { value: 'users', label: 'Users' },
        { value: 'categories', label: 'Categories' },
        { value: 'attributes', label: 'Attributes' },
      ]
    },
    {
      key: 'action',
      label: 'All Actions',
      type: 'select' as const,
      options: [
        { value: 'create', label: 'Create' },
        { value: 'read', label: 'Read' },
        { value: 'update', label: 'Update' },
        { value: 'delete', label: 'Delete' },
        { value: 'manage', label: 'Manage' },
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('permissions.title')}
        subtitle={t('permissions.subtitle')}
        action={
          <Button onClick={() => navigate('/permissions/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Permission
          </Button>
        }
      />
      
      <div className="flex-1 mt-6">
        <DataTable
          data={mockPermissions}
          columns={columns}
          searchPlaceholder="Search permissions..."
          filters={filters}
          onRowClick={(permission) => navigate(`/permissions/${permission.id}`)}
          emptyState={{
            icon: <Key className="h-12 w-12" />,
            title: 'No permissions found',
            description: 'Get started by creating your first permission',
            action: (
              <Button onClick={() => navigate('/permissions/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Permission
              </Button>
            )
          }}
        />
      </div>
    </div>
  );
};