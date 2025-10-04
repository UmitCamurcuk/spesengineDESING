import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileText, ArrowRight, Check } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Stepper } from '../../components/ui/Stepper';
import { AttributeTypeCard } from '../../components/ui/AttributeTypeCard';
import { AttributeGroupSelector } from '../../components/ui/AttributeGroupSelector';
import { AttributeRenderer } from '../../components/attributes/AttributeRenderer';
import { AttributeType } from '../../types';

const steps = [
  { id: 'basic', name: 'Basic Info', description: 'Name and description' },
  { id: 'type', name: 'Data Type', description: 'Choose attribute type' },
  { id: 'validation', name: 'Validation', description: 'Set validation rules' },
  { id: 'groups', name: 'Groups', description: 'Assign to groups' },
  { id: 'preview', name: 'Preview', description: 'Review and confirm' },
];

// Mock attribute groups
const mockAttributeGroups = [
  {
    id: 'group-1',
    name: 'Basic Product Info',
    description: 'Essential product information',
    attributeCount: 5
  },
  {
    id: 'group-2',
    name: 'Physical Properties',
    description: 'Weight, dimensions, material properties',
    attributeCount: 8
  },
  {
    id: 'group-3',
    name: 'Marketing Information',
    description: 'SEO, promotional content, tags',
    attributeCount: 6
  },
  {
    id: 'group-4',
    name: 'Technical Specifications',
    description: 'Technical details and requirements',
    attributeCount: 12
  }
];

const getValidationFields = (type: AttributeType) => {
  switch (type) {
    case AttributeType.TEXT:
      return [
        { key: 'minLength', label: 'Minimum Length', type: 'number', placeholder: '0' },
        { key: 'maxLength', label: 'Maximum Length', type: 'number', placeholder: '255' },
        { key: 'pattern', label: 'Regex Pattern', type: 'text', placeholder: '^[a-zA-Z]+$' },
        { key: 'allowEmpty', label: 'Allow Empty', type: 'boolean' }
      ];
    case AttributeType.NUMBER:
      return [
        { key: 'min', label: 'Minimum Value', type: 'number', placeholder: '0' },
        { key: 'max', label: 'Maximum Value', type: 'number', placeholder: '100' },
        { key: 'allowNegative', label: 'Allow Negative', type: 'boolean' },
        { key: 'allowZero', label: 'Allow Zero', type: 'boolean' },
        { key: 'decimalPlaces', label: 'Decimal Places', type: 'number', placeholder: '2' }
      ];
    case AttributeType.DATE:
    case AttributeType.DATETIME:
      return [
        { key: 'minDate', label: 'Minimum Date', type: 'date' },
        { key: 'maxDate', label: 'Maximum Date', type: 'date' },
        { key: 'allowPast', label: 'Allow Past Dates', type: 'boolean' },
        { key: 'allowFuture', label: 'Allow Future Dates', type: 'boolean' }
      ];
    case AttributeType.SELECT:
    case AttributeType.MULTISELECT:
      return [
        { key: 'minSelections', label: 'Minimum Selections', type: 'number', placeholder: '1' },
        { key: 'maxSelections', label: 'Maximum Selections', type: 'number', placeholder: '5' }
      ];
    case AttributeType.TABLE:
      return [
        { key: 'minRows', label: 'Minimum Rows', type: 'number', placeholder: '1' },
        { key: 'maxRows', label: 'Maximum Rows', type: 'number', placeholder: '100' },
        { key: 'allowAddRows', label: 'Allow Adding Rows', type: 'boolean' },
        { key: 'allowDeleteRows', label: 'Allow Deleting Rows', type: 'boolean' },
        { key: 'columns', label: 'Table Columns', type: 'textarea', placeholder: 'Enter column definitions (JSON format)' }
      ];
    case AttributeType.FILE:
    case AttributeType.IMAGE:
    case AttributeType.ATTACHMENT:
      return [
        { key: 'maxFileSize', label: 'Max File Size (MB)', type: 'number', placeholder: '10' },
        { key: 'allowedTypes', label: 'Allowed File Types', type: 'text', placeholder: '.jpg,.png,.pdf' },
        { key: 'maxFiles', label: 'Maximum Files', type: 'number', placeholder: '1' }
      ];
    case AttributeType.RICH_TEXT:
      return [
        { key: 'minLength', label: 'Minimum Length', type: 'number', placeholder: '0' },
        { key: 'maxLength', label: 'Maximum Length', type: 'number', placeholder: '5000' },
        { key: 'allowHTML', label: 'Allow HTML Tags', type: 'boolean' }
      ];
    case AttributeType.RATING:
      return [
        { key: 'minRating', label: 'Minimum Rating', type: 'number', placeholder: '1' },
        { key: 'maxRating', label: 'Maximum Rating', type: 'number', placeholder: '5' },
        { key: 'allowHalfStars', label: 'Allow Half Stars', type: 'boolean' }
      ];
    case AttributeType.COLOR:
      return [
        { key: 'format', label: 'Color Format', type: 'select', options: ['hex', 'rgb', 'hsl'] },
        { key: 'allowTransparency', label: 'Allow Transparency', type: 'boolean' }
      ];
    default:
      return [];
  }
};

export const AttributesCreate: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '' as AttributeType,
    required: false,
    options: [] as string[],
    defaultValue: '',
    validation: {} as Record<string, any>,
    attributeGroups: [] as string[]
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
      navigate('/attributes');
    }, 2000);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim() !== '';
      case 1:
        return formData.type !== '';
      case 2:
        return true; // Validation is optional
      case 3:
        return formData.attributeGroups.length > 0;
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
              title="Basic Information" 
              subtitle="Define the fundamental properties of your attribute"
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <Input
                    label="Attribute Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter attribute name"
                    required
                  />
                  <Input
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this attribute represents"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="required"
                      checked={formData.required}
                      onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="required" className="text-sm font-medium text-foreground">
                      This attribute is required
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardHeader 
              title="Choose Data Type" 
              subtitle="Select the type of data this attribute will store"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.values(AttributeType).map(type => (
                <AttributeTypeCard
                  key={type}
                  type={type}
                  selected={formData.type === type}
                  onClick={() => setFormData(prev => ({ ...prev, type }))}
                />
              ))}
            </div>
          </Card>
        );

      case 2:
        const validationFields = getValidationFields(formData.type);
        return (
          <Card>
            <CardHeader 
              title="Validation Rules" 
              subtitle="Configure validation constraints for this attribute"
            />
            {validationFields.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {validationFields.map(field => (
                  <div key={field.key}>
                    {field.type === 'boolean' ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={field.key}
                          checked={formData.validation[field.key] || false}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            validation: { ...prev.validation, [field.key]: e.target.checked }
                          }))}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <label htmlFor={field.key} className="text-sm font-medium text-foreground">
                          {field.label}
                        </label>
                      </div>
                    ) : field.type === 'select' ? (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          {field.label}
                        </label>
                        <select
                          value={formData.validation[field.key] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            validation: { ...prev.validation, [field.key]: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="">Select {field.label}</option>
                          {field.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    ) : field.type === 'textarea' ? (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          {field.label}
                        </label>
                        <textarea
                          value={formData.validation[field.key] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            validation: { ...prev.validation, [field.key]: e.target.value }
                          }))}
                          placeholder={field.placeholder}
                          rows={4}
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    ) : (
                      <Input
                        label={field.label}
                        type={field.type}
                        value={formData.validation[field.key] || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          validation: { ...prev.validation, [field.key]: e.target.value }
                        }))}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No validation rules available for this attribute type</p>
              </div>
            )}
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader 
              title="Assign to Attribute Groups" 
              subtitle="Select which attribute groups this attribute belongs to"
            />
            <AttributeGroupSelector
              groups={mockAttributeGroups}
              selectedGroups={formData.attributeGroups}
              onSelectionChange={(groups) => setFormData(prev => ({ ...prev, attributeGroups: groups }))}
            />
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader 
              title="Review & Confirm" 
              subtitle="Please review your attribute details before creating"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Basic Information</h4>
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">Name:</span> {formData.name}</p>
                    <p><span className="text-muted-foreground">Type:</span> {formData.type}</p>
                    <p><span className="text-muted-foreground">Required:</span> {formData.required ? 'Yes' : 'No'}</p>
                    {formData.description && (
                      <p><span className="text-muted-foreground">Description:</span> {formData.description}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Attribute Groups</h4>
                  <div className="space-y-1">
                    {formData.attributeGroups.map(groupId => {
                      const group = mockAttributeGroups.find(g => g.id === groupId);
                      return group ? (
                        <p key={groupId} className="text-sm text-muted-foreground">• {group.name}</p>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
              
              {Object.keys(formData.validation).length > 0 && (
                <div className="border-t border-border pt-6">
                  <h4 className="text-sm font-medium text-foreground mb-4">Validation Rules</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(formData.validation).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-6">
                <h4 className="text-sm font-medium text-foreground mb-4">Preview</h4>
                <div className="p-6 border-2 border-dashed border-border rounded-lg bg-muted">
                  <AttributeRenderer
                    attribute={{
                      id: 'preview',
                      name: formData.name,
                      type: formData.type,
                      required: formData.required,
                      description: formData.description,
                      options: formData.options.length > 0 ? formData.options : undefined,
                      defaultValue: formData.defaultValue || undefined,
                      validation: formData.validation,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    }}
                    value={formData.defaultValue}
                    mode="edit"
                    onChange={() => {}}
                  />
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
    <div className="space-y-6 flex flex-col" style={{ height: '-webkit-fill-available' }}>
      {/* Stepper */}
      <Card padding="lg">
        <Stepper steps={steps} currentStep={currentStep} />
      </Card>

      {/* Main Content Card */}
      <Card className="flex-1 flex flex-col">
        {/* Step Content */}
        <div className="flex-1 overflow-hidden">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-border flex-shrink-0">
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
                Create Attribute
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
      </Card>
    </div>
  );
};