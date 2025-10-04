import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, FolderTree, Package } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Family } from '../../types';

// Mock data
const mockFamily: Family = {
  id: 'fam-1',
  name: 'Coffee Products',
  description: 'Premium coffee beans, ground coffee, and brewing accessories for coffee enthusiasts',
  parentFamilyId: undefined,
  childFamilies: [],
  categoryId: 'cat-2',
  attributeGroups: [],
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-20T14:30:00Z',
};

const mockChildFamilies = [
  { id: 'fam-2', name: 'Arabica Coffee' },
  { id: 'fam-5', name: 'Robusta Coffee' },
  { id: 'fam-6', name: 'Coffee Accessories' },
];

const mockCategory = { id: 'cat-2', name: 'Coffee Products' };

const mockItems = [
  { id: '1', name: 'Premium Coffee Beans', status: 'active' },
  { id: '2', name: 'Colombian Single Origin', status: 'active' },
  { id: '3', name: 'French Roast Ground Coffee', status: 'draft' },
  { id: '4', name: 'Espresso Blend', status: 'active' },
  { id: '5', name: 'Decaf Coffee Beans', status: 'active' },
];

export const FamiliesDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Family Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="Family Information" />
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{mockFamily.name}</h3>
                  <p className="text-sm text-gray-500">ID: {mockFamily.id}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900 mt-1">{mockFamily.description}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <div className="mt-1">
                    <Badge variant="secondary" size="sm">
                      {mockCategory.name}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Parent Family</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {mockFamily.parentFamilyId ? (
                      <Badge variant="outline" size="sm">
                        Parent Family
                      </Badge>
                    ) : (
                      <span className="text-gray-500">Root Family</span>
                    )}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(mockFamily.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(mockFamily.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Related Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Child Families */}
          <Card>
            <CardHeader 
              title="Child Families" 
              subtitle="Sub-families under this family"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockChildFamilies.map(family => (
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

          {/* Associated Category */}
          <Card>
            <CardHeader 
              title="Associated Category" 
              subtitle="The category this family belongs to"
            />
            <div
              className="p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-all duration-200 cursor-pointer w-fit"
              onClick={() => navigate(`/categories/${mockCategory.id}`)}
            >
              <div className="flex items-center space-x-3">
                <FolderTree className="h-6 w-6 text-teal-600" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{mockCategory.name}</h4>
                  <p className="text-xs text-gray-500">ID: {mockCategory.id}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Items in this Family */}
          <Card>
            <CardHeader 
              title="Items in This Family" 
              subtitle="All items that belong to this family"
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
                  className="flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors cursor-pointer"
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