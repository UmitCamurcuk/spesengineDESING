import React, { useCallback, useMemo, useState } from 'react';
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
import { attributesService } from '../../api/services/attributes.service';
import { localizationsService } from '../../api/services/localizations.service';

type ValidationField =
  | { key: string; label: string; type: 'number' | 'text'; placeholder?: string }
  | { key: string; label: string; type: 'boolean' }
  | { key: string; label: string; type: 'date' }
  | { key: string; label: string; type: 'select'; options: string[] }
  | { key: string; label: string; type: 'textarea'; placeholder?: string };

const mockAttributeGroups = [
  {
    id: 'group-1',
    name: 'Basic Product Info',
    description: 'Essential product information',
    attributeCount: 5,
  },
  {
    id: 'group-2',
    name: 'Physical Properties',
    description: 'Weight, dimensions, material properties',
    attributeCount: 8,
  },
  {
    id: 'group-3',
    name: 'Marketing Information',
    description: 'SEO, promotional content, tags',
    attributeCount: 6,
  },
  {
    id: 'group-4',
    name: 'Technical Specifications',
    description: 'Technical details and requirements',
    attributeCount: 12,
  },
];

const OPTION_BASED_TYPES = new Set<AttributeType>([
  AttributeType.SELECT,
  AttributeType.MULTISELECT,
]);

const getValidationFields = (type: AttributeType): ValidationField[] => {
  switch (type) {
    case AttributeType.TEXT:
      return [
        { key: 'minLength', label: 'Minimum Length', type: 'number', placeholder: '0' },
        { key: 'maxLength', label: 'Maximum Length', type: 'number', placeholder: '255' },
        { key: 'pattern', label: 'Regex Pattern', type: 'text', placeholder: '^[a-zA-Z]+$' },
        { key: 'allowEmpty', label: 'Allow Empty', type: 'boolean' },
      ];
    case AttributeType.NUMBER:
      return [
        { key: 'min', label: 'Minimum Value', type: 'number', placeholder: '0' },
        { key: 'max', label: 'Maximum Value', type: 'number', placeholder: '100' },
        { key: 'allowNegative', label: 'Allow Negative', type: 'boolean' },
        { key: 'allowZero', label: 'Allow Zero', type: 'boolean' },
        { key: 'decimalPlaces', label: 'Decimal Places', type: 'number', placeholder: '2' },
      ];
    case AttributeType.DATE:
    case AttributeType.DATETIME:
      return [
        { key: 'minDate', label: 'Minimum Date', type: 'date' },
        { key: 'maxDate', label: 'Maximum Date', type: 'date' },
        { key: 'allowPast', label: 'Allow Past Dates', type: 'boolean' },
        { key: 'allowFuture', label: 'Allow Future Dates', type: 'boolean' },
      ];
    case AttributeType.SELECT:
    case AttributeType.MULTISELECT:
      return [
        { key: 'minSelections', label: 'Minimum Selections', type: 'number', placeholder: '1' },
        { key: 'maxSelections', label: 'Maximum Selections', type: 'number', placeholder: '5' },
      ];
    case AttributeType.TABLE:
      return [
        { key: 'minRows', label: 'Minimum Rows', type: 'number', placeholder: '1' },
        { key: 'maxRows', label: 'Maximum Rows', type: 'number', placeholder: '100' },
        { key: 'allowAddRows', label: 'Allow Adding Rows', type: 'boolean' },
        { key: 'allowDeleteRows', label: 'Allow Deleting Rows', type: 'boolean' },
        {
          key: 'columns',
          label: 'Table Columns',
          type: 'textarea',
          placeholder: 'Enter column definitions (JSON format)',
        },
      ];
    case AttributeType.FILE:
    case AttributeType.IMAGE:
    case AttributeType.ATTACHMENT:
      return [
        { key: 'maxFileSize', label: 'Max File Size (MB)', type: 'number', placeholder: '10' },
        {
          key: 'allowedTypes',
          label: 'Allowed File Types',
          type: 'text',
          placeholder: '.jpg,.png,.pdf',
        },
        { key: 'maxFiles', label: 'Maximum Files', type: 'number', placeholder: '1' },
      ];
    case AttributeType.RICH_TEXT:
      return [
        { key: 'minLength', label: 'Minimum Length', type: 'number', placeholder: '0' },
        { key: 'maxLength', label: 'Maximum Length', type: 'number', placeholder: '5000' },
        { key: 'allowHTML', label: 'Allow HTML Tags', type: 'boolean' },
      ];
    case AttributeType.RATING:
      return [
        { key: 'minRating', label: 'Minimum Rating', type: 'number', placeholder: '1' },
        { key: 'maxRating', label: 'Maximum Rating', type: 'number', placeholder: '5' },
        { key: 'allowHalfStars', label: 'Allow Half Stars', type: 'boolean' },
      ];
    case AttributeType.COLOR:
      return [
        { key: 'format', label: 'Color Format', type: 'select', options: ['hex', 'rgb', 'hsl'] },
        { key: 'allowTransparency', label: 'Allow Transparency', type: 'boolean' },
      ];
    default:
      return [];
  }
};

const parseOptions = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((option) => option.trim())
    .filter(Boolean);

const parseMultiValue = (value: string): string[] =>
  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const parseTags = (value: string): string[] =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const normalizeDefaultValue = (
  value: string,
  type: AttributeType,
  options: string[],
): unknown => {
  if (!value || value.trim().length === 0) {
    return undefined;
  }

  const trimmed = value.trim();

  switch (type) {
    case AttributeType.NUMBER:
    case AttributeType.RATING: {
      const parsed = Number(trimmed);
      if (Number.isNaN(parsed)) {
        throw new Error('Default value must be a valid number.');
      }
      return parsed;
    }
    case AttributeType.BOOLEAN: {
      if (trimmed !== 'true' && trimmed !== 'false') {
        throw new Error('Default value must be either true or false.');
      }
      return trimmed === 'true';
    }
    case AttributeType.SELECT: {
      if (!options.includes(trimmed)) {
        throw new Error('Default value must be one of the defined options.');
      }
      return trimmed;
    }
    case AttributeType.MULTISELECT: {
      const selections = parseMultiValue(trimmed);
      if (selections.length === 0) {
        throw new Error('Provide at least one selection for the default value.');
      }
      const invalid = selections.filter((selection) => !options.includes(selection));
      if (invalid.length > 0) {
        throw new Error('All default selections must match the defined options.');
      }
      return selections;
    }
    case AttributeType.JSON:
    case AttributeType.OBJECT:
    case AttributeType.ARRAY: {
      try {
        const parsed = JSON.parse(trimmed);
        if (type === AttributeType.ARRAY && !Array.isArray(parsed)) {
          throw new Error('Default value must be a valid JSON array.');
        }
        if (
          type === AttributeType.OBJECT &&
          (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
        ) {
          throw new Error('Default value must be a valid JSON object.');
        }
        return parsed;
      } catch (error) {
        throw new Error('Default value must be valid JSON.');
      }
    }
    default:
      return trimmed;
  }
};

const buildValidationRules = (rawRules: Record<string, any>): Record<string, unknown> | null => {
  const result: Record<string, unknown> = {};

  Object.entries(rawRules).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (typeof value === 'boolean') {
      result[key] = value;
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return;
      }
      if (/^(true|false)$/i.test(trimmed)) {
        result[key] = trimmed.toLowerCase() === 'true';
        return;
      }
      if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        const numeric = Number(trimmed);
        if (!Number.isNaN(numeric)) {
          result[key] = numeric;
          return;
        }
      }
      result[key] = trimmed;
      return;
    }

    result[key] = value;
  });

  return Object.keys(result).length === 0 ? null : result;
};

const buildUiSettings = (
  type: AttributeType,
  options: string[],
): Record<string, unknown> | undefined => {
  if (OPTION_BASED_TYPES.has(type)) {
    return { options };
  }
  return undefined;
};

const VALIDATION_STEPS = [0, 1, 3];

export const AttributesCreate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const steps = useMemo(
    () => [
      {
        id: 'basic',
        name: t('attributes.create.steps.basic_info'),
        description: t('attributes.create.steps.basic_info_description'),
      },
      {
        id: 'type',
        name: t('attributes.create.steps.data_type'),
        description: t('attributes.create.steps.data_type_description'),
      },
      {
        id: 'validation',
        name: t('attributes.create.steps.validation'),
        description: t('attributes.create.steps.validation_description'),
      },
      {
        id: 'default',
        name: t('attributes.create.steps.default_value'),
        description: t('attributes.create.steps.default_value_description'),
      },
      {
        id: 'preview',
        name: t('attributes.create.steps.preview'),
        description: t('attributes.create.steps.preview_description'),
      },
    ],
    [t],
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [optionsInput, setOptionsInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    type: '' as AttributeType,
    required: false,
    unique: false,
    options: [] as string[],
    defaultValue: '',
    validation: {} as Record<string, any>,
    attributeGroups: [] as string[],
    tags: [] as string[],
  });

  const translateError = useCallback(
    (key: string, fallback: string) => {
      const translated = t(key);
      return translated === key ? fallback : translated;
    },
    [t],
  );

  const clearError = useCallback((field: string) => {
    setFormErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const getStepErrors = useCallback(
    (step: number): Record<string, string> => {
      const errors: Record<string, string> = {};

      if (step === 0) {
        const key = formData.key.trim();
        if (!key) {
          errors.key = translateError(
            'attributes.create.errors.key_required',
            'Attribute key is required.',
          );
        } else if (!/^[a-z0-9_.-]+$/.test(key)) {
          errors.key = translateError(
            'attributes.create.errors.key_invalid',
            'Use letters, numbers, dot, underscore or hyphen.',
          );
        }

        if (!formData.name.trim()) {
          errors.name = translateError(
            'attributes.create.errors.name_tr_required',
            'Display name (Turkish) is required.',
          );
        }

        if (!formData.nameEn.trim()) {
          errors.nameEn = translateError(
            'attributes.create.errors.name_en_required',
            'Display name (English) is required.',
          );
        }

        if (formData.attributeGroups.length === 0) {
          errors.attributeGroups = translateError(
            'attributes.create.errors.attribute_group_required',
            'Select at least one attribute group.',
          );
        }
      }

      if (step === 1) {
        if (!formData.type) {
          errors.type = translateError(
            'attributes.create.errors.type_required',
            'Please choose a data type.',
          );
        }

        if (OPTION_BASED_TYPES.has(formData.type) && formData.options.length === 0) {
          errors.options = translateError(
            'attributes.create.errors.options_required',
            'Enter at least one option (one per line).',
          );
        }
      }

      if (step === 3) {
        if (!formData.type) {
          return errors;
        }

        if (formData.defaultValue.trim().length === 0) {
          return errors;
        }

        try {
          normalizeDefaultValue(formData.defaultValue, formData.type, formData.options);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Default value is not valid.';
          errors.defaultValue = translateError(
            'attributes.create.errors.default_value_invalid',
            message,
          );
        }
      }

      return errors;
    },
    [formData, translateError],
  );

  const recomputeErrors = useCallback(() => {
    return VALIDATION_STEPS.reduce<Record<string, string>>((acc, step) => {
      return { ...acc, ...getStepErrors(step) };
    }, {});
  }, [getStepErrors]);

  const validateStep = (step: number): boolean => {
    const stepErrors = getStepErrors(step);
    const combinedErrors = recomputeErrors();
    setFormErrors(combinedErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const validateBeforeSubmit = (): boolean => {
    const combinedErrors = recomputeErrors();
    setFormErrors(combinedErrors);
    return Object.keys(combinedErrors).length === 0;
  };

  const handleTypeSelect = (type: AttributeType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      options: OPTION_BASED_TYPES.has(type) ? prev.options : [],
      defaultValue: '',
    }));
    if (!OPTION_BASED_TYPES.has(type)) {
      setOptionsInput('');
      clearError('options');
    }
    clearError('type');
    clearError('defaultValue');
  };

  const handleOptionsChange = (value: string) => {
    setOptionsInput(value);
    setFormData((prev) => ({
      ...prev,
      options: parseOptions(value),
    }));
    clearError('options');
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    setFormData((prev) => ({
      ...prev,
      tags: parseTags(value),
    }));
  };

  const canProceed = (): boolean => {
    if (loading) {
      return false;
    }
    if (currentStep === steps.length - 1) {
      return true;
    }
    if (currentStep === 2) {
      return true;
    }
    const stepErrors = getStepErrors(currentStep);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const renderDefaultValueInput = () => {
    const { type, defaultValue } = formData;

    switch (type) {
      case AttributeType.NUMBER:
      case AttributeType.RATING:
        return (
          <Input
            label={t('attributes.create.default_value')}
            type="number"
            value={defaultValue}
            onChange={(e) => {
              clearError('defaultValue');
              setFormData((prev) => ({ ...prev, defaultValue: e.target.value }));
            }}
            placeholder="0"
            error={formErrors.defaultValue}
          />
        );
      case AttributeType.BOOLEAN:
        return (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t('attributes.create.default_value')}
            </label>
            <select
              value={defaultValue}
              onChange={(e) => {
                clearError('defaultValue');
                setFormData((prev) => ({ ...prev, defaultValue: e.target.value }));
              }}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">{t('attributes.create.no_default')}</option>
              <option value="true">{t('common.yes')}</option>
              <option value="false">{t('common.no')}</option>
            </select>
            {formErrors.defaultValue && (
              <p className="text-xs text-error mt-1">{formErrors.defaultValue}</p>
            )}
          </div>
        );
      case AttributeType.DATE:
        return (
          <Input
            label={t('attributes.create.default_value')}
            type="date"
            value={defaultValue}
            onChange={(e) => {
              clearError('defaultValue');
              setFormData((prev) => ({ ...prev, defaultValue: e.target.value }));
            }}
            error={formErrors.defaultValue}
          />
        );
      case AttributeType.DATETIME:
        return (
          <Input
            label={t('attributes.create.default_value')}
            type="datetime-local"
            value={defaultValue}
            onChange={(e) => {
              clearError('defaultValue');
              setFormData((prev) => ({ ...prev, defaultValue: e.target.value }));
            }}
            error={formErrors.defaultValue}
          />
        );
      case AttributeType.TIME:
        return (
          <Input
            label={t('attributes.create.default_value')}
            type="time"
            value={defaultValue}
            onChange={(e) => {
              clearError('defaultValue');
              setFormData((prev) => ({ ...prev, defaultValue: e.target.value }));
            }}
            error={formErrors.defaultValue}
          />
        );
      case AttributeType.SELECT:
        return (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t('attributes.create.default_value')}
            </label>
            <select
              value={defaultValue}
              onChange={(e) => {
                clearError('defaultValue');
                setFormData((prev) => ({ ...prev, defaultValue: e.target.value }));
              }}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">{t('attributes.create.no_default')}</option>
              {formData.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {formErrors.defaultValue && (
              <p className="text-xs text-error mt-1">{formErrors.defaultValue}</p>
            )}
          </div>
        );
      case AttributeType.MULTISELECT:
        return (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t('attributes.create.default_value')}
            </label>
            <textarea
              value={defaultValue}
              onChange={(e) => {
                clearError('defaultValue');
                setFormData((prev) => ({ ...prev, defaultValue: e.target.value }));
              }}
              placeholder={t('attributes.create.multiselect_default_placeholder')}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('attributes.create.multiselect_default_help')}
            </p>
            {formErrors.defaultValue && (
              <p className="text-xs text-error mt-1">{formErrors.defaultValue}</p>
            )}
          </div>
        );
      case AttributeType.RICH_TEXT:
        return (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t('attributes.create.default_value')}
            </label>
            <textarea
              value={defaultValue}
              onChange={(e) => {
                clearError('defaultValue');
                setFormData((prev) => ({ ...prev, defaultValue: e.target.value }));
              }}
              placeholder={t('attributes.create.rich_text_placeholder')}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
            {formErrors.defaultValue && (
              <p className="text-xs text-error mt-1">{formErrors.defaultValue}</p>
            )}
          </div>
        );
      case AttributeType.JSON:
      case AttributeType.OBJECT:
      case AttributeType.ARRAY:
        return (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t('attributes.create.default_value')}
            </label>
            <textarea
              value={defaultValue}
              onChange={(e) => {
                clearError('defaultValue');
                setFormData((prev) => ({ ...prev, defaultValue: e.target.value }));
              }}
              placeholder={t('attributes.create.json_placeholder')}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('attributes.create.json_help')}
            </p>
            {formErrors.defaultValue && (
              <p className="text-xs text-error mt-1">{formErrors.defaultValue}</p>
            )}
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
                value={defaultValue || '#000000'}
                onChange={(e) => {
                  clearError('defaultValue');
                  setFormData((prev) => ({ ...prev, defaultValue: e.target.value }));
                }}
                className="w-12 h-10 border border-border rounded cursor-pointer"
              />
              <Input
                value={defaultValue}
                onChange={(e) => {
                  clearError('defaultValue');
                  setFormData((prev) => ({ ...prev, defaultValue: e.target.value }));
                }}
                placeholder="#000000"
                className="flex-1"
                error={formErrors.defaultValue}
              />
            </div>
          </div>
        );
      default:
        return (
          <Input
            label={t('attributes.create.default_value')}
            value={defaultValue}
            onChange={(e) => {
              clearError('defaultValue');
              setFormData((prev) => ({ ...prev, defaultValue: e.target.value }));
            }}
            placeholder={t('attributes.create.default_value_placeholder')}
            error={formErrors.defaultValue}
          />
        );
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
                    label={t('attributes.create.attribute_key')}
                    value={formData.key}
                    onChange={(e) => {
                      clearError('key');
                      setFormData((prev) => ({
                        ...prev,
                        key: e.target.value.trim().toLowerCase(),
                      }));
                    }}
                    placeholder="product_name"
                    required
                    error={formErrors.key}
                    helperText={t('attributes.create.attribute_key_help')}
                  />

                  <Input
                    label={t('attributes.create.attribute_name_tr')}
                    value={formData.name}
                    onChange={(e) => {
                      clearError('name');
                      setFormData((prev) => ({ ...prev, name: e.target.value }));
                    }}
                    placeholder={t('attributes.create.attribute_name_placeholder')}
                    required
                    error={formErrors.name}
                  />

                  <Input
                    label={t('attributes.create.attribute_name_en')}
                    value={formData.nameEn}
                    onChange={(e) => {
                      clearError('nameEn');
                      setFormData((prev) => ({ ...prev, nameEn: e.target.value }));
                    }}
                    placeholder={t('attributes.create.attribute_name_en_placeholder')}
                    required
                    error={formErrors.nameEn}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        {t('attributes.create.description_tr')}
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder={t('attributes.create.description_placeholder')}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        {t('attributes.create.description_en')}
                      </label>
                      <textarea
                        value={formData.descriptionEn}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, descriptionEn: e.target.value }))
                        }
                        placeholder={t('attributes.create.description_placeholder')}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="inline-flex items-center space-x-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={formData.required}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, required: e.target.checked }))
                        }
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{t('attributes.create.this_attribute_is_required')}</span>
                    </label>

                    <label className="inline-flex items-center space-x-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={formData.unique}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, unique: e.target.checked }))
                        }
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{t('attributes.create.this_attribute_is_unique')}</span>
                    </label>
                  </div>

                  <Input
                    label={t('attributes.create.tags')}
                    value={tagsInput}
                    onChange={(e) => {
                      handleTagsChange(e.target.value);
                    }}
                    placeholder={t('attributes.create.tags_placeholder')}
                    helperText={t('attributes.create.tags_help')}
                  />
                </div>
              </div>

              <div className="mt-2">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {t('attributes.create.attribute_groups')}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('attributes.create.attribute_groups_subtitle')}
                </p>
                <AttributeGroupSelector
                  groups={mockAttributeGroups}
                  selectedGroups={formData.attributeGroups}
                  onSelectionChange={(groups) => {
                    clearError('attributeGroups');
                    setFormData((prev) => ({ ...prev, attributeGroups: groups }));
                  }}
                />
                {formErrors.attributeGroups && (
                  <p className="text-xs text-error mt-2">{formErrors.attributeGroups}</p>
                )}
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
              {Object.values(AttributeType).map((type) => (
                <AttributeTypeCard
                  key={type}
                  type={type}
                  selected={formData.type === type}
                  onClick={() => handleTypeSelect(type)}
                />
              ))}
            </div>
            {formErrors.type && (
              <p className="text-xs text-error mt-4">{formErrors.type}</p>
            )}

            {OPTION_BASED_TYPES.has(formData.type) && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('attributes.create.option_values')}
                </label>
                <textarea
                  value={optionsInput}
                  onChange={(e) => handleOptionsChange(e.target.value)}
                  placeholder={t('attributes.create.options_placeholder')}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('attributes.create.options_help')}
                </p>
                {formErrors.options && (
                  <p className="text-xs text-error mt-1">{formErrors.options}</p>
                )}
              </div>
            )}
          </Card>
        );

      case 2: {
        const validationFields = getValidationFields(formData.type);
        return (
          <Card>
            <CardHeader
              title={t('attributes.create.validation_rules')}
              subtitle={t('attributes.create.validation_rules_subtitle')}
            />
            {validationFields.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {validationFields.map((field) => (
                  <div key={field.key}>
                    {field.type === 'boolean' ? (
                      <label className="inline-flex items-center space-x-2 text-sm text-foreground">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.validation[field.key])}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              validation: { ...prev.validation, [field.key]: e.target.checked },
                            }))
                          }
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span>{field.label}</span>
                      </label>
                    ) : field.type === 'select' ? (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          {field.label}
                        </label>
                        <select
                          value={formData.validation[field.key] ?? ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              validation: { ...prev.validation, [field.key]: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="">
                            {t('attributes.create.select_placeholder', { field: field.label })}
                          </option>
                          {field.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : field.type === 'textarea' ? (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          {field.label}
                        </label>
                        <textarea
                          value={formData.validation[field.key] ?? ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              validation: { ...prev.validation, [field.key]: e.target.value },
                            }))
                          }
                          placeholder={field.placeholder}
                          rows={4}
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    ) : (
                      <Input
                        label={field.label}
                        type={field.type}
                        value={formData.validation[field.key] ?? ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            validation: { ...prev.validation, [field.key]: e.target.value },
                          }))
                        }
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {t('attributes.create.no_validation_rules')}
                </p>
              </div>
            )}
          </Card>
        );
      }

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
                <p className="text-xs text-muted-foreground mt-2">
                  {t('attributes.create.default_value_help')}
                </p>
              </div>
            </div>
          </Card>
        );

      case 4:
      default:
        return (
          <Card>
            <CardHeader
              title={t('attributes.create.review_confirm')}
              subtitle={t('attributes.create.review_confirm_subtitle')}
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    {t('attributes.create.basic_information_summary')}
                  </h4>
                  <p>
                    <span className="text-muted-foreground">
                      {t('attributes.create.attribute_key')}:
                    </span>{' '}
                    {formData.key || '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      {t('attributes.create.name_tr_summary')}:
                    </span>{' '}
                    {formData.name || '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      {t('attributes.create.name_en_summary')}:
                    </span>{' '}
                    {formData.nameEn || '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      {t('attributes.create.type')}:
                    </span>{' '}
                    {formData.type || '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      {t('attributes.create.required')}:
                    </span>{' '}
                    {formData.required ? t('common.yes') : t('common.no')}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      {t('attributes.create.unique')}:
                    </span>{' '}
                    {formData.unique ? t('common.yes') : t('common.no')}
                  </p>
                  {formData.tags.length > 0 && (
                    <p>
                      <span className="text-muted-foreground">
                        {t('attributes.create.tags')}:
                      </span>{' '}
                      {formData.tags.join(', ')}
                    </p>
                  )}
                  {formData.description && (
                    <p>
                      <span className="text-muted-foreground">
                        {t('attributes.create.description_tr')}:
                      </span>{' '}
                      {formData.description}
                    </p>
                  )}
                  {formData.descriptionEn && (
                    <p>
                      <span className="text-muted-foreground">
                        {t('attributes.create.description_en')}:
                      </span>{' '}
                      {formData.descriptionEn}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    {t('attributes.create.attribute_groups_summary')}
                  </h4>
                  <div className="space-y-1">
                    {formData.attributeGroups.length > 0 ? (
                      formData.attributeGroups.map((groupId) => {
                        const group = mockAttributeGroups.find((g) => g.id === groupId);
                        return group ? (
                          <p key={groupId} className="text-sm text-muted-foreground">
                            • {group.name}
                          </p>
                        ) : null;
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t('attributes.create.no_groups_selected')}
                      </p>
                    )}
                  </div>

                  {formData.options.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <h4 className="text-sm font-medium text-foreground mb-2">
                        {t('attributes.create.option_values')}
                      </h4>
                      <div className="space-y-1">
                        {formData.options.map((option) => (
                          <p key={option} className="text-sm text-muted-foreground">
                            • {option}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {Object.keys(formData.validation).length > 0 && (
                <div className="border-t border-border pt-6">
                  <h4 className="text-sm font-medium text-foreground mb-4">
                    {t('attributes.create.validation_rules_summary')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(formData.validation).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {typeof value === 'boolean' ? (value ? t('common.yes') : t('common.no')) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-6">
                <h4 className="text-sm font-medium text-foreground mb-4">
                  {t('attributes.create.preview')}
                </h4>
                <div className="p-6 border-2 border-dashed border-border rounded-lg bg-muted">
                  <AttributeRenderer
                    attribute={{
                      id: 'preview',
                      name: formData.name || formData.nameEn,
                      type: formData.type || AttributeType.TEXT,
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

  const handleSubmit = async () => {
    if (!validateBeforeSubmit()) {
      showToast({
        type: 'error',
        message:
          t('attributes.create.fix_errors_before_continue') ||
          'Please fix validation errors before continuing.',
      });
      const firstErrorStep = VALIDATION_STEPS.find(
        (step) => Object.keys(getStepErrors(step)).length > 0,
      );
      if (firstErrorStep !== undefined) {
        setCurrentStep(firstErrorStep);
      }
      return;
    }

    try {
      setLoading(true);

      const trimmedKey = formData.key.trim();
      const nameTr = formData.name.trim();
      const nameEn = formData.nameEn.trim() || nameTr;
      const descriptionTr = formData.description.trim();
      const descriptionEn = formData.descriptionEn.trim();

      const namespace = 'attributes';
      const nameLocalization = await localizationsService.create({
        namespace,
        key: `${trimmedKey}.name`,
        description: null,
        translations: {
          tr: nameTr,
          en: nameEn,
        },
      });

      let descriptionLocalizationId: string | undefined;
      if (descriptionTr || descriptionEn) {
        const descriptionLocalization = await localizationsService.create({
          namespace,
          key: `${trimmedKey}.description`,
          description: null,
          translations: {
            tr: descriptionTr || descriptionEn || nameTr,
            en: descriptionEn || descriptionTr || nameEn,
          },
        });
        descriptionLocalizationId = descriptionLocalization.id;
      }

      let defaultValue: unknown;
      try {
        defaultValue = normalizeDefaultValue(
          formData.defaultValue,
          formData.type,
          formData.options,
        );
      } catch (error) {
        setFormErrors((prev) => ({
          ...prev,
          defaultValue:
            error instanceof Error
              ? error.message
              : 'Default value is not valid for selected type.',
        }));
        setCurrentStep(3);
        return;
      }

      const validationRules = buildValidationRules(formData.validation);
      const uiSettings = buildUiSettings(formData.type, formData.options);

      const payload: Record<string, unknown> = {
        key: trimmedKey,
        type: formData.type,
        nameLocalizationId: nameLocalization.id,
        isRequired: formData.required,
        isUnique: formData.unique,
      };

      if (descriptionLocalizationId) {
        payload.descriptionLocalizationId = descriptionLocalizationId;
      }
      if (defaultValue !== undefined) {
        payload.defaultValue = defaultValue;
      }
      if (validationRules) {
        payload.validationRules = validationRules;
      }
      if (uiSettings) {
        payload.uiSettings = uiSettings;
      }
      if (formData.tags.length > 0) {
        payload.tags = formData.tags;
      }

      await attributesService.create(payload);

      showToast({
        type: 'success',
        message:
          t('attributes.create.attribute_created_successfully') ||
          'Attribute created successfully.',
      });
      navigate('/attributes');
    } catch (error: any) {
      console.error('Failed to create attribute', error);
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        t('attributes.create.failed_to_create_attribute');
      showToast({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      <Card padding="lg">
        <Stepper steps={steps} currentStep={currentStep} />
      </Card>

      <Card className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">{renderStepContent()}</div>

        <div className="flex justify-between pt-6 border-t border-border flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || loading}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            {t('common.back')}
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
                {t('common.continue')}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AttributesCreate;
