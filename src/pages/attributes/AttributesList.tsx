import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Package } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, UserInfo } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Attribute, AttributeType } from '../../types';

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

const getAttributeTypeColor = (type: AttributeType) => {
  switch (type) {
    case AttributeType.TEXT:
      return 'primary';
    case AttributeType.NUMBER:
      return 'secondary';
    case AttributeType.BOOLEAN:
      return 'success';
    case AttributeType.SELECT:
      return 'warning';
    case AttributeType.RICH_TEXT:
      return 'error';
    default:
      return 'default';
  }
};

export const AttributesList: React.FC = () => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'name',
      title: 'Attribute',
      sortable: true,
      render: (value: string, attribute: Attribute) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <div className="text-sm font-semibold text-gray-900">{value}</div>
              {attribute.required && (
                <Badge variant="error" size="sm">Required</Badge>
              )}
            </div>
            <div className="text-xs text-gray-500">ID: {attribute.id}</div>
          </div>
        </div>
      ),
      mobileRender: (attribute: Attribute) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="text-sm font-semibold text-gray-900">{attribute.name}</div>
                {attribute.required && (
                  <Badge variant="error" size="sm">Required</Badge>
                )}
              </div>
              <div className="text-xs text-gray-500">ID: {attribute.id}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type</div>
              <Badge variant={getAttributeTypeColor(attribute.type)} size="sm">
                {attribute.type}
              </Badge>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Groups</div>
              <div className="flex flex-wrap gap-1">
                {(attributeGroupAssignments[attribute.id] || []).slice(0, 2).map(groupId => {
                  const group = mockAttributeGroups.find(g => g.id === groupId);
                  return group ? (
                    <Badge key={groupId} variant="outline" size="sm">
                      {group.name}
                    </Badge>
                  ) : null;
                })}
                {(attributeGroupAssignments[attribute.id] || []).length > 2 && (
                  <span className="text-xs text-gray-400">+{(attributeGroupAssignments[attribute.id] || []).length - 2}</span>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</div>
            <div className="text-sm text-gray-600">{attribute.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      title: 'Type',
      sortable: true,
      render: (value: AttributeType) => (
        <Badge variant={getAttributeTypeColor(value)} size="sm">
          {value}
        </Badge>
      ),
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
                <Badge key={groupId} variant="outline" size="sm">
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
      title: 'Options',
      render: (value: string[] | undefined) => (
        value ? (
          <div className="flex flex-wrap gap-1">
            {value.slice(0, 2).map((option, index) => (
              <Badge key={index} variant="outline" size="sm">
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
      title: 'Last Updated',
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
      label: 'All Types',
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
    <div>
      <DataTable
        data={mockAttributes}
        columns={columns}
        searchPlaceholder="Search attributes..."
        filters={filters}
        onRowClick={(attribute) => navigate(`/attributes/${attribute.id}`)}
        emptyState={{
          icon: <Package className="h-12 w-12" />,
          title: 'No attributes found',
          description: 'Get started by creating your first attribute',
          action: (
            <Button onClick={() => navigate('/attributes/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Attribute
            </Button>
          )
        }}
      />
    </div>
  );
};