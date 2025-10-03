import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Save, X, ShieldCheck, Key, Shield, Users } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { PermissionGroup } from '../../types';

// Mock data
const mockPermissionGroup: PermissionGroup = {
  id: '1',
  name: 'Content Management',
  description: 'Permissions for managing content, items, categories, and attributes',
  permissions: ['perm-1', 'perm-2', 'perm-3', 'perm-4', 'perm-5', 'perm-6', 'perm-7', 'perm-8'],
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-25T10:30:00Z',
};

const mockPermissions = [
  { id: 'perm-1', name: 'Create Items', resource: 'items', action: 'create' },
  { id: 'perm-2', name: 'Edit Items', resource: 'items', action: 'update' },
  { id: 'perm-3', name: 'Delete Items', resource: 'items', action: 'delete' },
  { id: 'perm-4', name: 'View Items', resource: 'items', action: 'read' },
  { id: 'perm-5', name: 'Manage Categories', resource: 'categories', action: 'manage' },
  { id: 'perm-6', name: 'Create Categories', resource: 'categories', action: 'create' },
  { id: 'perm-7', name: 'Edit Categories', resource: 'categories', action: 'update' },
  { id: 'perm-8', name: 'Delete Categories', resource: 'categories', action: 'delete' },
];

const mockRoles = [
  { id: '1', name: 'Administrator', users: 3 },
  { id: '2', name: 'Content Manager', users: 5 },
  { id: '3', name: 'Editor', users: 8 },
];

export const PermissionGroupsDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [group, setGroup] = useState(mockPermissionGroup);
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
        {/* Group Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="Permission Group Information" />
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                  <p className="text-sm text-gray-500">ID: {group.id}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Total Permissions</label>
                  <div className="flex items-center text-sm text-gray-900 mt-1">
                    <Key className="h-4 w-4 mr-2 text-gray-400" />
                    {group.permissions.length} permissions
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Used by Roles</label>
                  <div className="flex items-center text-sm text-gray-900 mt-1">
                    <Shield className="h-4 w-4 mr-2 text-gray-400" />
                    {mockRoles.length} roles
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(group.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(group.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Group Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader 
              title="Permission Group Details" 
              subtitle="Manage group information"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Input
                    label="Group Name"
                    value={group.name}
                    onChange={(e) => setGroup(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!editMode}
                  />
                </div>
                
                <div>
                  <Input
                    label="Description"
                    value={group.description || ''}
                    onChange={(e) => setGroup(prev => ({ ...prev, description: e.target.value }))}
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

          {/* Permissions in Group */}
          <Card>
            <CardHeader 
              title="Permissions in this Group" 
              subtitle="All permissions included in this group"
            />
            <div className="space-y-3">
              {mockPermissions.map(permission => (
                <div
                  key={permission.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/permissions/${permission.id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <Key className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{permission.name}</h4>
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

          {/* Roles using this Group */}
          <Card>
            <CardHeader 
              title="Roles using this Group" 
              subtitle="Roles that have been assigned this permission group"
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
        </div>
      </div>
    </div>
  );
};