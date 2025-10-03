import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Package, FolderTree, Layers, Database, Zap, Plus } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Stepper } from '../../components/ui/Stepper';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { AttributeRenderer } from '../../components/attributes/AttributeRenderer';
import { AttributeType, Attribute } from '../../types';

const steps = [
  { id: 'item-type', name: 'Item Type', description: 'Select item type' },
  { id: 'category', name: 'Category', description: 'Choose category' },
  { id: 'family', name: 'Family', description: 'Pick family' },
  { id: 'attributes', name: 'Attributes', description: 'Fill required data' },
  { id: 'associations', name: 'Associations', description: 'Set up relationships' },
  { id: 'review', name: 'Review', description: 'Confirm details' },
];

// Mock data
const mockItemTypes = [
  { value: 'type-1', label: 'Product' },
  { value: 'type-2', label: 'Service' },
  { value: 'type-3', label: 'Digital Asset' },
];

const mockCategories = [
  { value: 'cat-1', label: 'Food & Beverage' },
  { value: 'cat-2', label: 'Electronics' },
  { value: 'cat-3', label: 'Home & Garden' },
];

const mockFamilies = [
  { value: 'fam-1', label: 'Coffee Products' },
  { value: 'fam-2', label: 'Audio Equipment' },
  { value: 'fam-3', label: 'Furniture' },
];

const mockRequiredAttributes: Attribute[] = [
  {
    id: 'attr-name',
    name: 'Item Name',
    type: AttributeType.TEXT,
    required: true,
    description: 'The display name for this item',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'attr-price',
    name: 'Price',
    type: AttributeType.NUMBER,
    required: true,
    description: 'Item price in USD',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'attr-status',
    name: 'Status',
    type: AttributeType.SELECT,
    required: true,
    options: ['active', 'draft', 'inactive'],
    defaultValue: 'draft',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock associations for the selected item type
const mockRequiredAssociations = [
  {
    id: 'assoc-1',
    name: 'Order - Fabric',
    description: 'Fabric items required for this order',
    sourceItemTypeId: 'type-1',
    targetItemTypeId: 'type-fabric',
    associationType: 'one-to-many' as const,
    isRequired: true,
    minQuantity: 1,
    maxQuantity: 10,
  },
  {
    id: 'assoc-2',
    name: 'Order - Hardware',
    description: 'Hardware components for this order',
    sourceItemTypeId: 'type-1',
    targetItemTypeId: 'type-hardware',
    associationType: 'one-to-many' as const,
    isRequired: true,
    minQuantity: 1,
    maxQuantity: 5,
  },
  {
    id: 'assoc-3',
    name: 'Order - Accessories',
    description: 'Optional accessories for this order',
    sourceItemTypeId: 'type-1',
    targetItemTypeId: 'type-accessories',
    associationType: 'one-to-many' as const,
    isRequired: false,
    minQuantity: 0,
    maxQuantity: 3,
  },
];

// Mock target items for associations
const mockTargetItems = {
  'type-fabric': [
    { id: 'fabric-1', name: 'Cotton Fabric - Blue', price: 15.99 },
    { id: 'fabric-2', name: 'Silk Fabric - Red', price: 45.99 },
    { id: 'fabric-3', name: 'Linen Fabric - White', price: 25.99 },
  ],
  'type-hardware': [
    { id: 'hardware-1', name: 'Metal Button - Silver', price: 2.99 },
    { id: 'hardware-2', name: 'Zipper - Black', price: 8.99 },
    { id: 'hardware-3', name: 'Thread - White', price: 3.99 },
  ],
  'type-accessories': [
    { id: 'acc-1', name: 'Gift Box', price: 5.99 },
    { id: 'acc-2', name: 'Care Instructions Card', price: 1.99 },
    { id: 'acc-3', name: 'Brand Tag', price: 0.99 },
  ],
};
export const ItemsCreate: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    itemTypeId: '',
    categoryId: '',
    familyId: '',
    attributeValues: {} as Record<string, any>,
    associations: [] as { associationId: string; targetItemId: string; quantity?: number }[],
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      navigate('/items');
    }, 2000);
  };

  const handleAttributeChange = (attributeId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      attributeValues: {
        ...prev.attributeValues,
        [attributeId]: value,
      },
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.itemTypeId !== '';
      case 1:
        return formData.categoryId !== '';
      case 2:
        return formData.familyId !== '';
      case 3:
        return mockRequiredAttributes.every(attr => {
          const value = formData.attributeValues[attr.id];
          return attr.required ? value !== undefined && value !== '' : true;
        });
      case 4:
        // Check if all required associations are filled
        const requiredAssociations = mockRequiredAssociations.filter(assoc => assoc.isRequired);
        return requiredAssociations.every(assoc => 
          formData.associations.some(item => item.associationId === assoc.id)
        );
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader 
              title="Select Item Type" 
              subtitle="Choose the type of item you want to create"
            />
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockItemTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setFormData(prev => ({ ...prev, itemTypeId: type.value }))}
                    className={`p-6 border-2 rounded-lg transition-all duration-200 text-left ${
                      formData.itemTypeId === type.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Database className="h-8 w-8 text-indigo-600 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">{type.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Create a new {type.label.toLowerCase()} item
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardHeader 
              title="Select Category" 
              subtitle="Choose the category for your item"
            />
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockCategories.map(category => (
                  <button
                    key={category.value}
                    onClick={() => setFormData(prev => ({ ...prev, categoryId: category.value }))}
                    className={`p-6 border-2 rounded-lg transition-all duration-200 text-left ${
                      formData.categoryId === category.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <FolderTree className="h-8 w-8 text-teal-600 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">{category.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Items in {category.label.toLowerCase()} category
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader 
              title="Select Family" 
              subtitle="Choose the family for your item"
            />
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockFamilies.map(family => (
                  <button
                    key={family.value}
                    onClick={() => setFormData(prev => ({ ...prev, familyId: family.value }))}
                    className={`p-6 border-2 rounded-lg transition-all duration-200 text-left ${
                      formData.familyId === family.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Layers className="h-8 w-8 text-emerald-600 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">{family.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Family specializing in {family.label.toLowerCase()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader 
              title="Fill Required Attributes" 
              subtitle="Provide the essential information for your item"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockRequiredAttributes.map(attribute => (
                <AttributeRenderer
                  key={attribute.id}
                  attribute={attribute}
                  value={formData.attributeValues[attribute.id] || attribute.defaultValue}
                  onChange={(value) => handleAttributeChange(attribute.id, value)}
                />
              ))}
            </div>
          </Card>
        );

      case 4: {
        return (
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Item Associations</h2>
                  <p className="text-purple-100 mt-1">Set up relationships with other items</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {mockRequiredAssociations.map(association => {
                const targetItems = mockTargetItems[association.targetItemTypeId as keyof typeof mockTargetItems] || [];
                const selectedItems = formData.associations.filter(item => item.associationId === association.id);
                
                return (
                  <div key={association.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                          {association.name}
                          {association.isRequired && (
                            <Badge variant="error" size="sm" className="ml-2">Required</Badge>
                          )}
                        </h4>
                        <p className="text-sm text-gray-500">{association.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {association.associationType} • Min: {association.minQuantity} • Max: {association.maxQuantity}
                        </p>
                      </div>
                      <Badge variant="primary" size="sm">
                        {selectedItems.length} selected
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {targetItems.map(item => {
                        const isSelected = selectedItems.some(selected => selected.targetItemId === item.id);
                        const selectedItem = selectedItems.find(selected => selected.targetItemId === item.id);
                        
                        return (
                          <div
                            key={item.id}
                            className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">{item.name}</h5>
                                <p className="text-xs text-gray-500">${item.price}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setFormData(prev => ({
                                      ...prev,
                                      associations: prev.associations.filter(
                                        assoc => !(assoc.associationId === association.id && assoc.targetItemId === item.id)
                                      )
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      associations: [...prev.associations, {
                                        associationId: association.id,
                                        targetItemId: item.id,
                                        quantity: 1
                                      }]
                                    }));
                                  }
                                }}
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                                }`}
                              >
                                {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                              </button>
                            </div>
                            
                            {isSelected && (
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700">Quantity</label>
                                <input
                                  type="number"
                                  min={association.minQuantity || 1}
                                  max={association.maxQuantity || 999}
                                  value={selectedItem?.quantity || 1}
                                  onChange={(e) => {
                                    const quantity = parseInt(e.target.value) || 1;
                                    setFormData(prev => ({
                                      ...prev,
                                      associations: prev.associations.map(assoc =>
                                        assoc.associationId === association.id && assoc.targetItemId === item.id
                                          ? { ...assoc, quantity }
                                          : assoc
                                      )
                                    }));
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      }

      case 5: {
        return (
          <Card>
            <CardHeader 
              title="Review & Confirm" 
              subtitle="Please review your item details before creating"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Item Type</h4>
                  <p className="text-sm text-gray-900">
                    {mockItemTypes.find(t => t.value === formData.itemTypeId)?.label}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Category</h4>
                  <p className="text-sm text-gray-900">
                    {mockCategories.find(c => c.value === formData.categoryId)?.label}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Family</h4>
                  <p className="text-sm text-gray-900">
                    {mockFamilies.find(f => f.value === formData.familyId)?.label}
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Attributes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockRequiredAttributes.map(attribute => (
                    <div key={attribute.id} className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {attribute.name}
                      </label>
                      <AttributeRenderer
                        attribute={attribute}
                        value={formData.attributeValues[attribute.id]}
                        mode="view"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {formData.associations.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Associations</h4>
                  <div className="space-y-4">
                    {mockRequiredAssociations.map(association => {
                      const selectedItems = formData.associations.filter(item => item.associationId === association.id);
                      if (selectedItems.length === 0) return null;
                      
                      return (
                        <div key={association.id} className="p-4 bg-gray-50 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">{association.name}</h5>
                          <div className="space-y-2">
                            {selectedItems.map(selectedItem => {
                              const targetItems = mockTargetItems[association.targetItemTypeId as keyof typeof mockTargetItems] || [];
                              const item = targetItems.find(i => i.id === selectedItem.targetItemId);
                              return item ? (
                                <div key={selectedItem.targetItemId} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700">{item.name}</span>
                                  <Badge variant="outline" size="sm">Qty: {selectedItem.quantity}</Badge>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <Card padding="lg">
        <Stepper steps={steps} currentStep={currentStep} />
      </Card>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
        
        <div className="flex space-x-3">
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!canProceed()}
              leftIcon={<Check className="h-4 w-4" />}
            >
              Create Item
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};