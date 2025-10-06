import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, ArrowRight, Check } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Stepper } from '../../components/ui/Stepper';
import { AttributeTypeCard } from '../../components/ui/AttributeTypeCard';
import { AttributeGroupSelector } from '../../components/ui/AttributeGroupSelector';
import { AttributeRenderer } from '../../components/attributes/AttributeRenderer';
import { AttributeType } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';

// Steps will be defined inside component to use translations

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
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const steps = [
    { id: 'basic', name: t('attributes.create.steps.basic_info'), description: t('attributes.create.steps.basic_info_description') },
    { id: 'type', name: t('attributes.create.steps.data_type'), description: t('attributes.create.steps.data_type_description') },
    { id: 'validation', name: t('attributes.create.steps.validation'), description: t('attributes.create.steps.validation_description') },
    { id: 'default', name: t('attributes.create.steps.default_value'), description: t('attributes.create.steps.default_value_description') },
    { id: 'preview', name: t('attributes.create.steps.preview'), description: t('attributes.create.steps.preview_description') },
  ];
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
    
    // Mock validation and save
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showToast(t('attributes.create.attribute_created_successfully'), 'success');
      navigate('/attributes');
    } catch (error) {
      showToast(t('attributes.create.failed_to_create_attribute'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderDefaultValueInput = () => {
    const { type } = formData;
    
    switch (type) {
      case AttributeType.NUMBER:
        return (
          <Input
            label={t('attributes.create.default_value')}
            type="number"
            value={formData.defaultValue}
            onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
            placeholder="0"
          />
        );
      
      case AttributeType.BOOLEAN:
        return (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t('attributes.create.default_value')}
            </label>
            <select
              value={formData.defaultValue}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">{t('attributes.create.no_default')}</option>
              <option value="true">{t('common.yes')}</option>
              <option value="false">{t('common.no')}</option>
            </select>
          </div>
        );
      
      case AttributeType.DATE:
        return (
          <Input
            label={t('attributes.create.default_value')}
            type="date"
            value={formData.defaultValue}
            onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
            placeholder="YYYY-MM-DD"
          />
        );
      
      case AttributeType.DATETIME:
        return (
          <Input
            label={t('attributes.create.default_value')}
            type="datetime-local"
            value={formData.defaultValue}
            onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
            placeholder="YYYY-MM-DDTHH:MM"
          />
        );
      
      case AttributeType.TIME:
        return (
          <Input
            label={t('attributes.create.default_value')}
            type="time"
            value={formData.defaultValue}
            onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
            placeholder="HH:MM"
          />
        );
      
      case AttributeType.SELECT:
      case AttributeType.MULTISELECT:
        return (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t('attributes.create.default_value')}
            </label>
            <div className="p-4 bg-muted rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                {t('attributes.create.select_options_required')}
              </p>
            </div>
          </div>
        );
      
      case AttributeType.RICH_TEXT:
        return (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t('attributes.create.default_value')}
            </label>
            <textarea
              value={formData.defaultValue}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
              placeholder={t('attributes.create.rich_text_placeholder')}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        );
      
      case AttributeType.JSON:
        return (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t('attributes.create.default_value')}
            </label>
            <textarea
              value={formData.defaultValue}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
              placeholder={t('attributes.create.json_placeholder')}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('attributes.create.json_help')}
            </p>
          </div>
        );
      
      case AttributeType.FILE:
      case AttributeType.IMAGE:
      case AttributeType.ATTACHMENT:
        return (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t('attributes.create.default_value')}
            </label>
            <div className="p-4 bg-muted rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">
                {t('attributes.create.file_default_not_supported')}
              </p>
            </div>
          </div>
        );
      
      case AttributeType.RATING:
        return (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t('attributes.create.default_value')}
            </label>
            <select
              value={formData.defaultValue}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">{t('attributes.create.no_default')}</option>
              <option value="1">1 ⭐</option>
              <option value="2">2 ⭐⭐</option>
              <option value="3">3 ⭐⭐⭐</option>
              <option value="4">4 ⭐⭐⭐⭐</option>
              <option value="5">5 ⭐⭐⭐⭐⭐</option>
            </select>
          </div>
        );
      
      case AttributeType.COLOR:
        return (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t('attributes.create.default_value')}
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData.defaultValue || '#000000'}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
                className="w-12 h-10 border border-border rounded cursor-pointer"
              />
              <Input
                value={formData.defaultValue}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>
        );
      
      case AttributeType.OBJECT:
      case AttributeType.ARRAY:
        return (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t('attributes.create.default_value')}
            </label>
            <textarea
              value={formData.defaultValue}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
              placeholder={t('attributes.create.json_placeholder')}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('attributes.create.json_help')}
            </p>
          </div>
        );
      
      case AttributeType.FORMULA:
      case AttributeType.EXPRESSION:
        return (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t('attributes.create.formula_expression')}
            </label>
            <textarea
              value={formData.defaultValue}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
              placeholder={t('attributes.create.formula_placeholder')}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('attributes.create.formula_help')}
            </p>
          </div>
        );
      
      default:
        return (
          <Input
            label={t('attributes.create.default_value')}
            value={formData.defaultValue}
            onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
            placeholder={t('attributes.create.default_value_placeholder')}
          />
        );
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim() !== '' && formData.attributeGroups.length > 0;
      case 1:
        return formData.type !== '';
      case 2:
        return true; // Default value is optional
      case 3:
        return true; // Validation is optional
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
              title={t('attributes.create.basic_information')} 
              subtitle={t('attributes.create.basic_information_subtitle')}
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <Input
                    label={t('attributes.create.attribute_name')}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('attributes.create.attribute_name_placeholder')}
                    required
                  />
                  <Input
                    label={t('attributes.create.description')}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('attributes.create.description_placeholder')}
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
                      {t('attributes.create.this_attribute_is_required')}
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Attribute Groups Selection */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">{t('attributes.create.attribute_groups')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('attributes.create.attribute_groups_subtitle')}
                </p>
                <AttributeGroupSelector
                  groups={mockAttributeGroups}
                  selectedGroups={formData.attributeGroups}
                  onSelectionChange={(groups) => setFormData(prev => ({ ...prev, attributeGroups: groups }))}
                />
              </div>
            </div>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardHeader 
              title={t('attributes.create.choose_data_type')} 
              subtitle={t('attributes.create.choose_data_type_subtitle')}
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
              title={t('attributes.create.validation_rules')} 
              subtitle={t('attributes.create.validation_rules_subtitle')}
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
                          {(field as any).options?.map((option: string) => (
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
                <p className="text-sm text-muted-foreground">{t('attributes.create.no_validation_rules')}</p>
              </div>
            )}
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader 
              title={t('attributes.create.default_value')} 
              subtitle={t('attributes.create.default_value_subtitle')}
            />
            <div className="space-y-6">
              <div className="max-w-md">
                {renderDefaultValueInput()}
                <p className="text-sm text-muted-foreground mt-2">
                  {t('attributes.create.default_value_help')}
                </p>
              </div>
              
              {formData.defaultValue && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="text-sm font-medium text-foreground mb-2">{t('attributes.create.preview')}</h4>
                  <div className="text-sm text-muted-foreground">
                    {t('attributes.create.default')}: <span className="font-mono bg-background px-2 py-1 rounded">{formData.defaultValue}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader 
              title={t('attributes.create.review_confirm')} 
              subtitle={t('attributes.create.review_confirm_subtitle')}
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">{t('attributes.create.basic_information_summary')}</h4>
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">{t('attributes.create.name')}:</span> {formData.name}</p>
                    <p><span className="text-muted-foreground">{t('attributes.create.type')}:</span> {formData.type}</p>
                    <p><span className="text-muted-foreground">{t('attributes.create.required')}:</span> {formData.required ? t('common.yes') : t('common.no')}</p>
                    {formData.description && (
                      <p><span className="text-muted-foreground">{t('attributes.create.description')}:</span> {formData.description}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">{t('attributes.create.attribute_groups_summary')}</h4>
                  <div className="space-y-1">
                    {formData.attributeGroups.length > 0 ? (
                      formData.attributeGroups.map(groupId => {
                        const group = mockAttributeGroups.find(g => g.id === groupId);
                        return group ? (
                          <p key={groupId} className="text-sm text-muted-foreground">• {group.name}</p>
                        ) : null;
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">{t('attributes.create.no_groups_selected')}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {Object.keys(formData.validation).length > 0 && (
                <div className="border-t border-border pt-6">
                  <h4 className="text-sm font-medium text-foreground mb-4">{t('attributes.create.validation_rules_summary')}</h4>
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
                <h4 className="text-sm font-medium text-foreground mb-4">{t('attributes.create.preview')}</h4>
                <div className="p-6 border-2 border-dashed border-border rounded-lg bg-muted">
                  <AttributeRenderer
                    attribute={{
                      id: 'preview',
                      name: formData.name,
                      type: formData.type as any,
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
        return (
          <Card>
            <CardHeader 
              title={t('attributes.create.review_confirm')} 
              subtitle={t('attributes.create.review_confirm_subtitle')}
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">{t('attributes.create.basic_information_summary')}</h4>
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">{t('attributes.create.name')}:</span> {formData.name}</p>
                    <p><span className="text-muted-foreground">{t('attributes.create.type')}:</span> {formData.type}</p>
                    <p><span className="text-muted-foreground">{t('attributes.create.required')}:</span> {formData.required ? t('common.yes') : t('common.no')}</p>
                    {formData.description && (
                      <p><span className="text-muted-foreground">{t('attributes.create.description')}:</span> {formData.description}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">{t('attributes.create.attribute_groups_summary')}</h4>
                  <div className="space-y-1">
                    {formData.attributeGroups.length > 0 ? (
                      formData.attributeGroups.map(groupId => {
                      const group = mockAttributeGroups.find(g => g.id === groupId);
                      return group ? (
                          <p key={groupId} className="text-sm text-muted-foreground">• {group.name}</p>
                      ) : null;
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">{t('attributes.create.no_groups_selected')}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {Object.keys(formData.validation).length > 0 && (
                <div className="border-t border-border pt-6">
                  <h4 className="text-sm font-medium text-foreground mb-4">{t('attributes.create.validation_rules_summary')}</h4>
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
                <h4 className="text-sm font-medium text-foreground mb-4">{t('attributes.create.preview')}</h4>
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
{t('attributes.create.create_attribute')}
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