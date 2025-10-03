import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Shield, Users, Key } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Stepper } from '../../components/ui/Stepper';
import { Badge } from '../../components/ui/Badge';

const steps = [
  { id: 'basic', name: 'Basic Info', description: 'Name and description' },
  { id: 'permissions', name: 'Permissions', description: 'Assign permissions' },
  { id: 'review', name: 'Review', description: 'Confirm details' },
];

// Mock data
const mockPermissionGroups = [
  { id: 'group-1', name: 'Content Management', permissions: 8 },
  { id: 'group-2', name: 'User Management', permissions: 5 },
  { id: 'group-3', name: 'System Administration', permissions: 12 },
  { id: 'group-4', name: 'Reporting', permissions: 4 },
];

const mockDirectPermissions = [
  { id: 'perm-1', name: 'Create Items', resource: 'items', action: 'create' },
  { id: 'perm-2', name: 'Delete Items', resource: 'items', action: 'delete' },
  { id: 'perm-3', name: 'Manage Categories', resource: 'categories', action: 'manage' },
  { id: 'perm-4', name: 'View Reports', resource: 'reports', action: 'read' },
];

export const RolesCreate: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissionGroups: [] as string[],
    permissions: [] as string[],
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setTimeout(() => {
      navigate('/roles');
    }, 2000);
  };

  const togglePermissionGroup = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      permissionGroups: prev.permissionGroups.includes(groupId)
        ? prev.permissionGroups.filter(id => id !== groupId)
        : [...prev.permissionGroups, groupId]
    }));
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim() !== '';
      case 1:
        return formData.permissionGroups.length > 0 || formData.permissions.length > 0;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader 
              title="Role Information" 
              subtitle="Define the basic properties of your role"
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <Input
                    label="Role Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter role name"
                    required
                  />
                  <Input
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this role can do"
                  />
                </div>
              </div>
            </div>
          </Card>
        );

      case 1:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader 
                title="Permission Groups" 
                subtitle="Select permission groups to assign to this role"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockPermissionGroups.map(group => {
                  const isSelected = formData.permissionGroups.includes(group.id);
                  return (
                    <button
                      key={group.id}
                      onClick={() => togglePermissionGroup(group.id)}
                      className={`p-4 border-2 rounded-xl transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Users className="h-6 w-6 text-purple-600" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{group.name}</h4>
                          <p className="text-xs text-gray-500">{group.permissions} permissions</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card>
              <CardHeader 
                title="Direct Permissions" 
                subtitle="Select individual permissions for fine-grained control"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockDirectPermissions.map(permission => {
                  const isSelected = formData.permissions.includes(permission.id);
                  return (
                    <button
                      key={permission.id}
                      onClick={() => togglePermission(permission.id)}
                      className={`p-4 border-2 rounded-xl transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Key className="h-6 w-6 text-green-600" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{permission.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="primary" size="sm">{permission.resource}</Badge>
                            <Badge variant="secondary" size="sm">{permission.action}</Badge>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        );

      case 2:
        return (
          <Card>
            <CardHeader 
              title="Review & Confirm" 
              subtitle="Please review your role details before creating"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-500">Name:</span> {formData.name}</p>
                    {formData.description && (
                      <p><span className="text-gray-500">Description:</span> {formData.description}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions Summary</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-500">Permission Groups:</span> {formData.permissionGroups.length}</p>
                    <p><span className="text-gray-500">Direct Permissions:</span> {formData.permissions.length}</p>
                  </div>
                </div>
              </div>
              
              {formData.permissionGroups.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Selected Permission Groups</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.permissionGroups.map(groupId => {
                      const group = mockPermissionGroups.find(g => g.id === groupId);
                      return group ? (
                        <Badge key={groupId} variant="primary">
                          {group.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {formData.permissions.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Selected Direct Permissions</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.permissions.map(permissionId => {
                      const permission = mockDirectPermissions.find(p => p.id === permissionId);
                      return permission ? (
                        <Badge key={permissionId} variant="success">
                          {permission.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card padding="lg">
        <Stepper steps={steps} currentStep={currentStep} />
      </Card>

      {renderStepContent()}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
        
        <div className="flex space-x-3">
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!canProceed()}
              leftIcon={<Check className="h-4 w-4" />}
            >
              Create Role
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};