import React from 'react';
import { AttributeType, Attribute } from '../../types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
  Activity,
  BarChart3,
  Calendar,
  Clock,
  Mail,
  Eye,
  File,
  Image,
  Palette,
  Phone,
  Plus,
  QrCode,
  Star,
  Trash2,
  Link2,
  Coins,
  Share2,
  MapPin,
} from 'lucide-react';
import { PHONE_COUNTRY_CODES, DEFAULT_PHONE_COUNTRY_CODE } from '../../constants/phoneCodes';

interface AttributeRendererProps {
  attribute: Attribute;
  value?: any;
  onChange?: (value: any) => void;
  readonly?: boolean;
  mode?: 'edit' | 'view';
}

const getOptionList = (attribute: Attribute): string[] => {
  if (Array.isArray(attribute.options) && attribute.options.length > 0) {
    return attribute.options;
  }
  const uiSettings = attribute.uiSettings as Record<string, unknown> | undefined | null;
  if (uiSettings && Array.isArray(uiSettings.options)) {
    return uiSettings.options as string[];
  }
  return [];
};

type PhoneValue = {
  countryCode: string;
  number: string;
};

const PHONE_SELECT_OPTIONS = PHONE_COUNTRY_CODES.map(({ value, label }) => ({
  value,
  label,
}));

const createDefaultPhoneValue = (): PhoneValue => ({
  countryCode: DEFAULT_PHONE_COUNTRY_CODE,
  number: '',
});

const ensurePhoneOptions = (code: string): { value: string; label: string }[] => {
  if (!code || PHONE_SELECT_OPTIONS.some((option) => option.value === code)) {
    return PHONE_SELECT_OPTIONS;
  }
  return [...PHONE_SELECT_OPTIONS, { value: code, label: code }];
};

const parsePhoneValue = (raw: unknown): PhoneValue => {
  const normalize = (input: Record<string, unknown>): PhoneValue => ({
    countryCode:
      typeof input.countryCode === 'string' && input.countryCode.trim().length > 0
        ? input.countryCode.trim()
        : DEFAULT_PHONE_COUNTRY_CODE,
    number: typeof input.number === 'string' ? input.number.trim() : '',
  });

  if (raw === undefined || raw === null || raw === '') {
    return createDefaultPhoneValue();
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return createDefaultPhoneValue();
    }
    if (trimmed.includes('|')) {
      const [code, num] = trimmed.split('|');
      return normalize({ countryCode: code?.trim(), number: num?.trim() });
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        return normalize(parsed as Record<string, unknown>);
      }
    } catch {
      // ignore JSON parse errors for phone defaults
    }
    return normalize({ number: trimmed });
  }

  if (typeof raw === 'object') {
    return normalize(raw as Record<string, unknown>);
  }

  return normalize({ number: String(raw) });
};

const isPhoneValueEmpty = (phone: PhoneValue): boolean => phone.number.trim().length === 0;

const formatPhoneValue = (phone: PhoneValue): string =>
  phone.number ? `${phone.countryCode} ${phone.number}`.trim() : '';

type MoneyValue = {
  amount: number | '';
  currency: string;
};

const createDefaultMoneyValue = (): MoneyValue => ({
  amount: '',
  currency: 'TRY',
});

const normalizeMoneyAmount = (amount: unknown): number | '' => {
  if (typeof amount === 'number' && !Number.isNaN(amount)) {
    return amount;
  }
  if (typeof amount === 'string') {
    const trimmed = amount.trim();
    if (!trimmed) {
      return '';
    }
    const numeric = Number(trimmed);
    return Number.isNaN(numeric) ? '' : numeric;
  }
  return '';
};

const normalizeCurrency = (currency: unknown): string => {
  if (typeof currency === 'string' && currency.trim().length > 0) {
    return currency.trim().toUpperCase();
  }
  return 'TRY';
};

const parseMoneyValue = (raw: unknown): MoneyValue => {
  if (raw === undefined || raw === null || raw === '') {
    return createDefaultMoneyValue();
  }

  if (typeof raw === 'number') {
    return { amount: raw, currency: 'TRY' };
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return createDefaultMoneyValue();
    }
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          return {
            amount: normalizeMoneyAmount((parsed as Record<string, unknown>).amount),
            currency: normalizeCurrency((parsed as Record<string, unknown>).currency),
          };
        }
      } catch {
        // ignore parse errors
      }
    }
    const [maybeAmount, maybeCurrency] = trimmed.split(/\s+/);
    return {
      amount: normalizeMoneyAmount(maybeAmount),
      currency: normalizeCurrency(maybeCurrency),
    };
  }

  if (typeof raw === 'object') {
    const input = raw as Record<string, unknown>;
    return {
      amount: normalizeMoneyAmount(input.amount),
      currency: normalizeCurrency(input.currency),
    };
  }

  return createDefaultMoneyValue();
};

const formatMoneyValue = (money: MoneyValue): string => {
  if (money.amount === '') {
    return '';
  }
  return `${money.currency || 'TRY'} ${money.amount}`;
};

type ReferenceValue = {
  entityType: string;
  referenceId: string;
  label?: string;
};

const createDefaultReferenceValue = (): ReferenceValue => ({
  entityType: '',
  referenceId: '',
  label: '',
});

const parseReferenceValue = (raw: unknown): ReferenceValue => {
  if (raw === undefined || raw === null || raw === '') {
    return createDefaultReferenceValue();
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return createDefaultReferenceValue();
    }
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          const input = parsed as Record<string, unknown>;
          return {
            entityType: typeof input.entityType === 'string' ? input.entityType : '',
            referenceId: typeof input.referenceId === 'string' ? input.referenceId : '',
            label: typeof input.label === 'string' ? input.label : '',
          };
        }
      } catch {
        // ignore parse errors
      }
    }
    const [entityType, ...rest] = trimmed.split(':');
    const referenceId = rest.length > 0 ? rest.join(':') : entityType;
    return {
      entityType: (entityType ?? '').trim(),
      referenceId: (referenceId ?? '').trim(),
    };
  }

  if (typeof raw === 'object') {
    const input = raw as Record<string, unknown>;
    return {
      entityType: typeof input.entityType === 'string' ? input.entityType : '',
      referenceId: typeof input.referenceId === 'string' ? input.referenceId : '',
      label: typeof input.label === 'string' ? input.label : '',
    };
  }

  return {
    entityType: '',
    referenceId: String(raw),
  };
};

type GeoPointValue = {
  lat: number | '';
  lng: number | '';
};

const createDefaultGeoPointValue = (): GeoPointValue => ({
  lat: '',
  lng: '',
});

const normalizeCoordinate = (coordinate: unknown): number | '' => {
  if (typeof coordinate === 'number' && !Number.isNaN(coordinate)) {
    return coordinate;
  }
  if (typeof coordinate === 'string') {
    const trimmed = coordinate.trim();
    if (!trimmed) {
      return '';
    }
    const numeric = Number(trimmed);
    return Number.isNaN(numeric) ? '' : numeric;
  }
  return '';
};

const parseGeoPointValue = (raw: unknown): GeoPointValue => {
  if (raw === undefined || raw === null || raw === '') {
    return createDefaultGeoPointValue();
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return createDefaultGeoPointValue();
    }
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          const input = parsed as Record<string, unknown>;
          return {
            lat: normalizeCoordinate(input.lat),
            lng: normalizeCoordinate(input.lng),
          };
        }
      } catch {
        // ignore
      }
    }
    const [lat, lng] = trimmed.split(/[;,]/);
    return {
      lat: normalizeCoordinate(lat),
      lng: normalizeCoordinate(lng),
    };
  }

  if (typeof raw === 'object') {
    const input = raw as Record<string, unknown>;
    return {
      lat: normalizeCoordinate(input.lat),
      lng: normalizeCoordinate(input.lng),
    };
  }

  return createDefaultGeoPointValue();
};

const formatGeoPointValue = (point: GeoPointValue): string => {
  if (point.lat === '' && point.lng === '') {
    return '';
  }
  return `${point.lat === '' ? '—' : point.lat}, ${point.lng === '' ? '—' : point.lng}`;
};

export const AttributeRenderer: React.FC<AttributeRendererProps> = ({
  attribute,
  value,
  onChange,
  readonly = false,
  mode = 'edit',
}) => {
  const isViewMode = mode === 'view' || readonly || attribute.type === AttributeType.READONLY;

  const stringValue =
    typeof value === 'string'
      ? value
      : value === undefined || value === null
        ? ''
        : String(value);

  const numberValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim().length > 0
        ? Number(value)
        : '';

  const selectOptions = getOptionList(attribute);

  const renderJsonEditor = (rawValue: unknown, rows = 6) => (
    <textarea
      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
      rows={rows}
      value={
        typeof rawValue === 'string'
          ? rawValue
          : rawValue === undefined || rawValue === null
            ? ''
            : JSON.stringify(rawValue, null, 2)
      }
      onChange={(e) => {
        const next = e.target.value;
        try {
          const parsed = next.trim() ? JSON.parse(next) : null;
          onChange?.(parsed);
        } catch {
          onChange?.(next);
        }
      }}
      placeholder="JSON değerini girin"
    />
  );

  const renderTableInput = () => {
    const rawRows =
      Array.isArray(value) && value.every((row) => Array.isArray(row))
        ? (value as unknown as string[][])
        : [['']];
    const maxColumns = Math.max(1, ...rawRows.map((row) => row.length));
    const normalizedRows = rawRows.map((row) => {
      const next = [...row];
      while (next.length < maxColumns) {
        next.push('');
      }
      return next;
    });

    const applyChange = (nextRows: string[][]) => {
      onChange?.(nextRows.map((row) => row.map((cell) => cell ?? '')));
    };

    const handleCellChange = (rowIndex: number, colIndex: number, cellValue: string) => {
      const copy = normalizedRows.map((row, rIdx) =>
        rIdx === rowIndex ? row.map((cell, cIdx) => (cIdx === colIndex ? cellValue : cell)) : row,
      );
      applyChange(copy);
    };

    const handleAddRow = () => {
      applyChange([...normalizedRows, Array.from({ length: maxColumns }, () => '')]);
    };

    const handleAddColumn = () => {
      applyChange(normalizedRows.map((row) => [...row, '']));
    };

    const handleRemoveRow = (index: number) => {
      if (normalizedRows.length === 1) return;
      applyChange(normalizedRows.filter((_, idx) => idx !== index));
    };

    const handleRemoveColumn = (index: number) => {
      if (maxColumns === 1) return;
      applyChange(normalizedRows.map((row) => row.filter((_, idx) => idx !== index)));
    };

    if (isViewMode) {
      return (
        <div className="overflow-auto rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <tbody>
              {normalizedRows.map((row, rowIdx) => (
                <tr key={`view-row-${rowIdx}`} className="border-b border-border/60 last:border-b-0">
                  {row.map((cell, colIdx) => (
                    <td key={`view-cell-${rowIdx}-${colIdx}`} className="px-3 py-2 text-foreground">
                      {cell || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleAddRow}>
            <Plus className="h-4 w-4 mr-1" />
            Satır
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleAddColumn}>
            <Plus className="h-4 w-4 mr-1" />
            Sütun
          </Button>
        </div>
        <div className="overflow-auto rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <tbody>
              {normalizedRows.map((row, rowIdx) => (
                <tr key={`edit-row-${rowIdx}`} className="border-b border-border/60 last:border-b-0">
                  {row.map((cell, colIdx) => (
                    <td key={`edit-cell-${rowIdx}-${colIdx}`} className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={cell}
                          onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                          placeholder={`R${rowIdx + 1}C${colIdx + 1}`}
                        />
                        {row.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveColumn(colIdx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    {normalizedRows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRow(rowIdx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderInput = () => {
    switch (attribute.type) {
      case AttributeType.TEXT:
        return isViewMode ? (
          <div className="text-sm text-foreground">{stringValue || '—'}</div>
        ) : (
          <Input
            value={stringValue}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={`Enter ${attribute.name.toLowerCase()}`}
          />
        );

      case AttributeType.EMAIL:
        return isViewMode ? (
          <div className="flex items-center text-sm text-foreground">
            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
            {stringValue || '—'}
          </div>
        ) : (
          <Input
            type="email"
            value={stringValue}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="name@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
          />
        );
      case AttributeType.URL:
        return isViewMode ? (
          stringValue ? (
            <a
              href={stringValue}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary"
            >
              <Link2 className="h-4 w-4" />
              <span className="truncate">{stringValue}</span>
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )
        ) : (
          <Input
            type="url"
            value={stringValue}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="https://example.com"
            leftIcon={<Link2 className="h-4 w-4" />}
          />
        );

      case AttributeType.NUMBER:
        return isViewMode ? (
          <div className="text-sm text-foreground">
            {numberValue === '' || Number.isNaN(Number(numberValue)) ? '—' : numberValue}
          </div>
        ) : (
          <Input
            type="number"
            value={numberValue}
            onChange={(e) => onChange?.(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={`Enter ${attribute.name.toLowerCase()}`}
          />
        );

      case AttributeType.BOOLEAN:
        return isViewMode ? (
          <Badge variant={value ? 'success' : 'default'} size="sm">
            {value ? 'Evet' : 'Hayır'}
          </Badge>
        ) : (
          <div className="flex items-center space-x-4">
            <label className="flex items-center text-sm text-foreground">
              <input
                type="radio"
                name={attribute.id}
                checked={value === true}
                onChange={() => onChange?.(true)}
                className="text-primary focus:ring-primary"
              />
              <span className="ml-2">Evet</span>
            </label>
            <label className="flex items-center text-sm text-foreground">
              <input
                type="radio"
                name={attribute.id}
                checked={value === false}
                onChange={() => onChange?.(false)}
                className="text-primary focus:ring-primary"
              />
              <span className="ml-2">Hayır</span>
            </label>
          </div>
        );

      case AttributeType.DATE:
        return isViewMode ? (
          <div className="flex items-center text-sm text-foreground">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            {value ? new Date(value).toLocaleDateString() : '—'}
          </div>
        ) : (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            leftIcon={<Calendar className="h-4 w-4" />}
          />
        );

      case AttributeType.DATETIME:
        return isViewMode ? (
          <div className="flex items-center text-sm text-foreground">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            {value ? new Date(value).toLocaleString() : '—'}
          </div>
        ) : (
          <Input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            leftIcon={<Calendar className="h-4 w-4" />}
          />
        );

      case AttributeType.TIME:
        return isViewMode ? (
          <div className="flex items-center text-sm text-foreground">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            {value || '—'}
          </div>
        ) : (
          <Input
            type="time"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            leftIcon={<Clock className="h-4 w-4" />}
          />
        );

      case AttributeType.SELECT:
        return isViewMode ? (
          <Badge variant="primary" size="sm">
            {stringValue || '—'}
          </Badge>
        ) : (
          <Select
            value={stringValue}
            onChange={(e) => onChange?.(e.target.value)}
            options={selectOptions.map((opt) => ({ value: opt, label: opt }))}
            placeholder={`Select ${attribute.name.toLowerCase()}`}
          />
        );

      case AttributeType.MULTISELECT:
        const selectedValues = Array.isArray(value) ? value : [];
        return isViewMode ? (
          <div className="flex flex-wrap gap-1">
            {selectedValues.length > 0 ? (
              selectedValues.map((val, index) => (
                <Badge key={index} variant="primary" size="sm">
                  {val}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {selectOptions.map((option) => (
              <label key={option} className="flex items-center text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter((val) => val !== option);
                    onChange?.(next);
                  }}
                  className="text-primary focus:ring-primary rounded"
                />
                <span className="ml-2">{option}</span>
              </label>
            ))}
          </div>
        );
      case AttributeType.REFERENCE: {
        const referenceValue = parseReferenceValue(value);
        if (isViewMode) {
          if (!referenceValue.entityType && !referenceValue.referenceId && !referenceValue.label) {
            return <span className="text-sm text-muted-foreground">—</span>;
          }
          return (
            <div className="space-y-1 text-sm text-foreground">
              <Badge variant="secondary" size="sm">
                {referenceValue.entityType || '—'}
              </Badge>
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-muted-foreground" />
                <span>{referenceValue.label || referenceValue.referenceId || '—'}</span>
              </div>
            </div>
          );
        }

        const handleReferenceChange = (next: Partial<ReferenceValue>) => {
          onChange?.({ ...referenceValue, ...next });
        };

        return (
          <div className="space-y-2">
            <Input
              value={referenceValue.entityType}
              onChange={(e) => handleReferenceChange({ entityType: e.target.value })}
              placeholder="Entity Type"
            />
            <Input
              value={referenceValue.referenceId}
              onChange={(e) => handleReferenceChange({ referenceId: e.target.value })}
              placeholder="Reference ID"
            />
            <Input
              value={referenceValue.label ?? ''}
              onChange={(e) => handleReferenceChange({ label: e.target.value })}
              placeholder="Display Label (optional)"
            />
          </div>
        );
      }

      case AttributeType.PHONE: {
        const phoneValue = parsePhoneValue(value);
        if (isViewMode) {
          return (
            <div className="flex items-center text-sm text-foreground">
              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
              {isPhoneValueEmpty(phoneValue) ? '—' : formatPhoneValue(phoneValue)}
            </div>
          );
        }

        const options = ensurePhoneOptions(phoneValue.countryCode);
        const handlePhoneChange = (next: Partial<PhoneValue>) => {
          onChange?.({ ...phoneValue, ...next });
        };

        return (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{attribute.name}</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px,1fr]">
              <Select
                value={phoneValue.countryCode}
                onChange={(e) => handlePhoneChange({ countryCode: e.target.value })}
                options={options}
                placeholder="+90"
              />
              <Input
                type="tel"
                value={phoneValue.number}
                onChange={(e) => handlePhoneChange({ number: e.target.value })}
                placeholder="5XX XXX XX XX"
              />
            </div>
          </div>
        );
      }
      case AttributeType.MONEY: {
        const moneyValue = parseMoneyValue(value);
        if (isViewMode) {
          return (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <span>{formatMoneyValue(moneyValue) || '—'}</span>
            </div>
          );
        }

        const handleMoneyChange = (next: Partial<MoneyValue>) => {
          onChange?.({ ...moneyValue, ...next });
        };

        return (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr,120px]">
            <Input
              type="number"
              value={moneyValue.amount === '' ? '' : moneyValue.amount}
              onChange={(e) =>
                handleMoneyChange({
                  amount: e.target.value === '' ? '' : Number(e.target.value),
                })
              }
              placeholder="0.00"
            />
            <Input
              value={moneyValue.currency}
              onChange={(e) => handleMoneyChange({ currency: e.target.value.toUpperCase() })}
              placeholder="TRY"
            />
          </div>
        );
      }
      case AttributeType.GEOPOINT: {
        const geoPointValue = parseGeoPointValue(value);
        if (isViewMode) {
          return (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{formatGeoPointValue(geoPointValue) || '—'}</span>
            </div>
          );
        }

        const handleGeoChange = (next: Partial<GeoPointValue>) => {
          onChange?.({ ...geoPointValue, ...next });
        };

        return (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              type="number"
              value={geoPointValue.lat === '' ? '' : geoPointValue.lat}
              onChange={(e) =>
                handleGeoChange({
                  lat: e.target.value === '' ? '' : Number(e.target.value),
                })
              }
              placeholder="Latitude"
            />
            <Input
              type="number"
              value={geoPointValue.lng === '' ? '' : geoPointValue.lng}
              onChange={(e) =>
                handleGeoChange({
                  lng: e.target.value === '' ? '' : Number(e.target.value),
                })
              }
              placeholder="Longitude"
            />
          </div>
        );
      }

      case AttributeType.COLOR:
        return isViewMode ? (
          <div className="flex items-center space-x-2">
            <div
              className="h-6 w-6 rounded-full border border-border"
              style={{ backgroundColor: stringValue || '#ffffff' }}
            />
            <span className="text-sm text-foreground">{stringValue || '—'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={stringValue || '#ffffff'}
              onChange={(e) => onChange?.(e.target.value)}
              className="h-10 w-16 cursor-pointer rounded border border-border bg-transparent"
            />
            <Input
              value={stringValue}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder="#ffffff"
              leftIcon={<Palette className="h-4 w-4" />}
            />
          </div>
        );

      case AttributeType.RATING:
        const ratingValue = Number(stringValue) || 0;
        return isViewMode ? (
          <div className="flex items-center gap-1 text-warning">
            <Star className="h-4 w-4" />
            <span>{ratingValue || '—'}</span>
          </div>
        ) : (
          <Input
            type="number"
            min={0}
            max={attribute.validation?.max ?? 5}
            value={ratingValue}
            onChange={(e) => onChange?.(e.target.value === '' ? '' : Number(e.target.value))}
          />
        );

      case AttributeType.IMAGE:
        return isViewMode ? (
          value ? (
            <div className="flex items-center space-x-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">
                {typeof value === 'string'
                  ? value
                  : value && typeof value === 'object' && 'name' in value
                    ? (value as File).name
                    : 'Image'}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )
        ) : (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onChange?.(e.target.files?.[0] ?? null)}
          />
        );

      case AttributeType.FILE:
      case AttributeType.ATTACHMENT:
        return isViewMode ? (
          value ? (
            <div className="flex items-center space-x-2">
              <File className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">
                {typeof value === 'string'
                  ? value
                  : value && typeof value === 'object' && 'name' in value
                    ? (value as File).name
                    : 'Dosya'}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )
        ) : (
          <input type="file" onChange={(e) => onChange?.(e.target.files?.[0] ?? null)} />
        );

      case AttributeType.RICH_TEXT:
        return isViewMode ? (
          <div
            className="prose prose-sm text-foreground"
            dangerouslySetInnerHTML={{ __html: stringValue || '' }}
          />
        ) : (
          <textarea
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
            rows={4}
            value={stringValue}
            onChange={(e) => onChange?.(e.target.value)}
          />
        );

      case AttributeType.JSON:
        return isViewMode ? (
          <Card padding="sm" variant="outlined" className="bg-muted">
            <pre className="max-h-60 overflow-auto text-xs text-foreground">
              {value ? JSON.stringify(value, null, 2) : '{}'}
            </pre>
          </Card>
        ) : (
          renderJsonEditor(value)
        );

      case AttributeType.BARCODE:
        return isViewMode ? (
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm text-foreground">{stringValue || '—'}</span>
          </div>
        ) : (
          <Input
            value={stringValue}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="Barkod değerini girin"
            leftIcon={<BarChart3 className="h-4 w-4" />}
          />
        );

      case AttributeType.QR:
        return isViewMode ? (
          <div className="flex items-center space-x-2">
            <QrCode className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{stringValue || '—'}</span>
          </div>
        ) : (
          <Input
            value={stringValue}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="QR kod bilgisini girin"
            leftIcon={<QrCode className="h-4 w-4" />}
          />
        );

      case AttributeType.TABLE:
        return renderTableInput();

      case AttributeType.OBJECT:
      case AttributeType.ARRAY:
      case AttributeType.FORMULA:
      case AttributeType.EXPRESSION:
        return renderJsonEditor(value, 4);

      case AttributeType.READONLY:
        return (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{stringValue || '—'}</span>
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>Bu attribute tipi için özel bir bileşen tanımlı değil.</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">
          {attribute.name}
          {attribute.required && <span className="ml-1 text-red-500">*</span>}
        </label>
        {attribute.description && (
          <span className="text-xs text-muted-foreground">{attribute.description}</span>
        )}
        {attribute.helpText && (
          <span className="text-xs text-muted-foreground italic">{attribute.helpText}</span>
        )}
      </div>
      {renderInput()}
    </div>
  );
};
