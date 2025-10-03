import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Shield, Users, Key } from 'lucide-react';
import { DataTable, UserInfo } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Role } from '../../types';

// Mock data
const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissionGroups: ['group-1', 'group-2', 'group-3'],
    permissions: ['perm-1', 'perm-2', 'perm-3'],
    isSystem: true,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-25T10:30:00Z',
  },
  {
    id: '2',
    name: 'Content Manager',
    description: 'Manage items, categories, and attributes',
    permissionGroups: ['group-1', 'group-2'],
    permissions: ['perm-1', 'perm-4'],
    isSystem: false,
    createdAt: '2024-01-05T09:15:00Z',
    updatedAt: '2024-01-24T15:45:00Z',
  },
  {
    id: '3',
    name: 'Viewer',
    description: 'Read-only access to system data',
    permissionGroups: ['group-3'],
    permissions: ['perm-5'],
    isSystem: true,
    createdAt: '2024-01-10T11:20:00Z',
    updatedAt: '2024-01-22T13:10:00Z',
  },
];

export const RolesList: React.FC = () => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'name',
      title: 'Role',
      sortable: true,
      render: (value: string, role: Role) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <div className="text-sm font-semibold text-gray-900">{value}</div>
              {role.isSystem && (
                <Badge variant="secondary" size="sm">System</Badge>
              )}
            </div>
            <div className="text-xs text-gray-500">ID: {role.id}</div>
          </div>
        </div>
      ),
      mobileRender: (role: Role) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="text-sm font-semibold text-gray-900">{role.name}</div>
                {role.isSystem && (
                  <Badge variant="secondary" size="sm">System</Badge>
                )}
              </div>
              <div className="text-xs text-gray-500">ID: {role.id}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Permission Groups</div>
              <div className="text-sm text-gray-600">{role.permissionGroups.length} groups</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Direct Permissions</div>
              <div className="text-sm text-gray-600">{role.permissions.length} permissions</div>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</div>
            <div className="text-sm text-gray-600">{role.description}</div>
          </div>
        </div>
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
      key: 'permissionGroups',
      title: 'Permission Groups',
      render: (value: string[]) => (
        <div className="flex items-center space-x-1">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">{value.length}</span>
          <span className="text-xs text-gray-400">groups</span>
        </div>
      ),
    },
    {
      key: 'permissions',
      title: 'Direct Permissions',
      render: (value: string[]) => (
        <div className="flex items-center space-x-1">
          <Key className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">{value.length}</span>
          <span className="text-xs text-gray-400">permissions</span>
        </div>
      ),
    },
    {
      key: 'isSystem',
      title: 'Type',
      render: (value: boolean) => (
        <Badge variant={value ? 'secondary' : 'primary'} size="sm">
          {value ? 'System' : 'Custom'}
        </Badge>
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
      key: 'isSystem',
      label: 'All Types',
      type: 'select' as const,
      options: [
        { value: 'true', label: 'System Roles' },
        { value: 'false', label: 'Custom Roles' },
      ]
    }
  ];

  return (
    <DataTable
        data={mockRoles}
        columns={columns}
        searchPlaceholder="Search roles..."
        filters={filters}
        onRowClick={(role) => navigate(`/roles/${role.id}`)}
        emptyState={{
          icon: <Shield className="h-12 w-12" />,
          title: 'No roles found',
          description: 'Get started by creating your first role',
          action: (
            <Button onClick={() => navigate('/roles/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          )
        }}
    />
  );
};