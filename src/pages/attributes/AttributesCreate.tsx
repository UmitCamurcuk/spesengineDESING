import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, ArrowRight, Check } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Stepper } from '../../components/ui/Stepper';
import { Badge } from '../../components/ui/Badge';
import { AttributeTypeCard } from '../../components/ui/AttributeTypeCard';
import { AttributeGroupSelector } from '../../components/ui/AttributeGroupSelector';
import { Switch } from '../../components/ui/Switch';
import { AttributeRenderer } from '../../components/attributes/AttributeRenderer';
import { AttributeType, AttributeGroup } from '../../types';
import { useRequiredLanguages } from '../../hooks/useRequiredLanguages';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { attributesService } from '../../api/services/attributes.service';
import { attributeGroupsService } from '../../api/services/attribute-groups.service';
import { localizationsService } from '../../api/services/localizations.service';
import { DEFAULT_PHONE_COUNTRY_CODE, PHONE_COUNTRY_CODES } from '../../constants/phoneCodes';
import type { CreateLocalizationRequest } from '../../api/types/api.types';
import { logosService } from '../../api/services/logos.service';

type ValidationField =
  | { key: string; label: string; type: 'number' | 'text'; placeholder?: string }
  | { key: string; label: string; type: 'boolean' }
  | { key: string; label: string; type: 'date' }
  | { key: string; label: string; type: 'select'; options: string[] }
  | { key: string; label: string; type: 'textarea'; placeholder?: string };

const OPTION_BASED_TYPES = new Set<AttributeType>([
  AttributeType.SELECT,
  AttributeType.MULTISELECT,
]);

type LocalizationState = Record<string, string>;
const PHONE_DEFAULT_INVALID_ERROR = 'PHONE_DEFAULT_INVALID';
const PHONE_DEFAULT_ERROR_FALLBACK =
  'Default phone value must include both a country code and number.';

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
    case AttributeType.URL:
      return [
        { key: 'requireHttps', label: 'Require HTTPS', type: 'boolean' },
        {
          key: 'allowedProtocols',
          label: 'Allowed Protocols',
          type: 'text',
          placeholder: 'https,http',
        },
        { key: 'maxLength', label: 'Maximum Length', type: 'number', placeholder: '2048' },
      ];
    case AttributeType.MONEY:
      return [
        { key: 'minAmount', label: 'Minimum Amount', type: 'number', placeholder: '0' },
        { key: 'maxAmount', label: 'Maximum Amount', type: 'number', placeholder: '100000' },
        {
          key: 'allowedCurrencies',
          label: 'Allowed Currencies',
          type: 'text',
          placeholder: 'TRY,USD,EUR',
        },
        { key: 'requireCurrency', label: 'Require Currency Code', type: 'boolean' },
      ];
    case AttributeType.REFERENCE:
      return [
        {
          key: 'allowedEntityTypes',
          label: 'Allowed Entity Types',
          type: 'text',
          placeholder: 'item,user,category',
        },
        { key: 'allowMultiple', label: 'Allow Multiple References', type: 'boolean' },
        {
          key: 'resolveStrategy',
          label: 'Resolve Strategy',
          type: 'select',
          options: ['id_only', 'id_and_label'],
        },
      ];
    case AttributeType.GEOPOINT:
      return [
        { key: 'minLat', label: 'Minimum Latitude', type: 'number', placeholder: '-90' },
        { key: 'maxLat', label: 'Maximum Latitude', type: 'number', placeholder: '90' },
        { key: 'minLng', label: 'Minimum Longitude', type: 'number', placeholder: '-180' },
        { key: 'maxLng', label: 'Maximum Longitude', type: 'number', placeholder: '180' },
        { key: 'precision', label: 'Precision (decimal places)', type: 'number', placeholder: '6' },
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
    case AttributeType.FORMULA:
    case AttributeType.EXPRESSION:
      return [
        { key: 'minLength', label: 'Minimum Length', type: 'number', placeholder: '0' },
        { key: 'maxLength', label: 'Maximum Length', type: 'number', placeholder: '4000' },
        { key: 'pattern', label: 'Regex Pattern', type: 'text', placeholder: '^[A-Z0-9_()+\\-*\\/ ]+$' },
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

type PhoneDefaultValue = {
  countryCode: string;
  number: string;
};

const createPhoneDefaultValue = (): PhoneDefaultValue => ({
  countryCode: DEFAULT_PHONE_COUNTRY_CODE,
  number: '',
});

const serializePhoneDefaultValue = (value: PhoneDefaultValue): string => JSON.stringify(value);

const parsePhoneDefaultValue = (raw: string): PhoneDefaultValue => {
  if (!raw) {
    return createPhoneDefaultValue();
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      countryCode:
        typeof parsed.countryCode === 'string' && parsed.countryCode.trim().length > 0
          ? parsed.countryCode.trim()
          : DEFAULT_PHONE_COUNTRY_CODE,
      number: typeof parsed.number === 'string' ? parsed.number.trim() : '',
    };
  } catch {
    return createPhoneDefaultValue();
  }
};

type MoneyDefaultValue = {
  amount: string;
  currency: string;
};

const createMoneyDefaultValue = (): MoneyDefaultValue => ({
  amount: '',
  currency: 'TRY',
});

const serializeMoneyDefaultValue = (value: MoneyDefaultValue): string =>
  JSON.stringify({
    amount: value.amount ?? '',
    currency: (value.currency ?? '').trim(),
  });

const parseMoneyDefaultValue = (raw: string): MoneyDefaultValue => {
  if (!raw) {
    return createMoneyDefaultValue();
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      amount:
        typeof parsed.amount === 'number'
          ? parsed.amount.toString()
          : typeof parsed.amount === 'string'
            ? parsed.amount
            : '',
      currency:
        typeof parsed.currency === 'string' && parsed.currency.trim().length > 0
          ? parsed.currency.trim()
          : 'TRY',
    };
  } catch {
    return createMoneyDefaultValue();
  }
};

type ReferenceDefaultValue = {
  entityType: string;
  referenceId: string;
  label?: string;
};

const createReferenceDefaultValue = (): ReferenceDefaultValue => ({
  entityType: '',
  referenceId: '',
  label: '',
});

const serializeReferenceDefaultValue = (value: ReferenceDefaultValue): string =>
  JSON.stringify({
    entityType: value.entityType?.trim() ?? '',
    referenceId: value.referenceId?.trim() ?? '',
    label: value.label?.trim() ?? '',
  });

const parseReferenceDefaultValue = (raw: string): ReferenceDefaultValue => {
  if (!raw) {
    return createReferenceDefaultValue();
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      entityType:
        typeof parsed.entityType === 'string' ? parsed.entityType : createReferenceDefaultValue().entityType,
      referenceId:
        typeof parsed.referenceId === 'string' ? parsed.referenceId : createReferenceDefaultValue().referenceId,
      label: typeof parsed.label === 'string' ? parsed.label : '',
    };
  } catch {
    return createReferenceDefaultValue();
  }
};

type GeoPointDefaultValue = {
  lat: string;
  lng: string;
};

const createGeoPointDefaultValue = (): GeoPointDefaultValue => ({
  lat: '',
  lng: '',
});

const serializeGeoPointDefaultValue = (value: GeoPointDefaultValue): string =>
  JSON.stringify({
    lat: value.lat ?? '',
    lng: value.lng ?? '',
  });

const parseGeoPointDefaultValue = (raw: string): GeoPointDefaultValue => {
  if (!raw) {
    return createGeoPointDefaultValue();
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      lat: typeof parsed.lat === 'number' ? parsed.lat.toString() : typeof parsed.lat === 'string' ? parsed.lat : '',
      lng: typeof parsed.lng === 'number' ? parsed.lng.toString() : typeof parsed.lng === 'string' ? parsed.lng : '',
    };
  } catch {
    return createGeoPointDefaultValue();
  }
};

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
    case AttributeType.EMAIL: {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(trimmed.toLowerCase())) {
        throw new Error('Default value must be a valid email address.');
      }
      return trimmed.toLowerCase();
    }
    case AttributeType.PHONE: {
      try {
        const parsed = JSON.parse(value);
        const countryCode =
          typeof parsed.countryCode === 'string' && parsed.countryCode.trim().length > 0
            ? parsed.countryCode.trim()
            : '';
        const number =
          typeof parsed.number === 'string' && parsed.number.trim().length > 0
            ? parsed.number.trim()
            : '';

        if (!countryCode && !number) {
          return undefined;
        }

        if (!countryCode) {
          throw new Error(PHONE_DEFAULT_INVALID_ERROR);
        }

        return { countryCode, number };
      } catch (error) {
        if (error instanceof Error && error.message === PHONE_DEFAULT_INVALID_ERROR) {
          throw error;
        }
        throw new Error(PHONE_DEFAULT_INVALID_ERROR);
      }
    }
    case AttributeType.URL: {
      try {
        // eslint-disable-next-line no-new
        new URL(trimmed);
      } catch {
        throw new Error('Default value must be a valid URL (including protocol).');
      }
      return trimmed;
    }
    case AttributeType.MONEY: {
      try {
        const parsed = JSON.parse(value);
        const rawAmount =
          typeof parsed.amount === 'number'
            ? parsed.amount
            : typeof parsed.amount === 'string'
              ? parsed.amount.trim()
              : '';
        const rawCurrency =
          typeof parsed.currency === 'string' ? parsed.currency.trim().toUpperCase() : '';

        if (rawAmount === '' || rawAmount === null) {
          return undefined;
        }

        const amount =
          typeof rawAmount === 'number'
            ? rawAmount
            : rawAmount !== '' && !Number.isNaN(Number(rawAmount))
              ? Number(rawAmount)
              : null;

        if (amount === null) {
          throw new Error('Default money value must include a numeric amount.');
        }
        const currency = rawCurrency || 'TRY';
        return { amount, currency };
      } catch (error) {
        if (error instanceof Error && error.message.includes('money')) {
          throw error;
        }
        throw new Error('Default money value must be a valid JSON object.');
      }
    }
    case AttributeType.REFERENCE: {
      try {
        const parsed = JSON.parse(value);
        const entityType =
          typeof parsed.entityType === 'string' ? parsed.entityType.trim() : '';
        const referenceId =
          typeof parsed.referenceId === 'string' ? parsed.referenceId.trim() : '';
        const label =
          typeof parsed.label === 'string' ? parsed.label.trim() : undefined;

        if (!entityType && !referenceId && !label) {
          return undefined;
        }
        if (!entityType) {
          throw new Error('Default reference value must include an entity type.');
        }
        if (!referenceId) {
          throw new Error('Default reference value must include a reference id.');
        }
        return { entityType, referenceId, label };
      } catch (error) {
        if (error instanceof Error && error.message.includes('reference')) {
          throw error;
        }
        throw new Error('Default reference value must be valid JSON.');
      }
    }
    case AttributeType.GEOPOINT: {
      try {
        const parsed = JSON.parse(value);
        const rawLat =
          typeof parsed.lat === 'number'
            ? parsed.lat
            : typeof parsed.lat === 'string'
              ? parsed.lat.trim()
              : '';
        const rawLng =
          typeof parsed.lng === 'number'
            ? parsed.lng
            : typeof parsed.lng === 'string'
              ? parsed.lng.trim()
              : '';

        if ((rawLat === '' || rawLat === null) && (rawLng === '' || rawLng === null)) {
          return undefined;
        }

        const lat =
          typeof rawLat === 'number'
            ? rawLat
            : rawLat !== '' && !Number.isNaN(Number(rawLat))
              ? Number(rawLat)
              : null;
        const lng =
          typeof rawLng === 'number'
            ? rawLng
            : rawLng !== '' && !Number.isNaN(Number(rawLng))
              ? Number(rawLng)
              : null;

        if (lat === null || lng === null) {
          throw new Error('Geo point default must include numeric latitude and longitude.');
        }
        if (lat < -90 || lat > 90) {
          throw new Error('Latitude must be between -90 and 90 degrees.');
        }
        if (lng < -180 || lng > 180) {
          throw new Error('Longitude must be between -180 and 180 degrees.');
        }

        return { lat, lng };
      } catch (error) {
        if (error instanceof Error && error.message.includes('Geo point')) {
          throw error;
        }
        throw new Error('Geo point default value must be valid JSON.');
      }
    }
    case AttributeType.URL: {
      try {
        // eslint-disable-next-line no-new
        new URL(trimmed);
      } catch {
        throw new Error('Default value must be a valid URL (including protocol).');
      }
      return trimmed;
    }
    case AttributeType.MONEY: {
      try {
        const parsed = JSON.parse(value);
        const rawAmount =
          typeof parsed.amount === 'number'
            ? parsed.amount
            : typeof parsed.amount === 'string'
              ? parsed.amount.trim()
              : '';
        const rawCurrency =
          typeof parsed.currency === 'string' ? parsed.currency.trim().toUpperCase() : '';

        if ((rawAmount === '' || rawAmount === null) && !rawCurrency) {
          return undefined;
        }

        const amount =
          typeof rawAmount === 'number'
            ? rawAmount
            : rawAmount !== '' && !Number.isNaN(Number(rawAmount))
              ? Number(rawAmount)
              : null;

        if (amount === null) {
          throw new Error('Default money value must include a numeric amount.');
        }
        const currency = rawCurrency || 'TRY';
        return { amount, currency };
      } catch (error) {
        if (error instanceof Error && error.message.includes('money')) {
          throw error;
        }
        throw new Error('Default money value must be a valid JSON object.');
      }
    }
    case AttributeType.REFERENCE: {
      try {
        const parsed = JSON.parse(value);
        const entityType =
          typeof parsed.entityType === 'string' ? parsed.entityType.trim() : '';
        const referenceId =
          typeof parsed.referenceId === 'string' ? parsed.referenceId.trim() : '';
        const label =
          typeof parsed.label === 'string' ? parsed.label.trim() : undefined;

        if (!entityType && !referenceId && !label) {
          return undefined;
        }

        if (!entityType) {
          throw new Error('Default reference value must include an entity type.');
        }
        if (!referenceId) {
          throw new Error('Default reference value must include a reference id.');
        }

        return { entityType, referenceId, label };
      } catch (error) {
        if (error instanceof Error && error.message.includes('reference')) {
          throw error;
        }
        throw new Error('Default reference value must be valid JSON.');
      }
    }
    case AttributeType.GEOPOINT: {
      try {
        const parsed = JSON.parse(value);
        const rawLat =
          typeof parsed.lat === 'number'
            ? parsed.lat
            : typeof parsed.lat === 'string'
              ? parsed.lat.trim()
              : '';
        const rawLng =
          typeof parsed.lng === 'number'
            ? parsed.lng
            : typeof parsed.lng === 'string'
              ? parsed.lng.trim()
              : '';

        if ((rawLat === '' || rawLat === null) && (rawLng === '' || rawLng === null)) {
          return undefined;
        }

        const lat =
          typeof rawLat === 'number'
            ? rawLat
            : rawLat !== '' && !Number.isNaN(Number(rawLat))
              ? Number(rawLat)
              : null;
        const lng =
          typeof rawLng === 'number'
            ? rawLng
            : rawLng !== '' && !Number.isNaN(Number(rawLng))
              ? Number(rawLng)
              : null;

        if (lat === null || lng === null) {
          throw new Error('Geo point default must include numeric latitude and longitude.');
        }
        if (lat < -90 || lat > 90) {
          throw new Error('Latitude must be between -90 and 90 degrees.');
        }
        if (lng < -180 || lng > 180) {
          throw new Error('Longitude must be between -180 and 180 degrees.');
        }

        return { lat, lng };
      } catch (error) {
        if (error instanceof Error && error.message.includes('Geo point')) {
          throw error;
        }
        throw new Error('Geo point default value must be valid JSON.');
      }
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

const resolveDefaultValueTemplate = (type: AttributeType): string => {
  switch (type) {
    case AttributeType.PHONE:
      return serializePhoneDefaultValue(createPhoneDefaultValue());
    case AttributeType.MONEY:
      return serializeMoneyDefaultValue(createMoneyDefaultValue());
    case AttributeType.REFERENCE:
      return serializeReferenceDefaultValue(createReferenceDefaultValue());
    case AttributeType.GEOPOINT:
      return serializeGeoPointDefaultValue(createGeoPointDefaultValue());
    default:
      return '';
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
  const requiredLanguages = useRequiredLanguages();

  const syncLocalizationState = useCallback(
    (current: LocalizationState): LocalizationState => {
      const next: LocalizationState = {};
      requiredLanguages.forEach(({ code }) => {
        next[code] = current?.[code] ?? '';
      });
      return next;
    },
    [requiredLanguages],
  );

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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    key: '',
    names: {} as LocalizationState,
    descriptions: {} as LocalizationState,
    type: '' as AttributeType,
    required: false,
    unique: false,
    options: [] as string[],
    defaultValue: '',
    validation: {} as Record<string, any>,
    attributeGroups: [] as string[],
    tags: [] as string[],
  });

  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);
  const [attributeGroupsLoading, setAttributeGroupsLoading] = useState<boolean>(true);
  const [attributeGroupsError, setAttributeGroupsError] = useState<string | null>(null);

  const translateError = useCallback(
    (key: string, fallback: string, params?: Record<string, unknown>) => {
      const translated = t(key, params);
      return translated === key ? fallback : translated;
    },
    [t],
  );

  const ensureLocalizationRecord = useCallback(
    async (payload: CreateLocalizationRequest) => {
      try {
        return await localizationsService.create(payload);
      } catch (error: any) {
        if (error?.response?.status === 409) {
          try {
            const existing = await localizationsService.list({
              namespace: payload.namespace,
              search: payload.key,
              page: 1,
              pageSize: 25,
            });
            const match = existing.items.find((item) => item.key === payload.key);
            if (match) {
              return await localizationsService.update(match.id, {
                description: payload.description ?? null,
                translations: payload.translations,
              });
            }
          } catch (lookupError) {
            throw lookupError;
          }
        }
        throw error;
      }
    },
    [],
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

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      names: syncLocalizationState(prev.names),
      descriptions: syncLocalizationState(prev.descriptions),
    }));
  }, [syncLocalizationState]);

  const resolveNameLabel = useCallback(
    (code: string, languageLabel: string) => {
      if (code === 'tr') {
        return (
          t('attributes.create.attribute_name_tr') ||
          `Attribute Name (${languageLabel})`
        );
      }
      if (code === 'en') {
        return (
          t('attributes.create.attribute_name_en') ||
          `Attribute Name (${languageLabel})`
        );
      }
      const dynamic = t('attributes.create.attribute_name_dynamic', { language: languageLabel });
      if (dynamic !== 'attributes.create.attribute_name_dynamic') {
        return dynamic;
      }
      return `Attribute Name (${languageLabel})`;
    },
    [t],
  );

  const resolveDescriptionLabel = useCallback(
    (code: string, languageLabel: string) => {
      if (code === 'tr') {
        return (
          t('attributes.create.description_tr') ||
          `Description (${languageLabel})`
        );
      }
      if (code === 'en') {
        return (
          t('attributes.create.description_en') ||
          `Description (${languageLabel})`
        );
      }
      const dynamic = t('attributes.create.description_dynamic', { language: languageLabel });
      if (dynamic !== 'attributes.create.description_dynamic') {
        return dynamic;
      }
      return `Description (${languageLabel})`;
    },
    [t],
  );

  const buildTranslations = useCallback(
    (values: LocalizationState, fallback?: LocalizationState): Record<string, string> => {
      const translations: Record<string, string> = {};
      requiredLanguages.forEach(({ code }) => {
        const primary = values[code]?.trim();
        if (primary) {
          translations[code] = primary;
          return;
        }
        const fallbackValue = fallback?.[code]?.trim();
        if (fallbackValue) {
          translations[code] = fallbackValue;
        }
      });
      return translations;
    },
    [requiredLanguages],
  );

  const getPrimaryTranslation = useCallback(
    (values: LocalizationState): string => {
      for (const { code } of requiredLanguages) {
        const value = values[code]?.trim();
        if (value) {
          return value;
        }
      }
      return Object.values(values)
        .map((value) => value?.trim())
        .find((value) => value && value.length > 0) ?? '';
    },
    [requiredLanguages],
  );

  useEffect(() => {
    let cancelled = false;

    const fetchGroups = async () => {
      try {
        setAttributeGroupsLoading(true);
        setAttributeGroupsError(null);
        const data = await attributeGroupsService.list();
        if (!cancelled) {
          setAttributeGroups(data);
        }
      } catch (error) {
        console.error('Failed to load attribute groups', error);
        if (!cancelled) {
          setAttributeGroupsError(
            t('attributes.create.failed_to_load_attribute_groups') ||
              'Attribute grupları yüklenemedi. Lütfen daha sonra tekrar deneyin.',
          );
        }
      } finally {
        if (!cancelled) {
          setAttributeGroupsLoading(false);
        }
      }
    };

    fetchGroups();

    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setLogoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setLogoPreview(null);
    return;
  }, [logoFile]);

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

        requiredLanguages.forEach(({ code, label }) => {
          const value = formData.names[code]?.trim();
          if (!value) {
            const key =
              code === 'tr'
                ? 'attributes.create.errors.name_tr_required'
                : code === 'en'
                ? 'attributes.create.errors.name_en_required'
                : 'attributes.create.errors.name_required';
            const fallback =
              code === 'tr'
                ? 'Display name (Turkish) is required.'
                : code === 'en'
                ? 'Display name (English) is required.'
                : `Display name (${label}) is required.`;
            errors[`name.${code}`] = translateError(key, fallback, { language: label });
          }
        });

        if (!attributeGroupsLoading && attributeGroups.length > 0 && formData.attributeGroups.length === 0) {
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
          if (error instanceof Error && error.message === PHONE_DEFAULT_INVALID_ERROR) {
            errors.defaultValue = translateError(
              'attributes.create.errors.phone_default_invalid',
              PHONE_DEFAULT_ERROR_FALLBACK,
            );
          } else {
            const message =
              error instanceof Error ? error.message : 'Default value is not valid.';
            errors.defaultValue = translateError(
              'attributes.create.errors.default_value_invalid',
              message,
            );
          }
        }
      }

      return errors;
    },
    [formData, translateError, attributeGroups, attributeGroupsLoading, requiredLanguages],
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
    if (step === 1) {
      const { options, ...blockingErrors } = stepErrors;
      return Object.keys(blockingErrors).length === 0;
    }
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
      defaultValue: resolveDefaultValueTemplate(type),
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
    if (currentStep === 1) {
      const { options, ...blockingErrors } = stepErrors;
      return Object.keys(blockingErrors).length === 0;
    }
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
      case AttributeType.EMAIL:
        return (
          <Input
            label={t('attributes.create.default_value')}
            type="email"
            value={defaultValue}
            onChange={(e) => {
              clearError('defaultValue');
              setFormData((prev) => ({ ...prev, defaultValue: e.target.value }));
            }}
            placeholder="name@example.com"
            error={formErrors.defaultValue}
          />
        );
      case AttributeType.URL:
        return (
          <Input
            label={t('attributes.create.default_value')}
            type="url"
            value={defaultValue}
            onChange={(e) => {
              clearError('defaultValue');
              setFormData((prev) => ({ ...prev, defaultValue: e.target.value }));
            }}
            placeholder="https://example.com"
            error={formErrors.defaultValue}
          />
        );
      case AttributeType.PHONE: {
        const phoneDefault = parsePhoneDefaultValue(formData.defaultValue);
        const phoneOptions = PHONE_COUNTRY_CODES.map((option) => ({
          value: option.value,
          label: option.label,
        }));
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('attributes.create.default_value')}
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[150px,1fr]">
              <Select
                value={phoneDefault.countryCode}
                onChange={(e) => {
                  const next = { ...phoneDefault, countryCode: e.target.value };
                  clearError('defaultValue');
                  setFormData((prev) => ({
                    ...prev,
                    defaultValue: serializePhoneDefaultValue(next),
                  }));
                }}
                options={phoneOptions}
                placeholder="+90"
              />
              <Input
                type="tel"
                value={phoneDefault.number}
                onChange={(e) => {
                  const next = { ...phoneDefault, number: e.target.value };
                  clearError('defaultValue');
                  setFormData((prev) => ({
                    ...prev,
                    defaultValue: serializePhoneDefaultValue(next),
                  }));
                }}
                placeholder="5XX XXX XX XX"
                error={formErrors.defaultValue}
              />
            </div>
            {formErrors.defaultValue && (
              <p className="text-xs text-error">{formErrors.defaultValue}</p>
            )}
          </div>
        );
      }
      case AttributeType.MONEY: {
        const moneyDefault = parseMoneyDefaultValue(formData.defaultValue);
        const updateMoneyDefault = (next: Partial<MoneyDefaultValue>) => {
          clearError('defaultValue');
          const merged = { ...moneyDefault, ...next };
          setFormData((prev) => ({
            ...prev,
            defaultValue: serializeMoneyDefaultValue(merged),
          }));
        };
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('attributes.create.default_value')}
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr,140px]">
              <Input
                type="number"
                value={moneyDefault.amount}
                onChange={(e) => updateMoneyDefault({ amount: e.target.value })}
                placeholder="0.00"
                error={formErrors.defaultValue}
              />
              <Input
                value={moneyDefault.currency}
                onChange={(e) => updateMoneyDefault({ currency: e.target.value.toUpperCase() })}
                placeholder="TRY"
              />
            </div>
          </div>
        );
      }
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
      case AttributeType.REFERENCE: {
        const referenceDefault = parseReferenceDefaultValue(formData.defaultValue);
        const updateReferenceDefault = (next: Partial<ReferenceDefaultValue>) => {
          clearError('defaultValue');
          const merged = { ...referenceDefault, ...next };
          setFormData((prev) => ({
            ...prev,
            defaultValue: serializeReferenceDefaultValue(merged),
          }));
        };
        return (
          <div className="space-y-3">
            <Input
              label={t('attributes.create.reference_entity_type') || 'Entity Type'}
              value={referenceDefault.entityType}
              onChange={(e) => updateReferenceDefault({ entityType: e.target.value })}
              placeholder="item, user, category..."
              error={formErrors.defaultValue}
            />
            <Input
              label={t('attributes.create.reference_id') || 'Reference ID'}
              value={referenceDefault.referenceId}
              onChange={(e) => updateReferenceDefault({ referenceId: e.target.value })}
              placeholder="ID or external key"
            />
            <Input
              label={t('attributes.create.reference_label') || 'Display Label'}
              value={referenceDefault.label}
              onChange={(e) => updateReferenceDefault({ label: e.target.value })}
              placeholder={t('attributes.create.reference_label_placeholder') || 'Optional label'}
            />
          </div>
        );
      }
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
      case AttributeType.GEOPOINT: {
        const geoDefault = parseGeoPointDefaultValue(formData.defaultValue);
        const updateGeoDefault = (next: Partial<GeoPointDefaultValue>) => {
          clearError('defaultValue');
          const merged = { ...geoDefault, ...next };
          setFormData((prev) => ({
            ...prev,
            defaultValue: serializeGeoPointDefaultValue(merged),
          }));
        };
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground mb-2 block">
              {t('attributes.create.default_value')}
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                type="number"
                value={geoDefault.lat}
                onChange={(e) => updateGeoDefault({ lat: e.target.value })}
                placeholder="-90 to 90 (Latitude)"
                error={formErrors.defaultValue}
              />
              <Input
                type="number"
                value={geoDefault.lng}
                onChange={(e) => updateGeoDefault({ lng: e.target.value })}
                placeholder="-180 to 180 (Longitude)"
              />
            </div>
          </div>
        );
      }
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
              placeholder={
                type === AttributeType.ARRAY
                  ? t('attributes.create.array_placeholder') || '["deger1","deger2"]'
                  : t('attributes.create.json_placeholder')
              }
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {type === AttributeType.ARRAY
                ? t('attributes.create.array_help') || 'Geçerli JSON dizi kullanın. Örnek: ["deger1","deger2"]'
                : t('attributes.create.json_help')}
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
      case AttributeType.FORMULA:
      case AttributeType.EXPRESSION:
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
              placeholder={t('attributes.create.formula_placeholder') || 'Formül / ifade girin'}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
            />
            {formErrors.defaultValue && (
              <p className="text-xs text-error mt-1">{formErrors.defaultValue}</p>
            )}
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
          <div className="space-y-8">
            <CardHeader
              title={t('attributes.create.basic_information')}
              subtitle={t('attributes.create.basic_information_subtitle')}
            />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="space-y-4">
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
                    placeholder={t('attributes.create.attribute_key_placeholder')}
                    required
                    error={formErrors.key}
                    helperText={t('attributes.create.attribute_key_help')}
                  />

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('attributes.create.names_summary')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {requiredLanguages.map(({ code, label }) => (
                        <Input
                          key={`attribute-name-${code}`}
                          label={resolveNameLabel(code, label)}
                          value={formData.names[code] ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            clearError(`name.${code}`);
                            setFormData((prev) => ({
                              ...prev,
                              names: { ...prev.names, [code]: value },
                            }));
                          }}
                          placeholder={t('attributes.create.attribute_name_placeholder')}
                          required
                          error={formErrors[`name.${code}`]}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('attributes.create.descriptions_summary')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {requiredLanguages.map(({ code, label }) => (
                        <div key={`attribute-description-${code}`}>
                          <label className="block text-xs font-medium text-foreground mb-1">
                            {resolveDescriptionLabel(code, label)}
                          </label>
                          <textarea
                            value={formData.descriptions[code] ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                descriptions: { ...prev.descriptions, [code]: value },
                              }));
                            }}
                            placeholder={t('attributes.create.description_placeholder')}
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        </div>
                      ))}
                    </div>
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

              <div className="space-y-4">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('attributes.create.logo') || 'Logo'}
                  </p>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-24 h-24 rounded-xl border border-dashed border-border flex items-center justify-center bg-muted/40 relative cursor-pointer overflow-hidden"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white">
                            <FileText className="h-6 w-6" />
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 hover:opacity-100 transition">
                        <span className="text-xs font-semibold text-white">
                          {t('attributes.create.logo_change') || 'Logo Seç'}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] leading-snug text-muted-foreground">
                      <p className="font-medium">
                        {t('attributes.create.logo_helper') || 'PNG, JPG, WEBP, GIF, SVG (max 5MB)'}
                      </p>
                      <p className="mt-1">
                        {t('attributes.create.logo_hint') ||
                          'Varsayılan simgeye tıklayarak logo seçebilirsiniz.'}
                      </p>
                    </div>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLogoFile(file);
                      } else {
                        setLogoFile(null);
                      }
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <Switch
                    checked={formData.required}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({ ...prev, required: checked }));
                    }}
                    label={t('attributes.create.this_attribute_is_required')}
                    description={
                      t('attributes.create.required_toggle_description') ||
                      'Kayıt oluşturulurken bu değer zorunludur.'
                    }
                  />
                  <Switch
                    checked={formData.unique}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({ ...prev, unique: checked }));
                    }}
                    label={t('attributes.create.this_attribute_is_unique')}
                    description={
                      t('attributes.create.unique_toggle_description') ||
                      'Her öğe için bu değer yalnızca bir kez kullanılabilir.'
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t('attributes.create.attribute_groups')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('attributes.create.attribute_groups_subtitle')}
                  </p>
                </div>
                <Badge variant="outline">
                  {t('attributes.create.attribute_groups_selection_count', {
                    count: formData.attributeGroups.length,
                  }) ?? `${formData.attributeGroups.length} selected`}
                </Badge>
              </div>
              {attributeGroupsLoading ? (
                <div className="text-sm text-muted-foreground">
                  {t('attributes.create.loading_attribute_groups') || 'Attribute grupları yükleniyor...'}
                </div>
              ) : attributeGroupsError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {attributeGroupsError}
                </div>
              ) : (
                <AttributeGroupSelector
                  groups={attributeGroups.map((group) => ({
                    id: group.id,
                    name: group.name,
                    description: group.description,
                    attributeCount: group.attributeCount ?? group.attributeIds?.length ?? 0,
                  }))}
                  selectedGroups={formData.attributeGroups}
                  onSelectionChange={(groups) => {
                    clearError('attributeGroups');
                    setFormData((prev) => ({ ...prev, attributeGroups: groups }));
                  }}
                />
              )}
              {formErrors.attributeGroups && (
                <p className="text-xs text-error mt-1">{formErrors.attributeGroups}</p>
              )}
            </div>
          </div>
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

      case 4: {
        const previewName = getPrimaryTranslation(formData.names);
        const previewDescription = getPrimaryTranslation(formData.descriptions);
        const previewValue = (() => {
          switch (formData.type) {
            case AttributeType.PHONE:
              return parsePhoneDefaultValue(formData.defaultValue);
            case AttributeType.MONEY:
              return parseMoneyDefaultValue(formData.defaultValue);
            case AttributeType.REFERENCE:
              return parseReferenceDefaultValue(formData.defaultValue);
            case AttributeType.GEOPOINT:
              return parseGeoPointDefaultValue(formData.defaultValue);
            default:
              return formData.defaultValue;
          }
        })();
        const structuredPreviewTypes = new Set<AttributeType>([
          AttributeType.PHONE,
          AttributeType.MONEY,
          AttributeType.REFERENCE,
          AttributeType.GEOPOINT,
        ]);
        const previewAttributeDefault = structuredPreviewTypes.has(formData.type)
          ? previewValue
          : formData.defaultValue || undefined;
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
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-14 h-14 rounded-lg border border-dashed border-border overflow-hidden bg-muted/50 flex items-center justify-center">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
                          <FileText className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t('attributes.create.logo_preview') || 'Logo önizlemesi'}
                      </p>
                    </div>
                  </div>
                  <p>
                    <span className="text-muted-foreground">
                      {t('attributes.create.attribute_key')}:
                    </span>{' '}
                    {formData.key || '—'}
                  </p>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">
                      {t('attributes.create.names_summary') || 'Names'}
                    </span>
                    <div className="mt-1 space-y-1">
                      {requiredLanguages.map(({ code, label }) => (
                        <div key={`preview-name-${code}`}>
                          <span className="text-muted-foreground">{label}:</span>{' '}
                          {formData.names[code]?.trim() || '—'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p>
                    <span className="text-muted-foreground">
                      {t('attributes.create.type')}:
                    </span>{' '}
                    {formData.type
                      ? t(`attributes.types.${formData.type}.name`) || formData.type
                      : '—'}
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
                  <div className="space-y-1">
                    <span className="text-muted-foreground">
                      {t('attributes.create.descriptions_summary') || 'Descriptions'}
                    </span>
                    <div className="mt-1 space-y-1">
                      {requiredLanguages.map(({ code, label }) => (
                        <div key={`preview-description-${code}`}>
                          <span className="text-muted-foreground">{label}:</span>{' '}
                          {formData.descriptions[code]?.trim() || '—'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    {t('attributes.create.attribute_groups_summary')}
                  </h4>
                  <div className="space-y-1">
                    {formData.attributeGroups.length > 0 ? (
                      formData.attributeGroups.map((groupId) => {
                        const group = attributeGroups.find((g) => g.id === groupId);
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
                      name: previewName || formData.key || 'Attribute',
                      type: formData.type || AttributeType.TEXT,
                      required: formData.required,
                      description: previewDescription || undefined,
                      options: formData.options.length > 0 ? formData.options : undefined,
                      defaultValue: previewAttributeDefault,
                      validation: formData.validation,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    }}
                    value={previewValue}
                    mode="edit"
                    onChange={() => {}}
                  />
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
      const nameTranslations = buildTranslations(formData.names);
      const descriptionTranslations = buildTranslations(formData.descriptions, formData.names);
      if (Object.keys(nameTranslations).length === 0) {
        showToast({
          type: 'error',
          message:
            t('attributes.create.errors.name_required') ||
            'Display name is required.',
        });
        setCurrentStep(0);
        setLoading(false);
        return;
      }

      const namespace = 'attributes';
      const nameLocalization = await ensureLocalizationRecord({
        namespace,
        key: `${trimmedKey}.name`,
        description: null,
        translations: nameTranslations,
      });

      let descriptionLocalizationId: string | undefined;
      if (Object.keys(descriptionTranslations).length > 0) {
        const descriptionLocalization = await ensureLocalizationRecord({
          namespace,
          key: `${trimmedKey}.description`,
          description: null,
          translations: descriptionTranslations,
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
            error instanceof Error && error.message === PHONE_DEFAULT_INVALID_ERROR
              ? translateError(
                  'attributes.create.errors.phone_default_invalid',
                  PHONE_DEFAULT_ERROR_FALLBACK,
                )
              : error instanceof Error
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

      const created = await attributesService.create(payload);

      if (formData.attributeGroups.length > 0) {
        const results = await Promise.allSettled(
          formData.attributeGroups.map(async (groupId) => {
            const group = attributeGroups.find((item) => item.id === groupId);
            if (!group) {
              return;
            }
            const existingIds = Array.isArray(group.attributeIds) ? group.attributeIds : [];
            if (existingIds.includes(created.id)) {
              return;
            }
            const nextIds = Array.from(new Set([...existingIds, created.id]));
            await attributeGroupsService.update(groupId, { attributeIds: nextIds });
          }),
        );

        const failed = results.filter((result) => result.status === 'rejected');
        if (failed.length > 0) {
          showToast({
            type: 'warning',
            message:
              t('attributes.create.attribute_group_update_failed') ||
              'Attribute attribute gruplarına bağlanırken bazı hatalar oluştu.',
          });
        }
      }

      if (logoFile) {
        try {
          await logosService.upload('attribute', created.id, logoFile);
        } catch (error) {
          console.error('Attribute logo upload failed', error);
          showToast({
            type: 'warning',
            message: t('attributes.create.logo_upload_failed') || 'Logo yüklenemedi, lütfen daha sonra tekrar deneyin.',
          });
        }
      }

      showToast({
        type: 'success',
        message:
          t('attributes.create.attribute_created_successfully') ||
          'Attribute created successfully.',
      });
      navigate(`/attributes/${created.id}`);
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
