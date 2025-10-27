import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Tags, 
  FileText, 
  Bell, 
  BarChart3, 
  Globe, 
  BookOpen, 
  History,
  Edit2,
  Save,
  X,
  Plus
} from 'lucide-react';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { HistoryTable } from '../../components/common/HistoryTable';
import { NotificationSettings } from '../../components/common/NotificationSettings';
import { APITester } from '../../components/common/APITester';
import { Documentation } from '../../components/common/Documentation';
import { Statistics } from '../../components/common/Statistics';
import { AttributeGroup, AttributeType } from '../../types';
import { TabConfig } from '../../types/common';

// Mock data
const mockAttributeGroup: AttributeGroup = {
  id: 'group-1',
  name: 'Basic Product Info',
  description: 'Essential product information including name, price, description, and basic metadata',
  attributes: [],
  order: 1,
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-20T14:30:00Z',
};

const mockAttributes = [
  {
    id: 'attr-1',
    name: 'Product Name',
    type: AttributeType.TEXT,
    required: true,
    description: 'The display name for the product',
  },
  {
    id: 'attr-2',
    name: 'Price',
    type: AttributeType.NUMBER,
    required: true,
    description: 'Product price in USD',
  },
  {
    id: 'attr-3',
    name: 'Description',
    type: AttributeType.RICH_TEXT,
    required: false,
    description: 'Detailed product description',
  },
  {
    id: 'attr-4',
    name: 'Status',
    type: AttributeType.SELECT,
    required: true,
    options: ['active', 'draft', 'inactive'],
    description: 'Product availability status',
  },
  {
    id: 'attr-5',
    name: 'Featured',
    type: AttributeType.BOOLEAN,
    required: false,
    description: 'Whether this product is featured',
  },
  {
    id: 'attr-6',
    name: 'Rating',
    type: AttributeType.RATING,
    required: false,
    description: 'Customer rating (1-5 stars)',
  },
  {
    id: 'attr-7',
    name: 'Color',
    type: AttributeType.COLOR,
    required: false,
    description: 'Primary product color',
  },
  {
    id: 'attr-8',
    name: 'Launch Date',
    type: AttributeType.DATE,
    required: false,
    description: 'Product launch date',
  },
];

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
    case AttributeType.RATING:
      return 'warning';
    case AttributeType.COLOR:
      return 'error';
    case AttributeType.DATE:
      return 'secondary';
    default:
      return 'default';
  }
};

// Details Component
const AttributeGroupDetailsTab: React.FC<{ editMode: boolean }> = ({ editMode }) => {
  const [attributeGroup, setAttributeGroup] = useState(mockAttributeGroup);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader 
              title="Basic Information" 
              subtitle="Core attribute group properties and configuration"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Group Name"
                  value={attributeGroup.name}
                  onChange={(e) => setAttributeGroup(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!editMode}
                />
              </div>
              
              <div>
                <Input
                  label="Display Order"
                  type="number"
                  value={attributeGroup.order}
                  onChange={(e) => setAttributeGroup(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                  disabled={!editMode}
                  min="1"
                />
              </div>
              
              <div className="md:col-span-2">
                <Input
                  label="Description"
                  value={attributeGroup.description || ''}
                  onChange={(e) => setAttributeGroup(prev => ({ ...prev, description: e.target.value }))}
                  disabled={!editMode}
                />
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
                <label className="text-sm font-medium text-gray-700">Group ID</label>
                <p className="text-sm text-gray-900 mt-1 font-mono bg-gray-100 px-2 py-1 rounded">
                  {attributeGroup.id}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Total Attributes</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="primary" size="sm">
                    {mockAttributes.length} attributes
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(attributeGroup.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Last Updated</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(attributeGroup.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Group Preview */}
      <Card>
        <CardHeader 
          title="Group Preview" 
          subtitle="How this attribute group will appear in forms"
        />
        <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">{attributeGroup.order}</span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                {attributeGroup.name}
              </h4>
              <p className="text-sm text-gray-500">
                {attributeGroup.description}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            This group contains {mockAttributes.length} attributes that will be displayed together in forms.
          </div>
        </div>
      </Card>
    </div>
  );
};

// Attributes Component
const AttributesTab: React.FC<{ editMode: boolean }> = ({ editMode }) => {
  const navigate = useNavigate();
  const [selectedAttributes, setSelectedAttributes] = useState(mockAttributes.map(attr => attr.id));

  const toggleAttribute = (attributeId: string) => {
    if (!editMode) return;
    
    setSelectedAttributes(prev => 
      prev.includes(attributeId)
        ? prev.filter(id => id !== attributeId)
        : [...prev, attributeId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Attributes in This Group</h3>
          <p className="text-sm text-gray-500">Manage which attributes belong to this group</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="primary" size="sm">
            {selectedAttributes.length} attributes selected
          </Badge>
          {editMode && (
            <Button variant="outline" size="sm" onClick={() => navigate('/attributes/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Attribute
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockAttributes.map(attribute => {
          const isSelected = selectedAttributes.includes(attribute.id);
          return (
            <button
              key={attribute.id}
              onClick={() => editMode ? toggleAttribute(attribute.id) : navigate(`/attributes/${attribute.id}`)}
              className={`p-4 border-2 rounded-xl transition-all duration-200 text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${!editMode && 'cursor-pointer hover:shadow-md'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">{attribute.name}</h4>
                      {attribute.required && (
                        <Badge variant="error" size="sm">Required</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{attribute.description}</p>
                    {attribute.options && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-gray-400">Options:</span>
                        {attribute.options.slice(0, 3).map((option, optIndex) => (
                          <Badge key={optIndex} variant="outline" size="sm">
                            {option}
                          </Badge>
                        ))}
                        {attribute.options.length > 3 && (
                          <span className="text-xs text-gray-400">+{attribute.options.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <Badge variant={getAttributeTypeColor(attribute.type) as any} size="sm">
                    {attribute.type}
                  </Badge>
                  {isSelected && editMode && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <FileText className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {mockAttributes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">No attributes in this group yet</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/attributes/create')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Attribute
          </Button>
        </div>
      )}
    </div>
  );
};

export const AttributeGroupsDetails: React.FC = () => {
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
      icon: Tags,
      component: AttributeGroupDetailsTab,
    },
    {
      id: 'attributes',
      label: 'Attributes',
      icon: FileText,
      component: AttributesTab,
      badge: mockAttributes.length.toString(),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      component: NotificationSettings,
      props: { entityType: 'attribute-group', entityId: id },
    },
    {
      id: 'statistics',
      label: 'Statistics',
      icon: BarChart3,
      component: Statistics,
      props: { entityType: 'attribute-group', entityId: id },
    },
    {
      id: 'api',
      label: 'API',
      icon: Globe,
      component: APITester,
      props: { entityType: 'attribute-group', entityId: id },
    },
    {
      id: 'documentation',
      label: 'Documentation',
      icon: BookOpen,
      component: Documentation,
      props: { entityType: 'attribute-group', entityId: id },
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      component: HistoryTable,
      props: { entityType: 'attribute-group', entityId: id },
      badge: '18',
    },
  ];

  return (
    <DetailsLayout
      title={mockAttributeGroup.name}
      subtitle={`Attribute group • Order ${mockAttributeGroup.order} • ${mockAttributes.length} attributes`}
      icon={<Tags className="h-6 w-6 text-white" />}
      tabs={tabs}
      defaultTab="details"
      onSave={handleSave}
      backUrl="/attribute-groups"
      inlineActions={false}
    />
  );
};
