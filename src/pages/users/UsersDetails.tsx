import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Save, X, Users, Mail, Calendar, Shield, Activity } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { User } from '../../types';

// Mock data
const mockUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@company.com',
  role: 'admin',
  status: 'active',
  lastLogin: '2024-01-25T10:30:00Z',
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-25T10:30:00Z',
};

const roleOptions = [
  { value: 'admin', label: 'Administrator' },
  { value: 'user', label: 'User' },
  { value: 'viewer', label: 'Viewer' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
];

export const UsersDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [user, setUser] = useState(mockUser);
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
        {/* User Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="User Information" />
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-500">ID: {user.id}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        user.status === 'active' ? 'success' :
                        user.status === 'pending' ? 'warning' : 'default'
                      }
                    >
                      {user.status}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <div className="mt-1">
                    <Badge 
                      variant={
                        user.role === 'admin' ? 'error' :
                        user.role === 'user' ? 'primary' : 'secondary'
                      }
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Login</label>
                  <div className="flex items-center text-sm text-gray-900 mt-1">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* User Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader 
              title="User Details" 
              subtitle="Manage user information and permissions"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Full Name"
                  value={user.name}
                  onChange={(e) => setUser(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!editMode}
                />
              </div>
              
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!editMode}
                  leftIcon={<Mail className="h-4 w-4" />}
                />
              </div>
              
              <div>
                <Select
                  label="Role"
                  value={user.role}
                  onChange={(e) => setUser(prev => ({ ...prev, role: e.target.value as any }))}
                  options={roleOptions}
                  disabled={!editMode}
                />
              </div>
              
              <div>
                <Select
                  label="Status"
                  value={user.status}
                  onChange={(e) => setUser(prev => ({ ...prev, status: e.target.value as any }))}
                  options={statusOptions}
                  disabled={!editMode}
                />
              </div>
            </div>

            {editMode && (
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
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
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader 
              title="Recent Activity" 
              subtitle="User's recent actions and login history"
            />
            <div className="space-y-4">
              {[
                { action: 'Logged in', time: '2 hours ago', icon: Activity },
                { action: 'Updated profile', time: '1 day ago', icon: Edit2 },
                { action: 'Created item', time: '2 days ago', icon: Users },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <activity.icon className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
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