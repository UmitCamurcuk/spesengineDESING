import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Zap, Database, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, UserInfo } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Association } from '../../types';

// Mock data
const mockAssociations: Association[] = [
  {
    id: 'assoc-1',
    name: 'Order - Fabric',
    description: 'Fabric items required for order fulfillment',
    sourceItemTypeId: 'type-order',
    targetItemTypeId: 'type-fabric',
    associationType: 'one-to-many',
    isRequired: true,
    minQuantity: 1,
    maxQuantity: 10,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-25T10:30:00Z',
  },
  {
    id: 'assoc-2',
    name: 'Order - Hardware',
    description: 'Hardware components needed for order completion',
    sourceItemTypeId: 'type-order',
    targetItemTypeId: 'type-hardware',
    associationType: 'one-to-many',
    isRequired: true,
    minQuantity: 1,
    maxQuantity: 5,
    createdAt: '2024-01-02T09:15:00Z',
    updatedAt: '2024-01-24T15:45:00Z',
  },
  {
    id: 'assoc-3',
    name: 'Product - Accessories',
    description: 'Optional accessories that can be bundled with products',
    sourceItemTypeId: 'type-product',
    targetItemTypeId: 'type-accessories',
    associationType: 'many-to-many',
    isRequired: false,
    minQuantity: 0,
    maxQuantity: 3,
    createdAt: '2024-01-03T11:20:00Z',
    updatedAt: '2024-01-22T13:10:00Z',
  },
  {
    id: 'assoc-4',
    name: 'Service - Resources',
    description: 'Resources required to deliver a service',
    sourceItemTypeId: 'type-service',
    targetItemTypeId: 'type-resource',
    associationType: 'one-to-many',
    isRequired: true,
    minQuantity: 1,
    maxQuantity: 20,
    createdAt: '2024-01-04T15:30:00Z',
    updatedAt: '2024-01-21T10:20:00Z',
  },
];

const mockItemTypes = [
  { id: 'type-order', name: 'Order' },
  { id: 'type-product', name: 'Product' },
  { id: 'type-service', name: 'Service' },
  { id: 'type-fabric', name: 'Fabric' },
  { id: 'type-hardware', name: 'Hardware' },
  { id: 'type-accessories', name: 'Accessories' },
  { id: 'type-resource', name: 'Resource' },
];

const getAssociationTypeColor = (type: string) => {
  switch (type) {
    case 'one-to-one': return 'primary';
    case 'one-to-many': return 'warning';
    case 'many-to-many': return 'success';
    default: return 'default';
  }
};

export const AssociationsList: React.FC = () => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'name',
      title: 'Association',
      sortable: true,
      render: (value: string, association: Association) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <div className="text-sm font-semibold text-gray-900">{value}</div>
              {association.isRequired && (
                <Badge variant="error" size="sm">Required</Badge>
              )}
            </div>
            <div className="text-xs text-gray-500">ID: {association.id}</div>
          </div>
        </div>
      ),
      mobileRender: (association: Association) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="text-sm font-semibold text-gray-900">{association.name}</div>
                {association.isRequired && (
                  <Badge variant="error" size="sm">Required</Badge>
                )}
              </div>
              <div className="text-xs text-gray-500">ID: {association.id}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type</div>
              <Badge variant={getAssociationTypeColor(association.associationType)} size="sm">
                {association.associationType}
              </Badge>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Quantity</div>
              <div className="text-sm text-gray-600">{association.minQuantity}-{association.maxQuantity}</div>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Relationship</div>
            <div className="flex items-center space-x-2 text-sm">
              <Badge variant="primary" size="sm">
                {mockItemTypes.find(t => t.id === association.sourceItemTypeId)?.name}
              </Badge>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <Badge variant="secondary" size="sm">
                {mockItemTypes.find(t => t.id === association.targetItemTypeId)?.name}
              </Badge>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</div>
            <div className="text-sm text-gray-600">{association.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'relationship',
      title: 'Relationship',
      render: (_: any, association: Association) => (
        <div className="flex items-center space-x-2">
          <Badge variant="primary" size="sm">
            {mockItemTypes.find(t => t.id === association.sourceItemTypeId)?.name}
          </Badge>
          <ArrowRight className="h-3 w-3 text-gray-400" />
          <Badge variant="secondary" size="sm">
            {mockItemTypes.find(t => t.id === association.targetItemTypeId)?.name}
          </Badge>
        </div>
      ),
    },
    {
      key: 'associationType',
      title: 'Type',
      sortable: true,
      render: (value: string) => (
        <Badge variant={getAssociationTypeColor(value)} size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'quantity',
      title: 'Quantity Range',
      render: (_: any, association: Association) => (
        <div className="text-sm text-gray-600">
          {association.minQuantity} - {association.maxQuantity}
        </div>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      render: (value: string) => (
        <span className="text-sm text-gray-600 line-clamp-2">{value}</span>
      ),
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      sortable: true,
      render: (value: string) => (
        <UserInfo
          name="System Admin"
          email="admin@company.com"
          date={value}
        />
      ),
    },
  ];

  const filters = [
    {
      key: 'associationType',
      label: 'All Types',
      type: 'select' as const,
      options: [
        { value: 'one-to-one', label: 'One to One' },
        { value: 'one-to-many', label: 'One to Many' },
        { value: 'many-to-many', label: 'Many to Many' },
      ]
    },
    {
      key: 'isRequired',
      label: 'All Associations',
      type: 'select' as const,
      options: [
        { value: 'true', label: 'Required Only' },
        { value: 'false', label: 'Optional Only' },
      ]
    },
    {
      key: 'sourceItemTypeId',
      label: 'Source Type',
      type: 'select' as const,
      options: mockItemTypes.map(type => ({
        value: type.id,
        label: type.name
      }))
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Associations"
        subtitle="Define relationships between different entities"
        action={
          <Button onClick={() => navigate('/associations/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Association
          </Button>
        }
      />
      
      <div className="flex-1 mt-6">
        <DataTable
          data={mockAssociations}
          columns={columns}
          searchPlaceholder="Search associations..."
          filters={filters}
          onRowClick={(association) => navigate(`/associations/${association.id}`)}
          emptyState={{
            icon: <Zap className="h-12 w-12" />,
            title: 'No associations found',
            description: 'Get started by creating your first association',
            action: (
              <Button onClick={() => navigate('/associations/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Association
              </Button>
            )
          }}
        />
      </div>
    </div>
  );
};