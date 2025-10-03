import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Save, X, Zap, Database, ArrowRight, Hash } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Association } from '../../types';

// Mock data
const mockAssociation: Association = {
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
};

const mockItemTypes = [
  { id: 'type-order', name: 'Order' },
  { id: 'type-product', name: 'Product' },
  { id: 'type-service', name: 'Service' },
  { id: 'type-fabric', name: 'Fabric' },
  { id: 'type-hardware', name: 'Hardware' },
  { id: 'type-accessories', name: 'Accessories' },
  { id: 'type-resource', name: 'Resource' },
];

const associationTypeOptions = [
  { value: 'one-to-one', label: 'One to One' },
  { value: 'one-to-many', label: 'One to Many' },
  { value: 'many-to-many', label: 'Many to Many' },
];

const mockUsageExamples = [
  { sourceItem: 'Order #1234', targetItem: 'Cotton Fabric - Blue', quantity: 3 },
  { sourceItem: 'Order #1235', targetItem: 'Silk Fabric - Red', quantity: 2 },
  { sourceItem: 'Order #1236', targetItem: 'Linen Fabric - White', quantity: 5 },
];

const getAssociationTypeColor = (type: string) => {
  switch (type) {
    case 'one-to-one': return 'primary';
    case 'one-to-many': return 'warning';
    case 'many-to-many': return 'success';
    default: return 'default';
  }
};

export const AssociationsDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [association, setAssociation] = useState(mockAssociation);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setTimeout(() => {
      setEditMode(false);
      setLoading(false);
    }, 1000);
  };

  const sourceItemType = mockItemTypes.find(t => t.id === association.sourceItemTypeId);
  const targetItemType = mockItemTypes.find(t => t.id === association.targetItemTypeId);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Association Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="Association Information" />
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{association.name}</h3>
                  <p className="text-sm text-gray-500">ID: {association.id}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Relationship</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="primary" size="sm">{sourceItemType?.name}</Badge>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <Badge variant="secondary" size="sm">{targetItemType?.name}</Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <div className="mt-1">
                    <Badge variant={getAssociationTypeColor(association.associationType) as any}>
                      {association.associationType}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Required</label>
                  <div className="mt-1">
                    <Badge variant={association.isRequired ? 'error' : 'default'}>
                      {association.isRequired ? 'Required' : 'Optional'}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Quantity Range</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {association.minQuantity} - {association.maxQuantity}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(association.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(association.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Association Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader 
              title="Association Details" 
              subtitle="Manage association configuration"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Association Name"
                    value={association.name}
                    onChange={(e) => setAssociation(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!editMode}
                  />
                </div>
                
                <div>
                  <Input
                    label="Description"
                    value={association.description || ''}
                    onChange={(e) => setAssociation(prev => ({ ...prev, description: e.target.value }))}
                    disabled={!editMode}
                  />
                </div>
                
                <div>
                  <Select
                    label="Source Item Type"
                    value={association.sourceItemTypeId}
                    onChange={(e) => setAssociation(prev => ({ ...prev, sourceItemTypeId: e.target.value }))}
                    options={mockItemTypes.map(t => ({ value: t.id, label: t.name }))}
                    disabled={!editMode}
                  />
                </div>
                
                <div>
                  <Select
                    label="Target Item Type"
                    value={association.targetItemTypeId}
                    onChange={(e) => setAssociation(prev => ({ ...prev, targetItemTypeId: e.target.value }))}
                    options={mockItemTypes.map(t => ({ value: t.id, label: t.name }))}
                    disabled={!editMode}
                  />
                </div>
                
                <div>
                  <Select
                    label="Association Type"
                    value={association.associationType}
                    onChange={(e) => setAssociation(prev => ({ ...prev, associationType: e.target.value as any }))}
                    options={associationTypeOptions}
                    disabled={!editMode}
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="isRequired"
                    checked={association.isRequired}
                    onChange={(e) => setAssociation(prev => ({ ...prev, isRequired: e.target.checked }))}
                    disabled={!editMode}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="isRequired" className="text-sm font-medium text-gray-700">
                    This association is required
                  </label>
                </div>
                
                <div>
                  <Input
                    label="Minimum Quantity"
                    type="number"
                    value={association.minQuantity || 0}
                    onChange={(e) => setAssociation(prev => ({ ...prev, minQuantity: parseInt(e.target.value) || 0 }))}
                    disabled={!editMode}
                    min="0"
                  />
                </div>
                
                <div>
                  <Input
                    label="Maximum Quantity"
                    type="number"
                    value={association.maxQuantity || 1}
                    onChange={(e) => setAssociation(prev => ({ ...prev, maxQuantity: parseInt(e.target.value) || 1 }))}
                    disabled={!editMode}
                    min={association.minQuantity || 0}
                  />
                </div>
              </div>

              {editMode && (
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    loading={loading}
                    leftIcon={<Save className="h-4 w-4" />}
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Usage Examples */}
          <Card>
            <CardHeader 
              title="Usage Examples" 
              subtitle="Real examples of this association in use"
            />
            <div className="space-y-3">
              {mockUsageExamples.map((example, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Database className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-medium text-gray-900">{example.sourceItem}</span>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-700">{example.targetItem}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" size="sm">
                    Qty: {example.quantity}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};