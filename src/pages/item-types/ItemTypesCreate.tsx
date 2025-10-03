import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, FolderTree, Tags, X } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Stepper } from '../../components/ui/Stepper';

const steps = [
  { id: 'basic', name: 'Basic Info', description: 'Name and description' },
  { id: 'categories', name: 'Categories', description: 'Select categories' },
  { id: 'attributes', name: 'Attribute Groups', description: 'Select attribute groups' },
  { id: 'preview', name: 'Preview', description: 'Review and confirm' },
];

export const ItemTypesCreate: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryIds: [] as string[],
    attributeGroups: [] as string[],
  });

  const categoryTreeOptions = [
    {
      id: 'cat-1',
      label: 'Food & Beverage',
      value: 'cat-1',
      icon: <FolderTree className="h-4 w-4 text-orange-600" />,
      children: [
        {
          id: 'cat-2',
          label: 'Coffee Products',
          value: 'cat-2',
          icon: <FolderTree className="h-4 w-4 text-amber-600" />,
        },
        {
          id: 'cat-5',
          label: 'Tea Products',
          value: 'cat-5',
          icon: <FolderTree className="h-4 w-4 text-green-600" />,
        },
        {
          id: 'cat-6',
          label: 'Beverages',
          value: 'cat-6',
          icon: <FolderTree className="h-4 w-4 text-blue-600" />,
        }
      ]
    },
    {
      id: 'cat-3',
      label: 'Electronics',
      value: 'cat-3',
      icon: <FolderTree className="h-4 w-4 text-blue-600" />,
      children: [
        {
          id: 'cat-4',
          label: 'Audio Equipment',
          value: 'cat-4',
          icon: <FolderTree className="h-4 w-4 text-blue-600" />,
        },
        {
          id: 'cat-7',
          label: 'Mobile Devices',
          value: 'cat-7',
          icon: <FolderTree className="h-4 w-4 text-blue-600" />,
        }
      ]
    },
    {
      id: 'cat-8',
      label: 'Home & Garden',
      value: 'cat-8',
      icon: <FolderTree className="h-4 w-4 text-emerald-600" />,
      children: [
        {
          id: 'cat-9',
          label: 'Furniture',
          value: 'cat-9',
          icon: <FolderTree className="h-4 w-4 text-teal-600" />,
        },
        {
          id: 'cat-10',
          label: 'Garden Tools',
          value: 'cat-10',
          icon: <FolderTree className="h-4 w-4 text-green-600" />,
        }
      ]
    }
  ];

  const mockAttributeGroups = [
    {
      id: 'group-1',
      name: 'Basic Product Info',
      description: 'Essential product information',
      attributeCount: 5
    },
    {
      id: 'group-2',
      name: 'Physical Properties',
      description: 'Weight, dimensions, material properties',
      attributeCount: 8
    },
    {
      id: 'group-3',
      name: 'Marketing Information',
      description: 'SEO, promotional content, tags',
      attributeCount: 6
    },
    {
      id: 'group-4',
      name: 'Technical Specifications',
      description: 'Technical details and requirements',
      attributeCount: 12
    }
  ];

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
    setTimeout(() => {
      navigate('/item-types');
    }, 1500);
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  const toggleAttributeGroup = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      attributeGroups: prev.attributeGroups.includes(groupId)
        ? prev.attributeGroups.filter(id => id !== groupId)
        : [...prev.attributeGroups, groupId]
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim() !== '';
      case 1:
        return formData.categoryIds.length > 0;
      case 2:
        return formData.attributeGroups.length > 0;
      default:
        return true;
    }
  };

  const findNodeByValue = (nodes: typeof categoryTreeOptions, targetValue: string): any => {
    for (const node of nodes) {
      if (node.value === targetValue) return node;
      if (node.children) {
        const found = findNodeByValue(node.children, targetValue);
        if (found) return found;
      }
    }
    return null;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader
              title="Basic Information"
              subtitle="Define the fundamental properties of your item type"
            />
            <div className="space-y-6">
              <Input
                label="Item Type Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter a descriptive item type name"
                required
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this item type represents and what kinds of items it will contain..."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardHeader
              title="Associated Categories"
              subtitle="Select which categories can use this item type"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTreeOptions.map(category => (
                  <div key={category.id} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.value)}
                      className={`w-full p-4 border-2 rounded-lg transition-all duration-200 text-left ${
                        formData.categoryIds.includes(category.value)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {category.icon}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{category.label}</h4>
                          </div>
                        </div>
                        {formData.categoryIds.includes(category.value) && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </button>

                    {category.children && (
                      <div className="ml-4 space-y-2">
                        {category.children.map(child => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => toggleCategory(child.value)}
                            className={`w-full p-3 border-2 rounded-lg transition-all duration-200 text-left ${
                              formData.categoryIds.includes(child.value)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {child.icon}
                                <h5 className="text-sm font-medium text-gray-900">{child.label}</h5>
                              </div>
                              {formData.categoryIds.includes(child.value) && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {formData.categoryIds.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Selected Categories ({formData.categoryIds.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.categoryIds.map(categoryId => {
                      const category = findNodeByValue(categoryTreeOptions, categoryId);
                      return category ? (
                        <Badge
                          key={categoryId}
                          variant="primary"
                          className="flex items-center space-x-1"
                        >
                          <span>{category.label}</span>
                          <button
                            type="button"
                            onClick={() => toggleCategory(categoryId)}
                            className="ml-1 hover:bg-blue-700 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader
              title="Attribute Groups"
              subtitle="Select which attribute groups this item type will use"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockAttributeGroups.map(group => {
                  const isSelected = formData.attributeGroups.includes(group.id);
                  return (
                    <button
                      key={group.id}
                      onClick={() => toggleAttributeGroup(group.id)}
                      className={`p-4 border-2 rounded-lg transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          isSelected ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Tags className={`h-5 w-5 ${
                            isSelected ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{group.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{group.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{group.attributeCount} attributes</p>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {formData.attributeGroups.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Selected Attribute Groups ({formData.attributeGroups.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.attributeGroups.map(groupId => {
                      const group = mockAttributeGroups.find(g => g.id === groupId);
                      return group ? (
                        <Badge
                          key={groupId}
                          variant="primary"
                          className="flex items-center space-x-1"
                        >
                          <span>{group.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleAttributeGroup(groupId)}
                            className="ml-1 hover:bg-blue-700 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        );

      case 3: {
        return (
          <Card>
            <CardHeader
              title="Review & Confirm"
              subtitle="Please review your item type details before creating"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-500">Name:</span> {formData.name}</p>
                    {formData.description && (
                      <p><span className="text-gray-500">Description:</span> {formData.description}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Associated Categories ({formData.categoryIds.length})</h4>
                  <div className="space-y-1">
                    {formData.categoryIds.map(categoryId => {
                      const category = findNodeByValue(categoryTreeOptions, categoryId);
                      return category ? (
                        <p key={categoryId} className="text-sm text-gray-600">• {category.label}</p>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Attribute Groups ({formData.attributeGroups.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.attributeGroups.map(groupId => {
                    const group = mockAttributeGroups.find(g => g.id === groupId);
                    return group ? (
                      <div key={groupId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{group.name}</span>
                        <span className="text-sm text-gray-600">{group.attributeCount} attrs</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
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
              Create Item Type
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
