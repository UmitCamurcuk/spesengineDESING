import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Key, Database } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Stepper } from '../../components/ui/Stepper';

const steps = [
  { id: 'basic', name: 'Basic Info', description: 'Name and description' },
  { id: 'resource', name: 'Resource & Action', description: 'Define permission scope' },
  { id: 'review', name: 'Review', description: 'Confirm details' },
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

export const PermissionsCreate: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    resource: '',
    action: '',
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
      navigate('/permissions');
    }, 2000);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim() !== '';
      case 1:
        return formData.resource !== '' && formData.action !== '';
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
              title="Permission Information" 
              subtitle="Define the basic properties of your permission"
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Key className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <Input
                    label="Permission Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter permission name"
                    required
                  />
                  <Input
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this permission allows"
                  />
                </div>
              </div>
            </div>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardHeader 
              title="Resource & Action" 
              subtitle="Define what resource and action this permission controls"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Resource"
                  value={formData.resource}
                  onChange={(e) => setFormData(prev => ({ ...prev, resource: e.target.value }))}
                  options={resourceOptions}
                  required
                  leftIcon={<Database className="h-4 w-4" />}
                  helperText="The system resource this permission applies to"
                />
                
                <Select
                  label="Action"
                  value={formData.action}
                  onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
                  options={actionOptions}
                  required
                  leftIcon={<Key className="h-4 w-4" />}
                  helperText="The action that can be performed on the resource"
                />
              </div>

              {formData.resource && formData.action && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-700">
                    <Key className="h-4 w-4" />
                    <span className="text-sm font-medium">Permission Preview</span>
                  </div>
                  <div className="mt-2 text-sm text-green-600">
                    This permission will allow users to <strong>{formData.action}</strong> on <strong>{formData.resource}</strong>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader 
              title="Review & Confirm" 
              subtitle="Please review your permission details before creating"
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
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Resource & Action</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-500">Resource:</span> {resourceOptions.find(r => r.value === formData.resource)?.label}</p>
                    <p><span className="text-gray-500">Action:</span> {actionOptions.find(a => a.value === formData.action)?.label}</p>
                  </div>
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
              Create Permission
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