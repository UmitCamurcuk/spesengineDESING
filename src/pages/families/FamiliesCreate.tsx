import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Layers, ArrowRight, Check, FolderTree, Sparkles, Tags, Plus, X } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TreeSelect } from '../../components/ui/TreeSelect';
import { Stepper } from '../../components/ui/Stepper';
import { Badge } from '../../components/ui/Badge';

const steps = [
  { id: 'basic', name: 'Basic Info', description: 'Name and description' },
  { id: 'category', name: 'Category', description: 'Select category' },
  { id: 'parent', name: 'Parent Family', description: 'Choose parent family' },
  { id: 'attributes', name: 'Attribute Groups', description: 'Select attribute groups' },
  { id: 'preview', name: 'Preview', description: 'Review and confirm' },
];

export const FamiliesCreate: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    parentFamilyId: '',
    attributeGroups: [] as string[],
  });

  // Mock data with hierarchical structure
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
          icon: <FolderTree className="h-4 w-4 text-indigo-600" />,
        },
        {
          id: 'cat-7',
          label: 'Mobile Devices',
          value: 'cat-7',
          icon: <FolderTree className="h-4 w-4 text-purple-600" />,
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

  // Hierarchical family tree structure
  const familyTreeOptions = [
    {
      id: 'root',
      label: 'No Parent (Root Family)',
      value: '',
      icon: <Layers className="h-4 w-4 text-gray-400" />,
    },
    {
      id: 'fam-1',
      label: 'Coffee Products',
      value: 'fam-1',
      icon: <Layers className="h-4 w-4 text-amber-600" />,
      children: [
        {
          id: 'fam-2',
          label: 'Arabica Coffee',
          value: 'fam-2',
          icon: <Layers className="h-4 w-4 text-amber-500" />,
          children: [
            {
              id: 'fam-8',
              label: 'Single Origin Arabica',
              value: 'fam-8',
              icon: <Layers className="h-4 w-4 text-amber-400" />,
            },
            {
              id: 'fam-9',
              label: 'Arabica Blends',
              value: 'fam-9',
              icon: <Layers className="h-4 w-4 text-amber-400" />,
            }
          ]
        },
        {
          id: 'fam-5',
          label: 'Robusta Coffee',
          value: 'fam-5',
          icon: <Layers className="h-4 w-4 text-amber-500" />,
        },
        {
          id: 'fam-6',
          label: 'Coffee Accessories',
          value: 'fam-6',
          icon: <Layers className="h-4 w-4 text-amber-500" />,
        }
      ]
    },
    {
      id: 'fam-3',
      label: 'Audio Equipment',
      value: 'fam-3',
      icon: <Layers className="h-4 w-4 text-blue-600" />,
      children: [
        {
          id: 'fam-4',
          label: 'Wireless Headphones',
          value: 'fam-4',
          icon: <Layers className="h-4 w-4 text-blue-500" />,
        },
        {
          id: 'fam-10',
          label: 'Speakers',
          value: 'fam-10',
          icon: <Layers className="h-4 w-4 text-blue-500" />,
        }
      ]
    },
    {
      id: 'fam-7',
      label: 'Furniture',
      value: 'fam-7',
      icon: <Layers className="h-4 w-4 text-emerald-600" />,
      children: [
        {
          id: 'fam-11',
          label: 'Office Furniture',
          value: 'fam-11',
          icon: <Layers className="h-4 w-4 text-emerald-500" />,
        },
        {
          id: 'fam-12',
          label: 'Home Furniture',
          value: 'fam-12',
          icon: <Layers className="h-4 w-4 text-emerald-500" />,
        }
      ]
    }
  ];

  // Mock attribute groups
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
      navigate('/families');
    }, 1500);
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
        return formData.categoryId !== '';
      case 2:
        return true; // Parent family is optional
      case 3:
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
      case 0: {
        return (
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Layers className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Family Information</h2>
                  <p className="text-emerald-100 mt-1">Define the essential properties of your family</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Family Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter a descriptive family name"
                    required
                    className="text-lg"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this family represents and what types of items it will contain..."
                      rows={4}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {formData.name && (
                <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center space-x-2 text-emerald-700 mb-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium">Preview</span>
                  </div>
                  <div className="text-sm text-emerald-600">
                    Family: <span className="font-semibold">{formData.name}</span>
                    {formData.description && (
                      <div className="mt-1 text-emerald-600/80">{formData.description}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      }

      case 1: {
        const selectedCategory = findNodeByValue(categoryTreeOptions, formData.categoryId);
        
        return (
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <FolderTree className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Category Selection</h2>
                  <p className="text-orange-100 mt-1">Choose which category this family belongs to</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <TreeSelect
                label="Category"
                value={formData.categoryId}
                onChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                options={categoryTreeOptions}
                placeholder="Select a category"
                helperText="Choose which category this family belongs to"
                searchable
              />

              {selectedCategory && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <div className="flex items-center space-x-2 text-orange-700 mb-2">
                    <FolderTree className="h-4 w-4" />
                    <span className="text-sm font-medium">Selected Category</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedCategory.icon}
                    <Badge variant="primary">
                      {selectedCategory.label}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      }

      case 2: {
        const selectedParent = findNodeByValue(familyTreeOptions, formData.parentFamilyId);
        
        return (
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Layers className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Parent Family</h2>
                  <p className="text-blue-100 mt-1">Position this family within your hierarchy</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <TreeSelect
                label="Parent Family"
                value={formData.parentFamilyId}
                onChange={(value) => setFormData(prev => ({ ...prev, parentFamilyId: value }))}
                options={familyTreeOptions}
                placeholder="Select parent family"
                helperText="Choose a parent family to create a hierarchical structure, or leave empty for a root-level family"
                searchable
              />

              {selectedParent && selectedParent.value && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center space-x-2 text-blue-700 mb-2">
                    <Layers className="h-4 w-4" />
                    <span className="text-sm font-medium">Selected Parent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedParent.icon}
                    <Badge variant="secondary">
                      {selectedParent.label}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      }

      case 3: {
        return (
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Tags className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Attribute Groups</h2>
                  <p className="text-purple-100 mt-1">Select which attribute groups this family will use</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockAttributeGroups.map(group => {
                  const isSelected = formData.attributeGroups.includes(group.id);
                  return (
                    <button
                      key={group.id}
                      onClick={() => toggleAttributeGroup(group.id)}
                      className={`p-4 border-2 rounded-xl transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          isSelected ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          <Tags className={`h-5 w-5 ${
                            isSelected ? 'text-purple-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{group.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{group.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{group.attributeCount} attributes</p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
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
                            className="ml-1 hover:bg-purple-700 rounded-full p-0.5"
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
      }

      case 4: {
        const selectedCategory = findNodeByValue(categoryTreeOptions, formData.categoryId);
        const selectedParent = findNodeByValue(familyTreeOptions, formData.parentFamilyId);
        
        return (
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Review & Confirm</h2>
                  <p className="text-indigo-100 mt-1">Please review your family details before creating</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Layers className="h-4 w-4 text-blue-600" />
                      </div>
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Name</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{formData.name}</p>
                      </div>
                      
                      {formData.description && (
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Description</label>
                          <p className="text-sm text-gray-700 mt-1 leading-relaxed">{formData.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                        <FolderTree className="h-4 w-4 text-emerald-600" />
                      </div>
                      Relationships
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Category</label>
                        <div className="mt-2 flex items-center space-x-2">
                          {selectedCategory?.icon}
                          <Badge variant="primary">
                            {selectedCategory?.label}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Parent Family</label>
                        <div className="mt-2">
                          {selectedParent && selectedParent.value ? (
                            <div className="flex items-center space-x-2">
                              {selectedParent.icon}
                              <Badge variant="secondary">
                                {selectedParent.label}
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="outline">Root Family</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attribute Groups */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <Tags className="h-4 w-4 text-purple-600" />
                  </div>
                  Attribute Groups ({formData.attributeGroups.length})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.attributeGroups.map(groupId => {
                    const group = mockAttributeGroups.find(g => g.id === groupId);
                    return group ? (
                      <div key={groupId} className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <Tags className="h-5 w-5 text-purple-600" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{group.name}</h4>
                            <p className="text-xs text-gray-500">{group.attributeCount} attributes</p>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Final Hierarchy Display */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                  </div>
                  Complete Hierarchy
                </h3>
                
                <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-dashed border-gray-300 rounded-xl">
                  <div className="flex flex-col space-y-3">
                    {/* Category Level */}
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <FolderTree className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Category</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedCategory?.label}
                        </p>
                      </div>
                    </div>
                    
                    {/* Parent Family Level */}
                    {selectedParent && selectedParent.value && (
                      <>
                        <div className="flex items-center justify-center">
                          <div className="w-px h-6 bg-gray-300"></div>
                        </div>
                        <div className="flex items-center space-x-3 ml-4">
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Layers className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Family</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedParent.label}</p>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* New Family Level */}
                    <div className="flex items-center justify-center">
                      <div className="w-px h-6 bg-gray-300"></div>
                    </div>
                    <div className={`flex items-center space-x-3 ${selectedParent?.value ? 'ml-8' : 'ml-4'}`}>
                      <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Layers className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">New Family</p>
                        <p className="text-sm font-semibold text-emerald-700">{formData.name}</p>
                      </div>
                    </div>
                  </div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/families')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Family</h1>
            <p className="text-gray-600 mt-1">Build your product family structure</p>
          </div>
        </div>

        {/* Stepper */}
        <Card padding="lg" className="shadow-sm">
          <Stepper steps={steps} currentStep={currentStep} />
        </Card>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            size="lg"
          >
            Back
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <div className="w-20 h-1 bg-gray-200 rounded-full">
                <div 
                  className="h-1 bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
            
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                loading={loading}
                disabled={!canProceed()}
                leftIcon={<Check className="h-4 w-4" />}
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                Create Family
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                size="lg"
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};