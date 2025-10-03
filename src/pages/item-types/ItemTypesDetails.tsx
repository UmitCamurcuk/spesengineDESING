import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, FolderTree, Tags } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ItemType } from '../../types';

// Mock data
const mockItemType: ItemType = {
  id: 'type-1',
  name: 'Product',
  description: 'Physical products and goods that can be sold or distributed',
  categoryIds: ['cat-1', 'cat-2', 'cat-3'],
  attributeGroups: [],
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-20T14:30:00Z',
};

const mockCategories = [
  { id: 'cat-1', name: 'Food & Beverage' },
  { id: 'cat-2', name: 'Electronics' },
  { id: 'cat-3', name: 'Home & Garden' },
];

const mockItems = [
  { id: '1', name: 'Premium Coffee Beans', status: 'active' },
  { id: '2', name: 'Wireless Headphones', status: 'draft' },
  { id: '3', name: 'Smart Watch', status: 'active' },
  { id: '4', name: 'Office Chair', status: 'active' },
  { id: '5', name: 'Running Shoes', status: 'inactive' },
];

export const ItemTypesDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Item Type Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="Item Type Information" />
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{mockItemType.name}</h3>
                  <p className="text-sm text-gray-500">ID: {mockItemType.id}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900 mt-1">{mockItemType.description}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(mockItemType.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(mockItemType.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Categories and Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Associated Categories */}
          <Card>
            <CardHeader 
              title="Associated Categories" 
              subtitle="Categories that use this item type"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockCategories.map(category => (
                <div
                  key={category.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 cursor-pointer"
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

          {/* Items using this type */}
          <Card>
            <CardHeader 
              title="Items Using This Type" 
              subtitle="All items that belong to this item type"
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
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <Tags className="h-4 w-4 text-white" />
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