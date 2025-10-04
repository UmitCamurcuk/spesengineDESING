import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Shield, Mail, Calendar } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, UserInfo } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-01-25T10:30:00Z',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-25T10:30:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    role: 'user',
    status: 'active',
    lastLogin: '2024-01-24T15:45:00Z',
    createdAt: '2024-01-05T09:15:00Z',
    updatedAt: '2024-01-24T15:45:00Z',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@company.com',
    role: 'viewer',
    status: 'inactive',
    lastLogin: '2024-01-20T08:20:00Z',
    createdAt: '2024-01-10T11:20:00Z',
    updatedAt: '2024-01-22T13:10:00Z',
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@company.com',
    role: 'user',
    status: 'pending',
    createdAt: '2024-01-23T14:30:00Z',
    updatedAt: '2024-01-23T14:30:00Z',
  },
];

export const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const columns = [
    {
      key: 'name',
      title: 'User',
      sortable: true,
      render: (value: string, user: User) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{value}</div>
            <div className="flex items-center text-xs text-gray-500">
              <Mail className="h-3 w-3 mr-1" />
              {user.email}
            </div>
          </div>
        </div>
      ),
      mobileRender: (user: User) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">{user.name}</div>
              <div className="flex items-center text-xs text-gray-500">
                <Mail className="h-3 w-3 mr-1" />
                {user.email}
              </div>
            </div>
            <Badge
              variant={
                user.status === 'active' ? 'success' :
                user.status === 'pending' ? 'warning' : 'default'
              }
              size="sm"
            >
              {user.status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Role</div>
              <Badge 
                variant={
                  user.role === 'admin' ? 'error' :
                  user.role === 'user' ? 'primary' : 'secondary'
                }
                size="sm"
              >
                <Shield className="h-3 w-3 mr-1" />
                {user.role}
              </Badge>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Last Login</div>
              <div className="text-sm text-gray-600">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      sortable: true,
      render: (value: string) => (
        <Badge 
          variant={
            value === 'admin' ? 'error' :
            value === 'user' ? 'primary' : 'secondary'
          }
          size="sm"
        >
          <Shield className="h-3 w-3 mr-1" />
          {value}
        </Badge>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value: string) => (
        <Badge
          variant={
            value === 'active' ? 'success' :
            value === 'pending' ? 'warning' : 'default'
          }
          size="sm"
        >
          {value}
        </Badge>
      ),
    },
    {
      key: 'lastLogin',
      title: 'Last Login',
      sortable: true,
      render: (value: string | undefined) => (
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          {value ? new Date(value).toLocaleDateString() : 'Never'}
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

  const filters = [
    {
      key: 'status',
      label: 'All Statuses',
      type: 'select' as const,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
      ]
    },
    {
      key: 'role',
      label: 'All Roles',
      type: 'select' as const,
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'user', label: 'User' },
        { value: 'viewer', label: 'Viewer' },
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('users.title')}
        subtitle={t('users.subtitle')}
        action={
          <Button onClick={() => navigate('/users/create')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('users.create_title')}
          </Button>
        }
      />
      
      <div className="flex-1 mt-6">
        <DataTable
          data={mockUsers}
          columns={columns}
          searchPlaceholder="Search users..."
          filters={filters}
          onRowClick={(user) => navigate(`/users/${user.id}`)}
          emptyState={{
            icon: <Users className="h-12 w-12" />,
            title: 'No users found',
            description: 'Get started by inviting your first user',
            action: (
              <Button onClick={() => navigate('/users/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            )
          }}
        />
      </div>
    </div>
  );
};