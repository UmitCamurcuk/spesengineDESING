import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Tags, ArrowRight, Check } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Stepper } from '../../components/ui/Stepper';

const steps = [
  { id: 'basic', name: 'Basic Info', description: 'Name and description' },
  { id: 'preview', name: 'Preview', description: 'Review and confirm' },
];

export const AttributeGroupsCreate: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 1,
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
      navigate('/attribute-groups');
    }, 1500);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim() !== '';
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
              title="Group Information" 
              subtitle="Define the basic properties of your attribute group"
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Tags className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <Input
                    label="Group Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter group name"
                    required
                  />
                  <Input
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what attributes this group will contain"
                  />
                  <Input
                    label="Display Order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                    min="1"
                    helperText="Groups will be displayed in this order (lower numbers first)"
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
              title="Review & Confirm" 
              subtitle="Please review your attribute group details before creating"
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
                    <p><span className="text-gray-500">Display Order:</span> {formData.order}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Preview</h4>
                <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">{formData.order}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {formData.name || 'Group Name'}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formData.description || 'Group description will appear here'}
                      </p>
                    </div>
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
    <div className="space-y-6">
      {/* Stepper */}
      <Card padding="lg">
        <Stepper steps={steps} currentStep={currentStep} />
      </Card>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
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
              Create Attribute Group
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