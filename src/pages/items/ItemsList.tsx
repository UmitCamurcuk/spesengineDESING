import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit2, Trash2, Package } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, UserInfo } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Item } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';

// Mock data
const mockItems: Item[] = [
  {
    id: '1',
    name: 'Premium Coffee Beans',
    itemTypeId: 'type-1',
    categoryId: 'cat-1',
    familyId: 'fam-1',
    attributeValues: {
      price: 29.99,
      weight: '500g',
      origin: 'Colombia',
    },
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: '2',
    name: 'Wireless Headphones',
    itemTypeId: 'type-2',
    categoryId: 'cat-2',
    familyId: 'fam-2',
    attributeValues: {
      price: 199.99,
      brand: 'TechSound',
      color: 'Black',
    },
    status: 'draft',
    createdAt: '2024-01-18T09:15:00Z',
    updatedAt: '2024-01-19T16:45:00Z',
  },
  {
    id: '3',
    name: 'Office Chair',
    itemTypeId: 'type-3',
    categoryId: 'cat-3',
    familyId: 'fam-3',
    attributeValues: {
      price: 299.99,
      material: 'Leather',
      adjustable: true,
    },
    status: 'inactive',
    createdAt: '2024-01-10T11:20:00Z',
    updatedAt: '2024-01-22T13:10:00Z',
  },
];

export const ItemsList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const canCreateItem = hasPermission(PERMISSIONS.CATALOG.ITEMS.CREATE);

  const columns = [
    {
      key: 'name',
      title: t('items.name'),
      sortable: true,
      render: (value: string, item: Item) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{value}</div>
            <div className="text-xs text-gray-500">ID: {item.id}</div>
          </div>
        </div>
      ),
      mobileRender: (item: Item) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">{item.name}</div>
              <div className="text-xs text-gray-500">ID: {item.id}</div>
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
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type</div>
              <Badge variant="primary" size="sm">
                Type {item.itemTypeId.split('-')[1]}
              </Badge>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Category</div>
              <Badge variant="secondary" size="sm">
                Cat {item.categoryId.split('-')[1]}
              </Badge>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Family</div>
              <Badge variant="secondary" size="sm">
                Fam {item.familyId.split('-')[1]}
              </Badge>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'itemTypeId',
      title: t('items.type'),
      render: (value: string) => (
        <Badge variant="primary" size="sm">
          Type {value.split('-')[1]}
        </Badge>
      ),
    },
    {
      key: 'categoryId',
      title: t('items.category'),
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          Category {value.split('-')[1]}
        </Badge>
      ),
    },
    {
      key: 'familyId',
      title: t('items.family'),
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          Family {value.split('-')[1]}
        </Badge>
      ),
    },
    {
      key: 'status',
      title: t('items.status'),
      sortable: true,
      render: (value: string) => (
        <Badge
          variant={
            value === 'active' ? 'success' :
            value === 'draft' ? 'warning' : 'default'
          }
          size="sm"
        >
          {value}
        </Badge>
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
      key: 'status',
      label: 'All Statuses',
      type: 'select' as const,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'draft', label: 'Draft' },
        { value: 'inactive', label: 'Inactive' },
      ]
    },
    {
      key: 'itemTypeId',
      label: 'Item Type',
      type: 'select' as const,
      options: [
        { value: 'type-1', label: 'Type 1' },
        { value: 'type-2', label: 'Type 2' },
        { value: 'type-3', label: 'Type 3' },
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('items.title')}
        subtitle={t('items.subtitle')}
        action={
          canCreateItem ? (
            <Button onClick={() => navigate('/items/create')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('items.create_title')}
            </Button>
          ) : null
        }
      />
      
      <div className="flex-1 mt-6">
        <DataTable
          data={mockItems}
          columns={columns}
          searchPlaceholder={t('items.search_placeholder')}
          filters={filters}
          onRowClick={(item) => navigate(`/items/${item.id}`)}
          emptyState={{
            icon: <Package className="h-12 w-12" />,
            title: t('items.no_items'),
            description: t('items.create_new_item'),
            action: canCreateItem ? (
              <Button onClick={() => navigate('/items/create')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('items.create_title')}
              </Button>
            ) : undefined,
          }}
        />
      </div>
    </div>
  );
};
