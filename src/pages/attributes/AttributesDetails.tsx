import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Tags, 
  Bell, 
  BarChart3, 
  Globe, 
  BookOpen, 
  History,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { AttributeRenderer } from '../../components/attributes/AttributeRenderer';
import { HistoryTable } from '../../components/common/HistoryTable';
import { NotificationSettings } from '../../components/common/NotificationSettings';
import { APITester } from '../../components/common/APITester';
import { Documentation } from '../../components/common/Documentation';
import { Statistics } from '../../components/common/Statistics';
import { Attribute, AttributeType } from '../../types';
import { TabConfig } from '../../types/common';

// Mock data
const mockAttribute: Attribute = {
  id: 'attr-1',
  name: 'Product Status',
  type: AttributeType.SELECT,
  required: true,
  options: ['active', 'draft', 'inactive', 'discontinued'],
  defaultValue: 'draft',
  description: 'The current status of the product in the system',
  validation: {
    minLength: 1,
    maxLength: 20,
  },
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-25T10:30:00Z',
};

// Mock attribute groups
const mockAttributeGroups = [
  { id: 'group-1', name: 'Basic Product Info' },
  { id: 'group-2', name: 'Marketing Information' },
  { id: 'group-3', name: 'Technical Specifications' },
];

// Details Component
const AttributeDetailsTab: React.FC<{ editMode: boolean }> = ({ editMode }) => {
  const [attribute, setAttribute] = useState(mockAttribute);
  const [selectedGroups, setSelectedGroups] = useState(['group-1', 'group-2']);

  const getAttributeTypeColor = (type: AttributeType) => {
    switch (type) {
      case AttributeType.TEXT: return 'primary';
      case AttributeType.NUMBER: return 'secondary';
      case AttributeType.BOOLEAN: return 'success';
      case AttributeType.SELECT: return 'warning';
      case AttributeType.RICH_TEXT: return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader 
              title="Basic Information" 
              subtitle="Core attribute properties and configuration"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Attribute Name"
                  value={attribute.name}
                  onChange={(e) => setAttribute(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!editMode}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Attribute Type
                </label>
                <div className="flex items-center space-x-2">
                  <Badge variant={getAttributeTypeColor(attribute.type) as any}>
                    {attribute.type}
                  </Badge>
                  {!editMode && (
                    <span className="text-sm text-gray-500">Cannot be changed</span>
                  )}
                </div>
              </div>
              
              <div className="md:col-span-2">
                <Input
                  label="Description"
                  value={attribute.description || ''}
                  onChange={(e) => setAttribute(prev => ({ ...prev, description: e.target.value }))}
                  disabled={!editMode}
                />
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="required"
                    checked={attribute.required}
                    onChange={(e) => setAttribute(prev => ({ ...prev, required: e.target.checked }))}
                    disabled={!editMode}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="required" className="text-sm font-medium text-gray-700">
                    This attribute is required
                  </label>
                </div>
              </div>
              
              <div>
                <Input
                  label="Default Value"
                  value={attribute.defaultValue || ''}
                  onChange={(e) => setAttribute(prev => ({ ...prev, defaultValue: e.target.value }))}
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
                <label className="text-sm font-medium text-gray-700">Attribute ID</label>
                <p className="text-sm text-gray-900 mt-1 font-mono bg-gray-100 px-2 py-1 rounded">
                  {attribute.id}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(attribute.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Last Updated</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(attribute.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Options (if applicable) */}
      {attribute.options && (
        <Card>
          <CardHeader 
            title="Available Options" 
            subtitle="Predefined values for this attribute"
          />
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {attribute.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                  <Badge variant="outline" size="sm">
                    {option}
                  </Badge>
                  {editMode && (
                    <button
                      onClick={() => {
                        const newOptions = attribute.options?.filter((_, i) => i !== index);
                        setAttribute(prev => ({ ...prev, options: newOptions }));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {editMode && (
              <div className="flex space-x-2">
                <Input
                  placeholder="Add new option"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value && !attribute.options?.includes(value)) {
                        setAttribute(prev => ({
                          ...prev,
                          options: [...(prev.options || []), value]
                        }));
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Preview */}
      <Card>
        <CardHeader 
          title="Attribute Preview" 
          subtitle="How this attribute will appear in forms"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Edit Mode</h4>
            <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <AttributeRenderer
                attribute={attribute}
                value={attribute.defaultValue}
                mode="edit"
                onChange={() => {}}
              />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">View Mode</h4>
            <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <AttributeRenderer
                attribute={attribute}
                value={attribute.options?.[0] || attribute.defaultValue}
                mode="view"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Attribute Groups Component
const AttributeGroupsTab: React.FC<{ editMode: boolean }> = ({ editMode }) => {
  const [selectedGroups, setSelectedGroups] = useState(['group-1', 'group-2']);

  const toggleGroup = (groupId: string) => {
    if (!editMode) return;
    
    setSelectedGroups(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Attribute Groups</h3>
          <p className="text-sm text-gray-500">Manage which groups this attribute belongs to</p>
        </div>
        <Badge variant="primary" size="sm">
          {selectedGroups.length} groups selected
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockAttributeGroups.map(group => {
          const isSelected = selectedGroups.includes(group.id);
          return (
            <button
              key={group.id}
              onClick={() => toggleGroup(group.id)}
              disabled={!editMode}
              className={`p-4 border-2 rounded-xl transition-all duration-200 text-left ${
                isSelected
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${!editMode && 'cursor-default'}`}
            >
              <div className="flex items-center space-x-3">
                <Tags className="h-6 w-6 text-purple-600" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{group.name}</h4>
                  <p className="text-xs text-gray-500">ID: {group.id}</p>
                </div>
                {isSelected && (
                  <div className="ml-auto">
                    <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                      <FileText className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const AttributesDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const tabs: TabConfig[] = [
    {
      id: 'details',
      label: 'Details',
      icon: FileText,
      component: AttributeDetailsTab,
    },
    {
      id: 'attribute-groups',
      label: 'Attribute Groups',
      icon: Tags,
      component: AttributeGroupsTab,
      badge: '2',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      component: NotificationSettings,
      props: { entityType: 'attribute', entityId: id },
    },
    {
      id: 'statistics',
      label: 'Statistics',
      icon: BarChart3,
      component: Statistics,
      props: { entityType: 'attribute', entityId: id },
    },
    {
      id: 'api',
      label: 'API',
      icon: Globe,
      component: APITester,
      props: { entityType: 'attribute', entityId: id },
    },
    {
      id: 'documentation',
      label: 'Documentation',
      icon: BookOpen,
      component: Documentation,
      props: { entityType: 'attribute', entityId: id },
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      component: HistoryTable,
      props: { entityType: 'attribute', entityId: id },
      badge: '24',
    },
  ];

  return (
    <DetailsLayout
      title={mockAttribute.name}
      subtitle={`${mockAttribute.type} attribute • ${mockAttribute.required ? 'Required' : 'Optional'}`}
      icon={<FileText className="h-6 w-6 text-white" />}
      tabs={tabs}
      defaultTab="details"
      onSave={handleSave}
      backUrl="/attributes"
    />
  );
};