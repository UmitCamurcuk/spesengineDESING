import React from 'react';
import { AttributeType, Attribute } from '../../types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { 
  Calendar, 
  Clock, 
  Image, 
  File, 
  Palette, 
  Star, 
  QrCode, 
  BarChart3,
  Eye
} from 'lucide-react';

interface AttributeRendererProps {
  attribute: Attribute;
  value?: any;
  onChange?: (value: any) => void;
  readonly?: boolean;
  mode?: 'edit' | 'view';
}

export const AttributeRenderer: React.FC<AttributeRendererProps> = ({
  attribute,
  value,
  onChange,
  readonly = false,
  mode = 'edit',
}) => {
  const isViewMode = mode === 'view' || readonly || attribute.type === AttributeType.READONLY;

  const renderInput = () => {
    switch (attribute.type) {
      case AttributeType.TEXT:
        return isViewMode ? (
          <div className="text-sm text-gray-900">{value || '—'}</div>
        ) : (
          <Input
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={`Enter ${attribute.name.toLowerCase()}`}
          />
        );

      case AttributeType.NUMBER:
        return isViewMode ? (
          <div className="text-sm text-gray-900">{value || '—'}</div>
        ) : (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={`Enter ${attribute.name.toLowerCase()}`}
          />
        );

      case AttributeType.BOOLEAN:
        return isViewMode ? (
          <Badge variant={value ? 'success' : 'default'} size="sm">
            {value ? 'Yes' : 'No'}
          </Badge>
        ) : (
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={attribute.id}
                checked={value === true}
                onChange={() => onChange?.(true)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={attribute.id}
                checked={value === false}
                onChange={() => onChange?.(false)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        );

      case AttributeType.DATE:
        return isViewMode ? (
          <div className="flex items-center text-sm text-gray-900">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
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
          <div className="flex items-center text-sm text-gray-900">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
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
          <div className="flex items-center text-sm text-gray-900">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
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
            {value || '—'}
          </Badge>
        ) : (
          <Select
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            options={attribute.options?.map(opt => ({ value: opt, label: opt })) || []}
            placeholder={`Select ${attribute.name.toLowerCase()}`}
          />
        );

      case AttributeType.MULTISELECT:
        const selectedValues = Array.isArray(value) ? value : [];
        return isViewMode ? (
          <div className="flex flex-wrap gap-1">
            {selectedValues.length > 0 ? selectedValues.map((val, index) => (
              <Badge key={index} variant="primary" size="sm">
                {val}
              </Badge>
            )) : (
              <span className="text-sm text-gray-500">—</span>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {attribute.options?.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter(v => v !== option);
                    onChange?.(newValues);
                  }}
                  className="text-indigo-600 focus:ring-indigo-500 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case AttributeType.COLOR:
        return isViewMode ? (
          <div className="flex items-center space-x-2">
            <div
              className="w-6 h-6 rounded-full border border-gray-300"
              style={{ backgroundColor: value || '#ffffff' }}
            />
            <span className="text-sm text-gray-900">{value || '—'}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={value || '#ffffff'}
              onChange={(e) => onChange?.(e.target.value)}
              className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
            />
            <Input
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder="#ffffff"
              leftIcon={<Palette className="h-4 w-4" />}
            />
          </div>
        );

      case AttributeType.RATING:
        const rating = value || 0;
        return isViewMode ? (
          <div className="flex items-center space-x-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={`h-4 w-4 ${
                  index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-sm text-gray-600 ml-2">{rating}/5</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onChange?.(index + 1)}
                className="focus:outline-none"
              >
                <Star
                  className={`h-5 w-5 transition-colors ${
                    index < rating
                      ? 'text-yellow-400 fill-current hover:text-yellow-500'
                      : 'text-gray-300 hover:text-yellow-300'
                  }`}
                />
              </button>
            ))}
          </div>
        );

      case AttributeType.IMAGE:
        return isViewMode ? (
          value ? (
            <div className="flex items-center space-x-2">
              <Image className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-900">Image attached</span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">—</span>
          )
        ) : (
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange?.(file);
            }}
          />
        );

      case AttributeType.FILE:
      case AttributeType.ATTACHMENT:
        return isViewMode ? (
          value ? (
            <div className="flex items-center space-x-2">
              <File className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-900">File attached</span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">—</span>
          )
        ) : (
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange?.(file);
            }}
          />
        );

      case AttributeType.RICH_TEXT:
        return isViewMode ? (
          <div className="text-sm text-gray-900 prose max-w-none">
            {value ? (
              <div dangerouslySetInnerHTML={{ __html: value }} />
            ) : (
              '—'
            )}
          </div>
        ) : (
          <textarea
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder={`Enter ${attribute.name.toLowerCase()}`}
          />
        );

      case AttributeType.JSON:
        return isViewMode ? (
          <Card padding="sm" variant="outlined" className="bg-gray-50">
            <pre className="text-xs text-gray-700 overflow-x-auto">
              {value ? JSON.stringify(value, null, 2) : '{}'}
            </pre>
          </Card>
        ) : (
          <textarea
            value={value ? JSON.stringify(value, null, 2) : ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange?.(parsed);
              } catch (error) {
                // Handle invalid JSON
              }
            }}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
            placeholder="Enter valid JSON"
          />
        );

      case AttributeType.BARCODE:
        return isViewMode ? (
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900 font-mono">{value || '—'}</span>
          </div>
        ) : (
          <Input
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="Enter barcode"
            leftIcon={<BarChart3 className="h-4 w-4" />}
          />
        );

      case AttributeType.QR:
        return isViewMode ? (
          <div className="flex items-center space-x-2">
            <QrCode className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">{value || '—'}</span>
          </div>
        ) : (
          <Input
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="Enter QR code data"
            leftIcon={<QrCode className="h-4 w-4" />}
          />
        );

      case AttributeType.READONLY:
        return (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Eye className="h-4 w-4" />
            <span>{value || '—'}</span>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500 italic">
            Unsupported attribute type: {attribute.type}
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {attribute.name}
          {attribute.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {attribute.description && (
          <span className="text-xs text-gray-500">{attribute.description}</span>
        )}
      </div>
      {renderInput()}
    </div>
  );
};