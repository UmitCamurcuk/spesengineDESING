import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Tags, 
  Bell, 
  BarChart3, 
  Globe, 
  BookOpen, 
  History,
  Database,
  FolderTree,
  Layers,
  Zap
} from 'lucide-react';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AttributeRenderer } from '../../components/attributes/AttributeRenderer';
import { HistoryTable } from '../../components/common/HistoryTable';
import { NotificationSettings } from '../../components/common/NotificationSettings';
import { APITester } from '../../components/common/APITester';
import { Documentation } from '../../components/common/Documentation';
import { Statistics } from '../../components/common/Statistics';
import { Item, Attribute, AttributeType } from '../../types';
import { TabConfig } from '../../types/common';

// Mock data
const mockItem: Item = {
  id: '1',
  name: 'Premium Coffee Beans',
  itemTypeId: 'type-1',
  categoryId: 'cat-1',
  familyId: 'fam-1',
  attributeValues: {
    price: 29.99,
    weight: '500g',
    origin: 'Colombia',
    roastLevel: 'Medium',
    organic: true,
    description: 'Premium single-origin coffee beans from the mountains of Colombia',
    rating: 4,
  },
  associations: [
    {
      id: 'item-assoc-1',
      associationId: 'assoc-1',
      sourceItemId: '1',
      targetItemId: 'fabric-1',
      quantity: 3,
      metadata: { notes: 'Primary fabric for this order' },
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
    },
    {
      id: 'item-assoc-2',
      associationId: 'assoc-2',
      sourceItemId: '1',
      targetItemId: 'hardware-1',
      quantity: 2,
      metadata: { notes: 'Essential hardware component' },
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
    },
  ],
  status: 'active',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T14:30:00Z',
};

const mockAttributes: Attribute[] = [
  {
    id: 'attr-1',
    name: 'Price',
    type: AttributeType.NUMBER,
    required: true,
    description: 'Item price in USD',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'attr-2',
    name: 'Weight',
    type: AttributeType.TEXT,
    required: true,
    description: 'Product weight',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'attr-3',
    name: 'Origin',
    type: AttributeType.SELECT,
    required: false,
    options: ['Colombia', 'Ethiopia', 'Brazil', 'Jamaica', 'Kenya'],
    description: 'Country of origin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'attr-4',
    name: 'Roast Level',
    type: AttributeType.SELECT,
    required: false,
    options: ['Light', 'Medium', 'Dark'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'attr-5',
    name: 'Organic',
    type: AttributeType.BOOLEAN,
    required: false,
    description: 'Certified organic product',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'attr-6',
    name: 'Description',
    type: AttributeType.RICH_TEXT,
    required: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'attr-7',
    name: 'Rating',
    type: AttributeType.RATING,
    required: false,
    description: 'Customer rating (1-5 stars)',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock reference data
const mockItemTypes = [
  { id: 'type-1', name: 'Product' },
  { id: 'type-2', name: 'Service' },
  { id: 'type-3', name: 'Digital Asset' },
];

const mockCategories = [
  { id: 'cat-1', name: 'Food & Beverage' },
  { id: 'cat-2', name: 'Electronics' },
  { id: 'cat-3', name: 'Home & Garden' },
];

const mockFamilies = [
  { id: 'fam-1', name: 'Coffee Products' },
  { id: 'fam-2', name: 'Audio Equipment' },
  { id: 'fam-3', name: 'Furniture' },
];

const mockAssociations = [
  { id: 'assoc-1', name: 'Order - Fabric', targetItemTypeName: 'Fabric' },
  { id: 'assoc-2', name: 'Order - Hardware', targetItemTypeName: 'Hardware' },
];

const mockAssociatedItems = {
  'fabric-1': { id: 'fabric-1', name: 'Cotton Fabric - Blue', type: 'Fabric' },
  'hardware-1': { id: 'hardware-1', name: 'Metal Button - Silver', type: 'Hardware' },
};

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'inactive', label: 'Inactive' },
];

// Details Component
const ItemDetailsTab: React.FC<{ editMode: boolean }> = ({ editMode }) => {
  const [item, setItem] = useState(mockItem);

  const requiredAttributes = mockAttributes.filter(attr => attr.required);
  const optionalAttributes = mockAttributes.filter(attr => !attr.required);

  const handleAttributeChange = (attributeId: string, value: any) => {
    setItem(prev => ({
      ...prev,
      attributeValues: {
        ...prev.attributeValues,
        [attributeId]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader 
              title="Basic Information" 
              subtitle="Core item properties and configuration"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Item Name"
                  value={item.name}
                  onChange={(e) => setItem(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!editMode}
                />
              </div>
              
              <div>
                <Select
                  label="Status"
                  value={item.status}
                  onChange={(e) => setItem(prev => ({ ...prev, status: e.target.value as any }))}
                  options={statusOptions}
                  disabled={!editMode}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Item Type
                </label>
                <div className="flex items-center space-x-2">
                  <Badge variant="primary">
                    {mockItemTypes.find(t => t.id === item.itemTypeId)?.name || item.itemTypeId}
                  </Badge>
                  {!editMode && (
                    <span className="text-sm text-gray-500">Cannot be changed</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Category
                </label>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {mockCategories.find(c => c.id === item.categoryId)?.name || item.categoryId}
                  </Badge>
                  {!editMode && (
                    <span className="text-sm text-gray-500">Cannot be changed</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Family
                </label>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {mockFamilies.find(f => f.id === item.familyId)?.name || item.familyId}
                  </Badge>
                  {!editMode && (
                    <span className="text-sm text-gray-500">Cannot be changed</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Metadata */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="Metadata" />
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Item ID</label>
                <p className="text-sm text-gray-900 mt-1 font-mono bg-gray-100 px-2 py-1 rounded">
                  {item.id}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <Badge
                    variant={
                      item.status === 'active' ? 'success' :
                      item.status === 'draft' ? 'warning' : 'default'
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Last Updated</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Required Attributes */}
      <Card>
        <CardHeader 
          title="Required Attributes" 
          subtitle="Essential information for this item"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requiredAttributes.map(attribute => (
            <AttributeRenderer
              key={attribute.id}
              attribute={attribute}
              value={item.attributeValues[attribute.id]}
              onChange={(value) => handleAttributeChange(attribute.id, value)}
              mode={editMode ? 'edit' : 'view'}
            />
          ))}
        </div>
      </Card>

      {/* Optional Attributes */}
      <Card>
        <CardHeader 
          title="Additional Attributes" 
          subtitle="Optional information and metadata"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {optionalAttributes.map(attribute => (
            <AttributeRenderer
              key={attribute.id}
              attribute={attribute}
              value={item.attributeValues[attribute.id]}
              onChange={(value) => handleAttributeChange(attribute.id, value)}
              mode={editMode ? 'edit' : 'view'}
            />
          ))}
        </div>
      </Card>
    </div>
  );
};

// Associations Component
const AssociationsTab: React.FC<{ editMode: boolean }> = ({ editMode }) => {
  const navigate = useNavigate();
  const [associations, setAssociations] = useState(mockItem.associations);

  const removeAssociation = (associationId: string) => {
    if (!editMode) return;
    setAssociations(prev => prev.filter(assoc => assoc.id !== associationId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Item Associations</h3>
          <p className="text-sm text-gray-500">Relationships with other items in the system</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="primary" size="sm">
            {associations.length} associations
          </Badge>
          {editMode && (
            <Button variant="outline" size="sm" onClick={() => navigate('/associations')}>
              Manage Associations
            </Button>
          )}
        </div>
      </div>

      {associations.length > 0 ? (
        <div className="space-y-4">
          {associations.map(itemAssoc => {
            const association = mockAssociations.find(a => a.id === itemAssoc.associationId);
            const targetItem = mockAssociatedItems[itemAssoc.targetItemId as keyof typeof mockAssociatedItems];
            
            return (
              <Card key={itemAssoc.id} padding="md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {association?.name || 'Unknown Association'}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">Target:</span>
                        <Badge variant="secondary" size="sm">
                          {targetItem?.name || itemAssoc.targetItemId}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          Qty: {itemAssoc.quantity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/items/${itemAssoc.targetItemId}`)}
                    >
                      View Item
                    </Button>
                    {editMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAssociation(itemAssoc.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                
                {itemAssoc.metadata?.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Notes:</p>
                    <p className="text-sm text-gray-700">{itemAssoc.metadata.notes}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Zap className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">No associations configured</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/associations')}
          >
            Manage Associations
          </Button>
        </div>
      )}
    </div>
  );
};

// Related Items Component
const RelatedItemsTab: React.FC<{ editMode: boolean }> = ({ editMode }) => {
  const navigate = useNavigate();

  // Mock related items (same type, category, or family)
  const mockRelatedItems = [
    { id: '2', name: 'Colombian Dark Roast', type: 'Same Family', status: 'active' },
    { id: '3', name: 'Ethiopian Light Roast', type: 'Same Category', status: 'active' },
    { id: '4', name: 'Brazilian Medium Roast', type: 'Same Type', status: 'draft' },
    { id: '5', name: 'Jamaican Blue Mountain', type: 'Same Family', status: 'active' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Related Items</h3>
          <p className="text-sm text-gray-500">Items with similar properties or relationships</p>
        </div>
        <Badge variant="primary" size="sm">
          {mockRelatedItems.length} related items
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockRelatedItems.map(relatedItem => (
          <Card 
            key={relatedItem.id} 
            padding="md"
            className="hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => navigate(`/items/${relatedItem.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{relatedItem.name}</h4>
                  <p className="text-xs text-gray-500">{relatedItem.type}</p>
                </div>
              </div>
              <Badge 
                variant={
                  relatedItem.status === 'active' ? 'success' :
                  relatedItem.status === 'draft' ? 'warning' : 'default'
                }
                size="sm"
              >
                {relatedItem.status}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Hierarchy Component
const HierarchyTab: React.FC<{ editMode: boolean }> = ({ editMode }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Item Hierarchy</h3>
          <p className="text-sm text-gray-500">Position of this item within the system structure</p>
        </div>
      </div>

      {/* Hierarchy Visualization */}
      <Card>
        <CardHeader 
          title="Hierarchy Structure" 
          subtitle="Complete path from item type to this specific item"
        />
        <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-dashed border-gray-300 rounded-xl">
          <div className="flex flex-col space-y-4">
            {/* Item Type Level */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Database className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Item Type</p>
                <button
                  onClick={() => navigate(`/item-types/${mockItem.itemTypeId}`)}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  {mockItemTypes.find(t => t.id === mockItem.itemTypeId)?.name}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="w-px h-6 bg-gray-300"></div>
            </div>
            
            {/* Category Level */}
            <div className="flex items-center space-x-3 ml-4">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <FolderTree className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Category</p>
                <button
                  onClick={() => navigate(`/categories/${mockItem.categoryId}`)}
                  className="text-sm font-semibold text-teal-600 hover:text-teal-700"
                >
                  {mockCategories.find(c => c.id === mockItem.categoryId)?.name}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="w-px h-6 bg-gray-300"></div>
            </div>
            
            {/* Family Level */}
            <div className="flex items-center space-x-3 ml-8">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Layers className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Family</p>
                <button
                  onClick={() => navigate(`/families/${mockItem.familyId}`)}
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  {mockFamilies.find(f => f.id === mockItem.familyId)?.name}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="w-px h-6 bg-gray-300"></div>
            </div>
            
            {/* Item Level */}
            <div className="flex items-center space-x-3 ml-12">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <Package className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">This Item</p>
                <p className="text-sm font-semibold text-blue-700">{mockItem.name}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          padding="md"
          className="hover:shadow-md transition-all duration-200 cursor-pointer"
          onClick={() => navigate(`/item-types/${mockItem.itemTypeId}`)}
        >
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6 text-indigo-600" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">View Item Type</h4>
              <p className="text-xs text-gray-500">
                {mockItemTypes.find(t => t.id === mockItem.itemTypeId)?.name}
              </p>
            </div>
          </div>
        </Card>

        <Card 
          padding="md"
          className="hover:shadow-md transition-all duration-200 cursor-pointer"
          onClick={() => navigate(`/categories/${mockItem.categoryId}`)}
        >
          <div className="flex items-center space-x-3">
            <FolderTree className="h-6 w-6 text-teal-600" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">View Category</h4>
              <p className="text-xs text-gray-500">
                {mockCategories.find(c => c.id === mockItem.categoryId)?.name}
              </p>
            </div>
          </div>
        </Card>

        <Card 
          padding="md"
          className="hover:shadow-md transition-all duration-200 cursor-pointer"
          onClick={() => navigate(`/families/${mockItem.familyId}`)}
        >
          <div className="flex items-center space-x-3">
            <Layers className="h-6 w-6 text-emerald-600" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">View Family</h4>
              <p className="text-xs text-gray-500">
                {mockFamilies.find(f => f.id === mockItem.familyId)?.name}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export const ItemsDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleSave = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const tabs: TabConfig[] = [
    {
      id: 'details',
      label: 'Details',
      icon: Package,
      component: ItemDetailsTab,
    },
    {
      id: 'associations',
      label: 'Associations',
      icon: Zap,
      component: AssociationsTab,
      badge: mockItem.associations.length.toString(),
    },
    {
      id: 'hierarchy',
      label: 'Hierarchy',
      icon: Tags,
      component: HierarchyTab,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      component: NotificationSettings,
      props: { entityType: 'item', entityId: id },
    },
    {
      id: 'statistics',
      label: 'Statistics',
      icon: BarChart3,
      component: Statistics,
      props: { entityType: 'item', entityId: id },
    },
    {
      id: 'api',
      label: 'API',
      icon: Globe,
      component: APITester,
      props: { entityType: 'item', entityId: id },
    },
    {
      id: 'documentation',
      label: 'Documentation',
      icon: BookOpen,
      component: Documentation,
      props: { entityType: 'item', entityId: id },
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      component: HistoryTable,
      props: { entityType: 'item', entityId: id },
      badge: '15',
    },
  ];

  return (
    <DetailsLayout
      title={mockItem.name}
      subtitle={`${mockItem.status} item • ${mockItemTypes.find(t => t.id === mockItem.itemTypeId)?.name} type`}
      icon={<Package className="h-6 w-6 text-white" />}
      tabs={tabs}
      defaultTab="details"
      onSave={handleSave}
      backUrl="/items"
    />
  );
};