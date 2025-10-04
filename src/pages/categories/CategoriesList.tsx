import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderTree, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, UserInfo } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Category } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

// Mock data
const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Food & Beverage',
    description: 'All food and beverage products',
    parentCategoryId: undefined,
    childCategories: [],
    familyIds: ['fam-1', 'fam-4'],
    itemTypeIds: ['type-1'],
    attributeGroups: [],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: 'cat-2',
    name: 'Coffee Products',
    description: 'Coffee beans, ground coffee, and related products',
    parentCategoryId: 'cat-1',
    childCategories: [],
    familyIds: ['fam-1'],
    itemTypeIds: ['type-1'],
    attributeGroups: [],
    createdAt: '2024-01-02T09:15:00Z',
    updatedAt: '2024-01-19T16:45:00Z',
  },
  {
    id: 'cat-3',
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
    parentCategoryId: undefined,
    childCategories: [],
    familyIds: ['fam-2', 'fam-3'],
    itemTypeIds: ['type-1', 'type-3'],
    attributeGroups: [],
    createdAt: '2024-01-03T11:20:00Z',
    updatedAt: '2024-01-22T13:10:00Z',
  },
  {
    id: 'cat-4',
    name: 'Audio Equipment',
    description: 'Headphones, speakers, and audio accessories',
    parentCategoryId: 'cat-3',
    childCategories: [],
    familyIds: ['fam-2'],
    itemTypeIds: ['type-1'],
    attributeGroups: [],
    createdAt: '2024-01-04T15:30:00Z',
    updatedAt: '2024-01-21T10:20:00Z',
  },
];

export const CategoriesList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const columns = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (value: string, category: Category) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-sm">
            <FolderTree className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              {category.parentCategoryId && (
                <span className="text-xs text-gray-400">
                  <ChevronRight className="h-3 w-3" />
                </span>
              )}
              <div className="text-sm font-semibold text-gray-900">{value}</div>
            </div>
            <div className="text-xs text-gray-500">ID: {category.id}</div>
          </div>
        </div>
      ),
      mobileRender: (category: Category) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-sm">
              <FolderTree className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                {category.parentCategoryId && (
                  <span className="text-xs text-gray-400">
                    <ChevronRight className="h-3 w-3" />
                  </span>
                )}
                <div className="text-sm font-semibold text-gray-900">{category.name}</div>
              </div>
              <div className="text-xs text-gray-500">ID: {category.id}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Parent</div>
              {category.parentCategoryId ? (
                <Badge variant="outline" size="sm">
                  {mockCategories.find(c => c.id === category.parentCategoryId)?.name || category.parentCategoryId}
                </Badge>
              ) : (
                <span className="text-xs text-gray-400">Root Category</span>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Families</div>
              <div className="text-sm text-gray-600">{category.familyIds.length} families</div>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</div>
            <div className="text-sm text-gray-600">{category.description}</div>
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
      key: 'parentCategoryId',
      title: 'Parent Category',
      render: (value: string | undefined) => (
        value ? (
          <Badge variant="outline" size="sm">
            {mockCategories.find(c => c.id === value)?.name || value}
          </Badge>
        ) : (
          <span className="text-xs text-gray-400">Root Category</span>
        )
      ),
    },
    {
      key: 'familyIds',
      title: 'Families',
      render: (value: string[]) => (
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-600">{value.length}</span>
          <span className="text-xs text-gray-400">families</span>
        </div>
      ),
    },
    {
      key: 'itemTypeIds',
      title: 'Item Types',
      render: (value: string[]) => (
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-600">{value.length}</span>
          <span className="text-xs text-gray-400">types</span>
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
      key: 'parentCategoryId',
      label: 'All Types',
      type: 'select' as const,
      options: [
        { value: 'root', label: 'Root Categories' },
        { value: 'child', label: 'Child Categories' },
      ]
    },
    {
      key: 'itemTypeIds',
      label: 'Item Types',
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
        title={t('categories.title')}
        subtitle={t('categories.subtitle')}
        action={
          <Button onClick={() => navigate('/categories/create')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('categories.create_title')}
          </Button>
        }
      />
      
      <div className="flex-1 mt-6">
        <DataTable
          data={mockCategories}
          columns={columns}
          searchPlaceholder="Search categories..."
          filters={filters}
          onRowClick={(category) => navigate(`/categories/${category.id}`)}
          emptyState={{
            icon: <FolderTree className="h-12 w-12" />,
            title: 'No categories found',
            description: 'Get started by creating your first category',
            action: (
              <Button onClick={() => navigate('/categories/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            )
          }}
        />
      </div>
    </div>
  );
};