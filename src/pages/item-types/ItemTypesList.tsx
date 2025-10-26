import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Database } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, UserInfo } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ItemType } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';

// Mock data
const mockItemTypes: ItemType[] = [
  {
    id: 'type-1',
    name: 'Product',
    description: 'Physical products and goods',
    categoryIds: ['cat-1', 'cat-2'],
    attributeGroups: [],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: 'type-2',
    name: 'Service',
    description: 'Service offerings and subscriptions',
    categoryIds: ['cat-3'],
    attributeGroups: [],
    createdAt: '2024-01-05T09:15:00Z',
    updatedAt: '2024-01-19T16:45:00Z',
  },
  {
    id: 'type-3',
    name: 'Digital Asset',
    description: 'Digital products and licenses',
    categoryIds: ['cat-2', 'cat-4'],
    attributeGroups: [],
    createdAt: '2024-01-10T11:20:00Z',
    updatedAt: '2024-01-22T13:10:00Z',
  },
];

export const ItemTypesList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const canCreateItemType = hasPermission(PERMISSIONS.CATALOG.ITEM_TYPES.CREATE);

  const columns = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (value: string, itemType: ItemType) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{value}</div>
            <div className="text-xs text-gray-500">ID: {itemType.id}</div>
          </div>
        </div>
      ),
      mobileRender: (itemType: ItemType) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">{itemType.name}</div>
              <div className="text-xs text-gray-500">ID: {itemType.id}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Categories</div>
              <div className="flex flex-wrap gap-1">
                {itemType.categoryIds.slice(0, 2).map((categoryId, index) => (
                  <Badge key={index} variant="secondary" size="sm">
                    Cat {categoryId.split('-')[1]}
                  </Badge>
                ))}
                {itemType.categoryIds.length > 2 && (
                  <span className="text-xs text-gray-400">+{itemType.categoryIds.length - 2}</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Updated</div>
              <div className="text-sm text-gray-600">
                {new Date(itemType.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</div>
            <div className="text-sm text-gray-600">{itemType.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value}</span>
      ),
    },
    {
      key: 'categoryIds',
      title: 'Categories',
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 2).map((categoryId, index) => (
            <Badge key={index} variant="secondary" size="sm">
              Category {categoryId.split('-')[1]}
            </Badge>
          ))}
          {value.length > 2 && (
            <span className="text-xs text-gray-400">+{value.length - 2} more</span>
          )}
        </div>
      ),
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      sortable: true,
      render: (value: string) => (
        <UserInfo
          name="Admin User"
          email="admin@company.com"
          date={value}
        />
      ),
    },
  ];

  const filters = [
    {
      key: 'categoryIds',
      label: 'All Categories',
      type: 'select' as const,
      options: [
        { value: 'cat-1', label: 'Category 1' },
        { value: 'cat-2', label: 'Category 2' },
        { value: 'cat-3', label: 'Category 3' },
        { value: 'cat-4', label: 'Category 4' },
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('item_types.title')}
        subtitle={t('item_types.subtitle')}
        action={
          canCreateItemType ? (
            <Button onClick={() => navigate('/item-types/create')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('item_types.create_title')}
            </Button>
          ) : null
        }
      />
      
      <div className="flex-1 mt-6">
        <DataTable
          data={mockItemTypes}
          columns={columns}
          searchPlaceholder="Search item types..."
          filters={filters}
          onRowClick={(itemType) => navigate(`/item-types/${itemType.id}`)}
          emptyState={{
            icon: <Database className="h-12 w-12" />,
            title: 'No item types found',
            description: 'Get started by creating your first item type',
            action: canCreateItemType
              ? (
                  <Button onClick={() => navigate('/item-types/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Item Type
                  </Button>
                )
              : undefined,
          }}
        />
      </div>
    </div>
  );
};
