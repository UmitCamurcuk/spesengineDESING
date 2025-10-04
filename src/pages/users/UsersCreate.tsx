import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Users, Mail, Shield } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Stepper } from '../../components/ui/Stepper';

const steps = [
  { id: 'basic', name: 'Basic Info', description: 'Name and email' },
  { id: 'role', name: 'Role & Permissions', description: 'Assign role' },
  { id: 'review', name: 'Review', description: 'Confirm details' },
];

const roleOptions = [
  { value: 'admin', label: 'Administrator' },
  { value: 'user', label: 'User' },
  { value: 'viewer', label: 'Viewer' },
];

export const UsersCreate: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'user' | 'viewer',
    sendInvite: true,
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
      navigate('/users');
    }, 2000);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim() !== '' && formData.email.trim() !== '';
      case 1:
        return formData.role !== '';
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
              title="User Information" 
              subtitle="Enter the basic details for the new user"
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter user's full name"
                    required
                  />
                  <Input
                    type="email"
                    label="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter user's email address"
                    required
                    leftIcon={<Mail className="h-4 w-4" />}
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
              title="Role & Permissions" 
              subtitle="Assign a role to determine user permissions"
            />
            <div className="space-y-6">
              <Select
                label="User Role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                options={roleOptions}
                required
                leftIcon={<Shield className="h-4 w-4" />}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roleOptions.map(role => (
                  <button
                    key={role.value}
                    onClick={() => setFormData(prev => ({ ...prev, role: role.value as any }))}
                    className={`p-4 border-2 rounded-xl transition-all duration-200 text-left ${
                      formData.role === role.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-border hover:border-border-hover hover:bg-muted'
                    }`}
                  >
                    <Shield className={`h-6 w-6 mb-2 ${
                      role.value === 'admin' ? 'text-red-600' :
                      role.value === 'user' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                    <h3 className="text-sm font-medium text-gray-900">{role.label}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {role.value === 'admin' ? 'Full system access' :
                       role.value === 'user' ? 'Standard user access' : 'Read-only access'}
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sendInvite"
                  checked={formData.sendInvite}
                  onChange={(e) => setFormData(prev => ({ ...prev, sendInvite: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="sendInvite" className="text-sm font-medium text-gray-700">
                  Send invitation email to user
                </label>
              </div>
            </div>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader 
              title="Review & Confirm" 
              subtitle="Please review the user details before creating"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">User Information</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-500">Name:</span> {formData.name}</p>
                    <p><span className="text-gray-500">Email:</span> {formData.email}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Role & Settings</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-500">Role:</span> {roleOptions.find(r => r.value === formData.role)?.label}</p>
                    <p><span className="text-gray-500">Send Invite:</span> {formData.sendInvite ? 'Yes' : 'No'}</p>
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
              Create User
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