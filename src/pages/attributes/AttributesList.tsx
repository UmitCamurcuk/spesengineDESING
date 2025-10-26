import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Package, Type, ToggleLeft, Calendar, Image, Paperclip, Code, List, CheckSquare, Table, Palette, Calculator, Braces, BarChart3, Clock, Calendar as CalendarIcon, Star, Hash as HashIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, UserInfo } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Attribute, AttributeType } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';

// Mock data
const mockAttributes: Attribute[] = [
  {
    id: 'attr-1',
    name: 'Product Name',
    type: AttributeType.TEXT,
    required: true,
    description: 'The display name for the product',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: 'attr-2',
    name: 'Price',
    type: AttributeType.NUMBER,
    required: true,
    description: 'Product price in USD',
    createdAt: '2024-01-02T09:15:00Z',
    updatedAt: '2024-01-19T16:45:00Z',
  },
  {
    id: 'attr-3',
    name: 'Status',
    type: AttributeType.SELECT,
    required: true,
    options: ['active', 'draft', 'inactive'],
    description: 'Product availability status',
    createdAt: '2024-01-03T11:20:00Z',
    updatedAt: '2024-01-22T13:10:00Z',
  },
  {
    id: 'attr-4',
    name: 'Featured',
    type: AttributeType.BOOLEAN,
    required: false,
    description: 'Whether this product is featured',
    createdAt: '2024-01-04T15:30:00Z',
    updatedAt: '2024-01-21T10:20:00Z',
  },
  {
    id: 'attr-5',
    name: 'Description',
    type: AttributeType.RICH_TEXT,
    required: false,
    description: 'Detailed product description',
    createdAt: '2024-01-05T08:45:00Z',
    updatedAt: '2024-01-23T12:15:00Z',
  },
  {
    id: 'attr-6',
    name: 'SKU',
    type: AttributeType.TEXT,
    required: true,
    description: 'Stock Keeping Unit identifier',
    createdAt: '2024-01-06T10:30:00Z',
    updatedAt: '2024-01-24T09:20:00Z',
  },
  {
    id: 'attr-7',
    name: 'Weight',
    type: AttributeType.NUMBER,
    required: false,
    description: 'Product weight in grams',
    createdAt: '2024-01-07T11:15:00Z',
    updatedAt: '2024-01-25T14:45:00Z',
  },
  {
    id: 'attr-8',
    name: 'Color',
    type: AttributeType.SELECT,
    required: false,
    options: ['red', 'blue', 'green', 'yellow', 'black', 'white'],
    description: 'Available product colors',
    createdAt: '2024-01-08T13:20:00Z',
    updatedAt: '2024-01-26T16:30:00Z',
  },
  {
    id: 'attr-9',
    name: 'In Stock',
    type: AttributeType.BOOLEAN,
    required: true,
    description: 'Whether the product is currently in stock',
    createdAt: '2024-01-09T14:45:00Z',
    updatedAt: '2024-01-27T11:15:00Z',
  },
  {
    id: 'attr-10',
    name: 'Launch Date',
    type: AttributeType.DATE,
    required: false,
    description: 'Product launch date',
    createdAt: '2024-01-10T15:30:00Z',
    updatedAt: '2024-01-28T13:20:00Z',
  },
  {
    id: 'attr-11',
    name: 'Tags',
    type: AttributeType.ARRAY,
    required: false,
    description: 'Product tags for categorization',
    createdAt: '2024-01-11T16:15:00Z',
    updatedAt: '2024-01-29T10:45:00Z',
  },
  {
    id: 'attr-12',
    name: 'Specifications',
    type: AttributeType.JSON,
    required: false,
    description: 'Technical specifications as JSON',
    createdAt: '2024-01-12T17:00:00Z',
    updatedAt: '2024-01-30T15:30:00Z',
  },
  {
    id: 'attr-13',
    name: 'Image Gallery',
    type: AttributeType.IMAGE,
    required: false,
    description: 'Product image gallery',
    createdAt: '2024-01-13T18:30:00Z',
    updatedAt: '2024-01-31T12:15:00Z',
  },
  {
    id: 'attr-14',
    name: 'Manual',
    type: AttributeType.ATTACHMENT,
    required: false,
    description: 'Product manual PDF',
    createdAt: '2024-01-14T19:45:00Z',
    updatedAt: '2024-02-01T14:20:00Z',
  },
  {
    id: 'attr-15',
    name: 'Rating',
    type: AttributeType.NUMBER,
    required: false,
    description: 'Product rating from 1-5',
    createdAt: '2024-01-15T20:15:00Z',
    updatedAt: '2024-02-02T16:45:00Z',
  },
  {
    id: 'attr-16',
    name: 'Reviews',
    type: AttributeType.TABLE,
    required: false,
    description: 'Customer reviews table',
    createdAt: '2024-01-16T21:30:00Z',
    updatedAt: '2024-02-03T18:10:00Z',
  },
  {
    id: 'attr-17',
    name: 'Brand Color',
    type: AttributeType.COLOR,
    required: false,
    description: 'Brand primary color',
    createdAt: '2024-01-17T22:00:00Z',
    updatedAt: '2024-02-04T19:25:00Z',
  },
  {
    id: 'attr-18',
    name: 'Formula',
    type: AttributeType.FORMULA,
    required: false,
    description: 'Calculated field based on other attributes',
    createdAt: '2024-01-18T23:15:00Z',
    updatedAt: '2024-02-05T20:40:00Z',
  },
  {
    id: 'attr-19',
    name: 'Expression',
    type: AttributeType.EXPRESSION,
    required: false,
    description: 'Dynamic expression evaluation',
    createdAt: '2024-01-19T00:30:00Z',
    updatedAt: '2024-02-06T21:55:00Z',
  },
  {
    id: 'attr-20',
    name: 'Object',
    type: AttributeType.OBJECT,
    required: false,
    description: 'Complex nested object structure',
    createdAt: '2024-01-20T01:45:00Z',
    updatedAt: '2024-02-07T22:10:00Z',
  },
  {
    id: 'attr-21',
    name: 'QR Code',
    type: AttributeType.TEXT,
    required: false,
    description: 'Product QR code',
    createdAt: '2024-01-21T02:00:00Z',
    updatedAt: '2024-02-08T23:25:00Z',
  },
  {
    id: 'attr-22',
    name: 'Barcode',
    type: AttributeType.BARCODE,
    required: false,
    description: 'Product barcode',
    createdAt: '2024-01-22T03:15:00Z',
    updatedAt: '2024-02-09T00:40:00Z',
  },
  {
    id: 'attr-23',
    name: 'Geolocation',
    type: AttributeType.JSON,
    required: false,
    description: 'Product location coordinates',
    createdAt: '2024-01-23T04:30:00Z',
    updatedAt: '2024-02-10T01:55:00Z',
  },
  {
    id: 'attr-24',
    name: 'Time',
    type: AttributeType.TIME,
    required: false,
    description: 'Product availability time',
    createdAt: '2024-01-24T05:45:00Z',
    updatedAt: '2024-02-11T03:10:00Z',
  },
  {
    id: 'attr-25',
    name: 'DateTime',
    type: AttributeType.DATETIME,
    required: false,
    description: 'Product creation datetime',
    createdAt: '2024-01-25T06:00:00Z',
    updatedAt: '2024-02-12T04:25:00Z',
  },
];

const mockAttributeGroups = [
  { id: 'group-1', name: 'Basic Product Info' },
  { id: 'group-2', name: 'Physical Properties' },
  { id: 'group-3', name: 'Marketing Information' },
  { id: 'group-4', name: 'Technical Specifications' },
];

// Mock attribute group assignments
const attributeGroupAssignments: Record<string, string[]> = {
  'attr-1': ['group-1'],
  'attr-2': ['group-1'],
  'attr-3': ['group-1', 'group-3'],
  'attr-4': ['group-3'],
  'attr-5': ['group-1', 'group-3'],
};


// Icon mapping for attribute types
const getAttributeTypeIcon = (type: AttributeType, name?: string) => {
  // Special case for rating attributes
  if (name && name.toLowerCase().includes('rating')) {
    return Star;
  }
  
  switch (type) {
    case AttributeType.TEXT:
      return Type;
    case AttributeType.NUMBER:
      return HashIcon;
    case AttributeType.BOOLEAN:
      return ToggleLeft;
    case AttributeType.DATE:
      return Calendar;
    case AttributeType.IMAGE:
      return Image;
    case AttributeType.ATTACHMENT:
      return Paperclip;
    case AttributeType.JSON:
      return Code;
    case AttributeType.ARRAY:
      return List;
    case AttributeType.SELECT:
      return CheckSquare;
    case AttributeType.RICH_TEXT:
      return FileText;
    case AttributeType.TABLE:
      return Table;
    case AttributeType.COLOR:
      return Palette;
    case AttributeType.FORMULA:
      return Calculator;
    case AttributeType.OBJECT:
      return Braces;
    case AttributeType.BARCODE:
      return BarChart3;
    case AttributeType.TIME:
      return Clock;
    case AttributeType.DATETIME:
      return CalendarIcon;
    case AttributeType.EXPRESSION:
      return Code;
    default:
      return Type;
  }
};

// Get attribute type display name
const getAttributeTypeName = (type: AttributeType, t: (key: string) => string) => {
  switch (type) {
    case AttributeType.TEXT:
      return t('attributes.types.text');
    case AttributeType.NUMBER:
      return t('attributes.types.number');
    case AttributeType.BOOLEAN:
      return t('attributes.types.boolean');
    case AttributeType.DATE:
      return t('attributes.types.date');
    case AttributeType.IMAGE:
      return t('attributes.types.image');
    case AttributeType.ATTACHMENT:
      return t('attributes.types.attachment');
    case AttributeType.JSON:
      return t('attributes.types.json');
    case AttributeType.ARRAY:
      return t('attributes.types.array');
    case AttributeType.SELECT:
      return t('attributes.types.select');
    case AttributeType.RICH_TEXT:
      return t('attributes.types.rich_text');
    case AttributeType.TABLE:
      return t('attributes.types.table');
    case AttributeType.COLOR:
      return t('attributes.types.color');
    case AttributeType.FORMULA:
      return t('attributes.types.formula');
    case AttributeType.OBJECT:
      return t('attributes.types.object');
    case AttributeType.BARCODE:
      return t('attributes.types.barcode');
    case AttributeType.TIME:
      return t('attributes.types.time');
    case AttributeType.DATETIME:
      return t('attributes.types.datetime');
    case AttributeType.EXPRESSION:
      return t('attributes.types.expression');
    default:
      return type;
  }
};

export const AttributesList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const canCreateAttribute = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTES.CREATE);

  const columns = [
    {
      key: 'name',
      title: t('attributes.name'),
      sortable: true,
      render: (value: string, attribute: Attribute) => {
        const IconComponent = getAttributeTypeIcon(attribute.type, attribute.name);
        const typeName = getAttributeTypeName(attribute.type, t);
        return (
          <div className="flex items-center space-x-3">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <IconComponent className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs text-muted-foreground mt-1">{typeName}</span>
            </div>
          <div>
            <div className="flex items-center space-x-2">
              <div className="text-sm font-semibold text-foreground">{value}</div>
              {attribute.required && (
                <Badge variant="error" size="sm">{t('attributes.required')}</Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">ID: {attribute.id}</div>
          </div>
        </div>
        );
      },
      mobileRender: (attribute: Attribute) => {
        const IconComponent = getAttributeTypeIcon(attribute.type, attribute.name);
        const typeName = getAttributeTypeName(attribute.type, t);
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-muted-foreground mt-1">{typeName}</span>
              </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="text-sm font-semibold text-foreground">{attribute.name}</div>
                {attribute.required && (
                  <Badge variant="error" size="sm">Required</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">ID: {attribute.id}</div>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Groups</div>
            <div className="flex flex-wrap gap-1">
              {(attributeGroupAssignments[attribute.id] || []).slice(0, 3).map(groupId => {
                const group = mockAttributeGroups.find(g => g.id === groupId);
                return group ? (
                  <Badge key={groupId} variant="secondary" size="sm">
                    {group.name}
                  </Badge>
                ) : null;
              })}
              {(attributeGroupAssignments[attribute.id] || []).length > 3 && (
                <span className="text-xs text-muted-foreground">+{(attributeGroupAssignments[attribute.id] || []).length - 3}</span>
              )}
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</div>
            <div className="text-sm text-gray-600">{attribute.description}</div>
          </div>
        </div>
        );
      },
    },
    {
      key: 'groups',
      title: 'Attribute Groups',
      render: (_: any, attribute: Attribute) => {
        const groups = attributeGroupAssignments[attribute.id] || [];
        return (
          <div className="flex flex-wrap gap-1">
            {groups.slice(0, 2).map(groupId => {
              const group = mockAttributeGroups.find(g => g.id === groupId);
              return group ? (
                <Badge key={groupId} variant="secondary" size="sm">
                  {group.name}
                </Badge>
              ) : null;
            })}
            {groups.length > 2 && (
              <span className="text-xs text-gray-400">+{groups.length - 2} more</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'description',
      title: 'Description',
      render: (value: string) => (
        <span className="text-sm text-gray-600 line-clamp-2">{value}</span>
      ),
    },
    {
      key: 'options',
      title: t('attributes.options'),
      render: (value: string[] | undefined) => (
        value ? (
          <div className="flex flex-wrap gap-1">
            {value.slice(0, 2).map((option, index) => (
              <Badge key={index} variant="secondary" size="sm">
                {option}
              </Badge>
            ))}
            {value.length > 2 && (
              <span className="text-xs text-gray-400">+{value.length - 2}</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )
      ),
    },
    {
      key: 'updatedAt',
      title: t('attributes.updated_at'),
      sortable: true,
      render: (value: string) => (
        <UserInfo
          name="Admin User"
          email="admin@company.com"
          date={value}
        />
      ),
    },
  ];

  const filters = [
    {
      key: 'type',
      label: 'Type',
      type: 'select' as const,
      options: Object.values(AttributeType).map(type => ({
        value: type,
        label: type
      }))
    },
    {
      key: 'required',
      label: 'Required',
      type: 'select' as const,
      options: [
        { value: 'true', label: 'Required Only' },
        { value: 'false', label: 'Optional Only' }
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('attributes.title')}
        subtitle={t('attributes.subtitle')}
      />
      
      <div className="flex-1 mt-6">
        <DataTable
          data={mockAttributes}
          columns={columns}
          searchPlaceholder="Search attributes..."
          filters={filters}
          onRowClick={(attribute) => navigate(`/attributes/${attribute.id}`)}
          emptyState={{
            icon: <Package className="h-12 w-12" />,
            title: t('attributes.no_attributes'),
            description: t('attributes.create_new_attribute'),
            action: canCreateAttribute
              ? (
                  <Button onClick={() => navigate('/attributes/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('attributes.create_title')}
                  </Button>
                )
              : undefined,
          }}
        />
      </div>
    </div>
  );
};
