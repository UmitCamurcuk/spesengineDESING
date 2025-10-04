import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Key } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Stepper } from '../../components/ui/Stepper';
import { Badge } from '../../components/ui/Badge';

const steps = [
  { id: 'basic', name: 'Basic Info', description: 'Name and description' },
  { id: 'permissions', name: 'Permissions', description: 'Select permissions' },
  { id: 'review', name: 'Review', description: 'Confirm details' },
];

// Mock permissions data
const mockPermissions = [
  { id: 'perm-1', name: 'Create Items', resource: 'items', action: 'create' },
  { id: 'perm-2', name: 'Edit Items', resource: 'items', action: 'update' },
  { id: 'perm-3', name: 'Delete Items', resource: 'items', action: 'delete' },
  { id: 'perm-4', name: 'View Items', resource: 'items', action: 'read' },
  { id: 'perm-5', name: 'Manage Categories', resource: 'categories', action: 'manage' },
  { id: 'perm-6', name: 'Create Categories', resource: 'categories', action: 'create' },
  { id: 'perm-7', name: 'Edit Categories', resource: 'categories', action: 'update' },
  { id: 'perm-8', name: 'Delete Categories', resource: 'categories', action: 'delete' },
  { id: 'perm-9', name: 'Manage Users', resource: 'users', action: 'manage' },
  { id: 'perm-10', name: 'Create Users', resource: 'users', action: 'create' },
  { id: 'perm-11', name: 'Edit Users', resource: 'users', action: 'update' },
  { id: 'perm-12', name: 'Delete Users', resource: 'users', action: 'delete' },
];

export const PermissionGroupsCreate: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
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
      navigate('/permission-groups');
    }, 2000);
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
        return formData.permissions.length > 0;
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
              title="Permission Group Information" 
              subtitle="Define the basic properties of your permission group"
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <Input
                    label="Group Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter permission group name"
                    required
                  />
                  <Input
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what permissions this group contains"
                  />
                </div>
              </div>
            </div>
          </Card>
        );

      case 1:
        const groupedPermissions = mockPermissions.reduce((acc, permission) => {
          if (!acc[permission.resource]) {
            acc[permission.resource] = [];
          }
          acc[permission.resource].push(permission);
          return acc;
        }, {} as Record<string, typeof mockPermissions>);

        return (
          <Card>
            <CardHeader 
              title="Select Permissions" 
              subtitle="Choose which permissions to include in this group"
            />
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                <div key={resource} className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 capitalize flex items-center">
                    <Key className="h-4 w-4 mr-2 text-gray-400" />
                    {resource} Permissions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissions.map(permission => {
                      const isSelected = formData.permissions.includes(permission.id);
                      return (
                        <button
                          key={permission.id}
                          onClick={() => togglePermission(permission.id)}
                          className={`p-3 border-2 rounded-lg transition-all duration-200 text-left ${
                            isSelected
                              ? 'border-green-500 bg-green-50'
                              : 'border-border hover:border-border-hover hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900">{permission.name}</h5>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="primary" size="sm">{permission.resource}</Badge>
                                <Badge variant="secondary" size="sm">{permission.action}</Badge>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader 
              title="Review & Confirm" 
              subtitle="Please review your permission group details before creating"
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
                    <p><span className="text-gray-500">Total Permissions:</span> {formData.permissions.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Selected Permissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formData.permissions.map(permissionId => {
                    const permission = mockPermissions.find(p => p.id === permissionId);
                    return permission ? (
                      <div key={permissionId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">{permission.name}</h5>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="primary" size="sm">{permission.resource}</Badge>
                            <Badge variant="secondary" size="sm">{permission.action}</Badge>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
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
              Create Permission Group
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