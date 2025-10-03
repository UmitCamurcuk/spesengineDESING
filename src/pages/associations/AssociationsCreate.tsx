import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Zap, Database, ArrowUpDown, Hash } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Stepper } from '../../components/ui/Stepper';
import { Badge } from '../../components/ui/Badge';

const steps = [
  { id: 'basic', name: 'Basic Info', description: 'Name and description' },
  { id: 'relationship', name: 'Relationship', description: 'Define item types' },
  { id: 'configuration', name: 'Configuration', description: 'Set rules and limits' },
  { id: 'review', name: 'Review', description: 'Confirm details' },
];

const mockItemTypes = [
  { value: 'type-order', label: 'Order' },
  { value: 'type-product', label: 'Product' },
  { value: 'type-service', label: 'Service' },
  { value: 'type-fabric', label: 'Fabric' },
  { value: 'type-hardware', label: 'Hardware' },
  { value: 'type-accessories', label: 'Accessories' },
  { value: 'type-resource', label: 'Resource' },
];

const associationTypeOptions = [
  { value: 'one-to-one', label: 'One to One' },
  { value: 'one-to-many', label: 'One to Many' },
  { value: 'many-to-many', label: 'Many to Many' },
];

export const AssociationsCreate: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceItemTypeId: '',
    targetItemTypeId: '',
    associationType: 'one-to-many' as 'one-to-one' | 'one-to-many' | 'many-to-many',
    isRequired: false,
    minQuantity: 1,
    maxQuantity: 10,
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
      navigate('/associations');
    }, 2000);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim() !== '';
      case 1:
        return formData.sourceItemTypeId !== '' && formData.targetItemTypeId !== '';
      case 2:
        return formData.minQuantity >= 0 && formData.maxQuantity >= formData.minQuantity;
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
              title="Association Information"
              subtitle="Define the basic properties of your association"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Association Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Order - Fabric, Product - Accessories"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the relationship between these item types..."
                      rows={4}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );

      case 1: {
        const sourceItemType = mockItemTypes.find(t => t.value === formData.sourceItemTypeId);
        const targetItemType = mockItemTypes.find(t => t.value === formData.targetItemTypeId);

        return (
          <Card>
            <CardHeader
              title="Define Relationship"
              subtitle="Select the item types and relationship type"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Source Item Type"
                  value={formData.sourceItemTypeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, sourceItemTypeId: e.target.value }))}
                  options={mockItemTypes}
                  required
                  leftIcon={<Database className="h-4 w-4" />}
                  helperText="The item type that will have the association"
                />

                <Select
                  label="Target Item Type"
                  value={formData.targetItemTypeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetItemTypeId: e.target.value }))}
                  options={mockItemTypes.filter(t => t.value !== formData.sourceItemTypeId)}
                  required
                  leftIcon={<Database className="h-4 w-4" />}
                  helperText="The item type that will be associated"
                />
              </div>

              <Select
                label="Association Type"
                value={formData.associationType}
                onChange={(e) => setFormData(prev => ({ ...prev, associationType: e.target.value as any }))}
                options={associationTypeOptions}
                required
                leftIcon={<ArrowUpDown className="h-4 w-4" />}
                helperText="Define the cardinality of the relationship"
              />

              {sourceItemType && targetItemType && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Relationship Preview</h4>
                  <div className="flex items-center space-x-3 text-sm">
                    <Badge variant="primary">{sourceItemType.label}</Badge>
                    <ArrowRight className="h-4 w-4 text-gray-600" />
                    <Badge variant="secondary">{targetItemType.label}</Badge>
                    <Badge variant="secondary" size="sm">
                      {formData.associationType}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      }

      case 2:
        return (
          <Card>
            <CardHeader
              title="Configuration"
              subtitle="Set rules and quantity limits"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Minimum Quantity"
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: parseInt(e.target.value) || 0 }))}
                    min="0"
                    required
                    leftIcon={<Hash className="h-4 w-4" />}
                    helperText="Minimum number of associated items"
                  />
                </div>

                <div>
                  <Input
                    label="Maximum Quantity"
                    type="number"
                    value={formData.maxQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxQuantity: parseInt(e.target.value) || 1 }))}
                    min={formData.minQuantity}
                    required
                    leftIcon={<Hash className="h-4 w-4" />}
                    helperText="Maximum number of associated items"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={formData.isRequired}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isRequired" className="text-sm font-medium text-gray-700">
                  This association is required
                </label>
              </div>
            </div>
          </Card>
        );

      case 3: {
        const sourceItemType = mockItemTypes.find(t => t.value === formData.sourceItemTypeId);
        const targetItemType = mockItemTypes.find(t => t.value === formData.targetItemTypeId);

        return (
          <Card>
            <CardHeader
              title="Review & Confirm"
              subtitle="Please review your association details before creating"
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
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Relationship</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">From:</span>
                      <Badge variant="primary">{sourceItemType?.label}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">To:</span>
                      <Badge variant="secondary">{targetItemType?.label}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Type:</span>
                      <Badge variant="secondary">{formData.associationType}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Required</span>
                    <span className="text-sm text-gray-600">{formData.isRequired ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Min Quantity</span>
                    <span className="text-sm text-gray-600">{formData.minQuantity}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Max Quantity</span>
                    <span className="text-sm text-gray-600">{formData.maxQuantity}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      }

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
              Create Association
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
