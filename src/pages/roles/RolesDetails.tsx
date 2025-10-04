import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Save, X, Shield, Users, Key, Activity } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Role } from '../../types';

// Mock data
const mockRole: Role = {
  id: '1',
  name: 'Administrator',
  description: 'Full system access with all permissions',
  permissionGroups: ['group-1', 'group-2', 'group-3'],
  permissions: ['perm-1', 'perm-2', 'perm-3'],
  isSystem: true,
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-25T10:30:00Z',
};

const mockPermissionGroups = [
  { id: 'group-1', name: 'Content Management', permissions: 8 },
  { id: 'group-2', name: 'User Management', permissions: 5 },
  { id: 'group-3', name: 'System Administration', permissions: 12 },
];

const mockDirectPermissions = [
  { id: 'perm-1', name: 'Create Items', resource: 'items', action: 'create' },
  { id: 'perm-2', name: 'Delete Items', resource: 'items', action: 'delete' },
  { id: 'perm-3', name: 'Manage Categories', resource: 'categories', action: 'manage' },
];

const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john.doe@company.com' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@company.com' },
];

export const RolesDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [role, setRole] = useState(mockRole);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setTimeout(() => {
      setEditMode(false);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="Role Information" />
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{role.name}</h3>
                  <p className="text-sm text-muted-foreground">ID: {role.id}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Type</label>
                  <div className="mt-1">
                    <Badge variant={role.isSystem ? 'secondary' : 'primary'}>
                      {role.isSystem ? 'System Role' : 'Custom Role'}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground">Permission Groups</label>
                  <div className="flex items-center text-sm text-foreground mt-1">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    {role.permissionGroups.length} groups
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground">Direct Permissions</label>
                  <div className="flex items-center text-sm text-foreground mt-1">
                    <Key className="h-4 w-4 mr-2 text-muted-foreground" />
                    {role.permissions.length} permissions
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground">Created</label>
                  <p className="text-sm text-foreground mt-1">
                    {new Date(role.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground">Last Updated</label>
                  <p className="text-sm text-foreground mt-1">
                    {new Date(role.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Role Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader 
              title="Role Details" 
              subtitle="Manage role information and permissions"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Role Name"
                    value={role.name}
                    onChange={(e) => setRole(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!editMode || role.isSystem}
                  />
                </div>
                
                <div>
                  <Input
                    label="Description"
                    value={role.description || ''}
                    onChange={(e) => setRole(prev => ({ ...prev, description: e.target.value }))}
                    disabled={!editMode}
                  />
                </div>
              </div>

              {editMode && !role.isSystem && (
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    loading={loading}
                    leftIcon={<Save className="h-4 w-4" />}
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Permission Groups */}
          <Card>
            <CardHeader 
              title="Permission Groups" 
              subtitle="Groups assigned to this role"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockPermissionGroups.map(group => (
                <div
                  key={group.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-purple-600" />
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{group.name}</h4>
                      <p className="text-xs text-muted-foreground">{group.permissions} permissions</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Direct Permissions */}
          <Card>
            <CardHeader 
              title="Direct Permissions" 
              subtitle="Individual permissions assigned to this role"
            />
            <div className="space-y-3">
              {mockDirectPermissions.map(permission => (
                <div
                  key={permission.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Key className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{permission.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="primary" size="sm">{permission.resource}</Badge>
                        <Badge variant="secondary" size="sm">{permission.action}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Users with this Role */}
          <Card>
            <CardHeader 
              title="Users with this Role" 
              subtitle="Users currently assigned to this role"
            />
            <div className="space-y-3">
              {mockUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-4 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  onClick={() => navigate(`/users/${user.id}`)}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{user.name}</h4>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
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