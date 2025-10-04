import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, ShieldCheck, Key, Users } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, UserInfo } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PermissionGroup } from '../../types';

// Mock data
const mockPermissionGroups: PermissionGroup[] = [
  {
    id: '1',
    name: 'Content Management',
    description: 'Permissions for managing content, items, categories, and attributes',
    permissions: ['perm-1', 'perm-2', 'perm-3', 'perm-4', 'perm-5', 'perm-6', 'perm-7', 'perm-8'],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-25T10:30:00Z',
  },
  {
    id: '2',
    name: 'User Management',
    description: 'Permissions for managing users, roles, and permissions',
    permissions: ['perm-9', 'perm-10', 'perm-11', 'perm-12', 'perm-13'],
    createdAt: '2024-01-05T09:15:00Z',
    updatedAt: '2024-01-24T15:45:00Z',
  },
  {
    id: '3',
    name: 'System Administration',
    description: 'Full system administration permissions',
    permissions: ['perm-14', 'perm-15', 'perm-16', 'perm-17', 'perm-18', 'perm-19', 'perm-20', 'perm-21', 'perm-22', 'perm-23', 'perm-24', 'perm-25'],
    createdAt: '2024-01-10T11:20:00Z',
    updatedAt: '2024-01-22T13:10:00Z',
  },
  {
    id: '4',
    name: 'Reporting',
    description: 'Permissions for viewing and generating reports',
    permissions: ['perm-26', 'perm-27', 'perm-28', 'perm-29'],
    createdAt: '2024-01-15T14:30:00Z',
    updatedAt: '2024-01-21T10:20:00Z',
  },
];

export const PermissionGroupsList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const columns = [
    {
      key: 'name',
      title: 'Permission Group',
      sortable: true,
      render: (value: string, group: PermissionGroup) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500">ID: {group.id}</div>
          </div>
        </div>
      ),
      mobileRender: (group: PermissionGroup) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">{group.name}</div>
              <div className="text-xs text-gray-500">ID: {group.id}</div>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Permissions</div>
            <div className="flex items-center space-x-1">
              <Key className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{group.permissions.length}</span>
              <span className="text-xs text-gray-400">permissions</span>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</div>
            <div className="text-sm text-gray-600">{group.description}</div>
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
      key: 'permissions',
      title: 'Permissions',
      render: (value: string[]) => (
        <div className="flex items-center space-x-1">
          <Key className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">{value.length}</span>
          <span className="text-xs text-gray-400">permissions</span>
        </div>
      ),
    },
    {
      key: 'roles',
      title: 'Used by Roles',
      render: () => (
        <div className="flex items-center space-x-1">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">3</span>
          <span className="text-xs text-gray-400">roles</span>
        </div>
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

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('permission_groups.title')}
        subtitle={t('permission_groups.subtitle')}
        action={
          <Button onClick={() => navigate('/permission-groups/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Permission Group
          </Button>
        }
      />
      
      <div className="flex-1 mt-6">
        <DataTable
          data={mockPermissionGroups}
          columns={columns}
          searchPlaceholder="Search permission groups..."
          onRowClick={(group) => navigate(`/permission-groups/${group.id}`)}
          emptyState={{
            icon: <ShieldCheck className="h-12 w-12" />,
            title: 'No permission groups found',
            description: 'Get started by creating your first permission group',
            action: (
              <Button onClick={() => navigate('/permission-groups/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Permission Group
              </Button>
            )
          }}
        />
      </div>
    </div>
  );
};