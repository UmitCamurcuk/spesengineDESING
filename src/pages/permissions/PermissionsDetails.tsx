import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Save, X, Key, Shield, Users } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Permission } from '../../types';

// Mock data
const mockPermission: Permission = {
  id: '1',
  name: 'Create Items',
  description: 'Ability to create new items in the system',
  resource: 'items',
  action: 'create',
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-20T14:30:00Z',
};

const mockRoles = [
  { id: '1', name: 'Administrator', users: 3 },
  { id: '2', name: 'Content Manager', users: 5 },
];

const mockPermissionGroups = [
  { id: '1', name: 'Content Management', permissions: 8 },
  { id: '2', name: 'Item Management', permissions: 12 },
];

const resourceOptions = [
  { value: 'items', label: 'Items' },
  { value: 'categories', label: 'Categories' },
  { value: 'families', label: 'Families' },
  { value: 'attributes', label: 'Attributes' },
  { value: 'users', label: 'Users' },
  { value: 'roles', label: 'Roles' },
  { value: 'permissions', label: 'Permissions' },
  { value: 'reports', label: 'Reports' },
  { value: 'settings', label: 'Settings' },
];

const actionOptions = [
  { value: 'create', label: 'Create' },
  { value: 'read', label: 'Read' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'manage', label: 'Manage (Full Access)' },
];

export const PermissionsDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [permission, setPermission] = useState(mockPermission);
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
        {/* Permission Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="Permission Information" />
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Key className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{permission.name}</h3>
                  <p className="text-sm text-gray-500">ID: {permission.id}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Resource</label>
                  <div className="mt-1">
                    <Badge variant="primary">
                      {permission.resource}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Action</label>
                  <div className="mt-1">
                    <Badge variant="secondary">
                      {permission.action}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(permission.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(permission.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Permission Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader 
              title="Permission Details" 
              subtitle="Manage permission information"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Permission Name"
                    value={permission.name}
                    onChange={(e) => setPermission(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!editMode}
                  />
                </div>
                
                <div>
                  <Input
                    label="Description"
                    value={permission.description || ''}
                    onChange={(e) => setPermission(prev => ({ ...prev, description: e.target.value }))}
                    disabled={!editMode}
                  />
                </div>
                
                <div>
                  <Select
                    label="Resource"
                    value={permission.resource}
                    onChange={(e) => setPermission(prev => ({ ...prev, resource: e.target.value }))}
                    options={resourceOptions}
                    disabled={!editMode}
                  />
                </div>
                
                <div>
                  <Select
                    label="Action"
                    value={permission.action}
                    onChange={(e) => setPermission(prev => ({ ...prev, action: e.target.value }))}
                    options={actionOptions}
                    disabled={!editMode}
                  />
                </div>
              </div>

              {editMode && (
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

          {/* Roles with this Permission */}
          <Card>
            <CardHeader 
              title="Roles with this Permission" 
              subtitle="Roles that have been granted this permission"
            />
            <div className="space-y-3">
              {mockRoles.map(role => (
                <div
                  key={role.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/roles/${role.id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-purple-600" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{role.name}</h4>
                      <p className="text-xs text-gray-500">{role.users} users</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Permission Groups */}
          <Card>
            <CardHeader 
              title="Permission Groups" 
              subtitle="Groups that include this permission"
            />
            <div className="space-y-3">
              {mockPermissionGroups.map(group => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/permission-groups/${group.id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-blue-600" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{group.name}</h4>
                      <p className="text-xs text-gray-500">{group.permissions} permissions</p>
                    </div>
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