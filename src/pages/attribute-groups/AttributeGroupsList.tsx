import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Tags } from 'lucide-react';
import { DataTable, UserInfo } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AttributeGroup } from '../../types';

// Mock data
const mockAttributeGroups: AttributeGroup[] = [
  {
    id: 'group-1',
    name: 'Basic Product Info',
    description: 'Essential product information like name, price, description',
    attributes: [],
    order: 1,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: 'group-2',
    name: 'Physical Properties',
    description: 'Weight, dimensions, material properties',
    attributes: [],
    order: 2,
    createdAt: '2024-01-02T09:15:00Z',
    updatedAt: '2024-01-19T16:45:00Z',
  },
  {
    id: 'group-3',
    name: 'Marketing Information',
    description: 'SEO, promotional content, tags, categories',
    attributes: [],
    order: 3,
    createdAt: '2024-01-03T11:20:00Z',
    updatedAt: '2024-01-22T13:10:00Z',
  },
  {
    id: 'group-4',
    name: 'Technical Specifications',
    description: 'Technical details, compatibility, requirements',
    attributes: [],
    order: 4,
    createdAt: '2024-01-04T15:30:00Z',
    updatedAt: '2024-01-21T10:20:00Z',
  },
];

export const AttributeGroupsList: React.FC = () => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'order',
      title: 'Order',
      width: 'w-16',
      render: (value: number) => (
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-gray-600">{value}</span>
        </div>
      ),
    },
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (value: string, group: AttributeGroup) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm">
            <Tags className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500">ID: {group.id}</div>
          </div>
        </div>
      ),
      mobileRender: (group: AttributeGroup) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">{group.order}</span>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm">
              <Tags className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">{group.name}</div>
              <div className="text-xs text-gray-500">ID: {group.id}</div>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Attributes</div>
            <div className="text-sm text-gray-600">{group.attributes.length} attributes</div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</div>
            <div className="text-sm text-gray-600">{group.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value}</span>
      ),
    },
    {
      key: 'attributes',
      title: 'Attributes',
      render: (value: any[]) => (
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-600">{value.length}</span>
          <span className="text-xs text-gray-400">attributes</span>
        </div>
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
      key: 'order',
      label: 'Order',
      type: 'select' as const,
      options: [
        { value: '1', label: 'Order 1' },
        { value: '2', label: 'Order 2' },
        { value: '3', label: 'Order 3' },
        { value: '4', label: 'Order 4' },
      ]
    }
  ];

  return (
    <DataTable
      data={mockAttributeGroups}
      columns={columns}
      searchPlaceholder="Search attribute groups..."
      filters={filters}
      onRowClick={(group) => navigate(`/attribute-groups/${group.id}`)}
      emptyState={{
        icon: <Tags className="h-12 w-12" />,
        title: 'No attribute groups found',
        description: 'Get started by creating your first attribute group',
        action: (
          <Button onClick={() => navigate('/attribute-groups/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Attribute Group
          </Button>
        )
      }}
    />
  );
};