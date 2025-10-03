import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderTree, Layers, Database, Package } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Category } from '../../types';

// Mock data
const mockCategory: Category = {
  id: 'cat-1',
  name: 'Food & Beverage',
  description: 'All food and beverage products including coffee, tea, snacks, and meals',
  parentCategoryId: undefined,
  childCategories: [],
  familyIds: ['fam-1', 'fam-4'],
  itemTypeIds: ['type-1'],
  attributeGroups: [],
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-20T14:30:00Z',
};

const mockChildCategories = [
  { id: 'cat-2', name: 'Coffee Products' },
  { id: 'cat-5', name: 'Tea Products' },
  { id: 'cat-6', name: 'Snacks' },
];

const mockFamilies = [
  { id: 'fam-1', name: 'Coffee Products' },
  { id: 'fam-4', name: 'Beverages' },
];

const mockItemTypes = [
  { id: 'type-1', name: 'Product' },
];

const mockItems = [
  { id: '1', name: 'Premium Coffee Beans', status: 'active' },
  { id: '2', name: 'Herbal Tea', status: 'active' },
  { id: '3', name: 'Energy Drink', status: 'draft' },
  { id: '4', name: 'Protein Bar', status: 'active' },
];

export const CategoriesDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="Category Information" />
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <FolderTree className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{mockCategory.name}</h3>
                  <p className="text-sm text-gray-500">ID: {mockCategory.id}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900 mt-1">{mockCategory.description}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Parent Category</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {mockCategory.parentCategoryId ? (
                      <Badge variant="outline" size="sm">
                        Parent Category
                      </Badge>
                    ) : (
                      <span className="text-gray-500">Root Category</span>
                    )}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(mockCategory.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(mockCategory.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Related Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Child Categories */}
          <Card>
            <CardHeader 
              title="Child Categories" 
              subtitle="Subcategories under this category"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockChildCategories.map(category => (
                <div
                  key={category.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/categories/${category.id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <FolderTree className="h-6 w-6 text-teal-600" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
                      <p className="text-xs text-gray-500">ID: {category.id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Associated Families */}
          <Card>
            <CardHeader 
              title="Associated Families" 
              subtitle="Families that belong to this category"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockFamilies.map(family => (
                <div
                  key={family.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/families/${family.id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <Layers className="h-6 w-6 text-emerald-600" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{family.name}</h4>
                      <p className="text-xs text-gray-500">ID: {family.id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Associated Item Types */}
          <Card>
            <CardHeader 
              title="Associated Item Types" 
              subtitle="Item types that use this category"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockItemTypes.map(itemType => (
                <div
                  key={itemType.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/item-types/${itemType.id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <Database className="h-6 w-6 text-indigo-600" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{itemType.name}</h4>
                      <p className="text-xs text-gray-500">ID: {itemType.id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Items in this Category */}
          <Card>
            <CardHeader 
              title="Items in This Category" 
              subtitle="All items that belong to this category"
              action={
                <Button variant="outline" size="sm" onClick={() => navigate('/items')}>
                  View All Items
                </Button>
              }
            />
            <div className="space-y-3">
              {mockItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  onClick={() => navigate(`/items/${item.id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                      <p className="text-xs text-gray-500">ID: {item.id}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      item.status === 'active' ? 'success' :
                      item.status === 'draft' ? 'warning' : 'default'
                    }
                    size="sm"
                  >
                    {item.status}
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