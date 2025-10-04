import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Layers, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, UserInfo } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Family } from '../../types';

// Mock data
const mockFamilies: Family[] = [
  {
    id: 'fam-1',
    name: 'Coffee Products',
    description: 'Coffee beans, ground coffee, and brewing accessories',
    parentFamilyId: undefined,
    childFamilies: [],
    categoryId: 'cat-2',
    attributeGroups: [],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: 'fam-2',
    name: 'Arabica Coffee',
    description: 'Premium arabica coffee varieties',
    parentFamilyId: 'fam-1',
    childFamilies: [],
    categoryId: 'cat-2',
    attributeGroups: [],
    createdAt: '2024-01-02T09:15:00Z',
    updatedAt: '2024-01-19T16:45:00Z',
  },
  {
    id: 'fam-3',
    name: 'Audio Equipment',
    description: 'Headphones, speakers, and audio accessories',
    parentFamilyId: undefined,
    childFamilies: [],
    categoryId: 'cat-4',
    attributeGroups: [],
    createdAt: '2024-01-03T11:20:00Z',
    updatedAt: '2024-01-22T13:10:00Z',
  },
  {
    id: 'fam-4',
    name: 'Wireless Headphones',
    description: 'Bluetooth and wireless headphone products',
    parentFamilyId: 'fam-3',
    childFamilies: [],
    categoryId: 'cat-4',
    attributeGroups: [],
    createdAt: '2024-01-04T15:30:00Z',
    updatedAt: '2024-01-21T10:20:00Z',
  },
];

const mockCategories = [
  { id: 'cat-2', name: 'Coffee Products' },
  { id: 'cat-4', name: 'Audio Equipment' },
];

export const FamiliesList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const columns = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (value: string, family: Family) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              {family.parentFamilyId && (
                <span className="text-xs text-gray-400">
                  <ChevronRight className="h-3 w-3" />
                </span>
              )}
              <div className="text-sm font-semibold text-gray-900">{value}</div>
            </div>
            <div className="text-xs text-gray-500">ID: {family.id}</div>
          </div>
        </div>
      ),
      mobileRender: (family: Family) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                {family.parentFamilyId && (
                  <span className="text-xs text-gray-400">
                    <ChevronRight className="h-3 w-3" />
                  </span>
                )}
                <div className="text-sm font-semibold text-gray-900">{family.name}</div>
              </div>
              <div className="text-xs text-gray-500">ID: {family.id}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Category</div>
              <Badge variant="secondary" size="sm">
                {mockCategories.find(c => c.id === family.categoryId)?.name || family.categoryId}
              </Badge>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Parent</div>
              {family.parentFamilyId ? (
                <Badge variant="outline" size="sm">
                  {mockFamilies.find(f => f.id === family.parentFamilyId)?.name || family.parentFamilyId}
                </Badge>
              ) : (
                <span className="text-xs text-gray-400">Root Family</span>
              )}
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</div>
            <div className="text-sm text-gray-600">{family.description}</div>
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
      key: 'categoryId',
      title: 'Category',
      render: (value: string) => {
        const category = mockCategories.find(c => c.id === value);
        return (
          <Badge variant="secondary" size="sm">
            {category?.name || value}
          </Badge>
        );
      },
    },
    {
      key: 'parentFamilyId',
      title: 'Parent Family',
      render: (value: string | undefined) => (
        value ? (
          <Badge variant="outline" size="sm">
            {mockFamilies.find(f => f.id === value)?.name || value}
          </Badge>
        ) : (
          <span className="text-xs text-gray-400">Root Family</span>
        )
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
      key: 'categoryId',
      label: 'All Categories',
      type: 'select' as const,
      options: [
        { value: 'cat-2', label: 'Coffee Products' },
        { value: 'cat-4', label: 'Audio Equipment' },
      ]
    },
    {
      key: 'parentFamilyId',
      label: 'Family Type',
      type: 'select' as const,
      options: [
        { value: 'root', label: 'Root Families' },
        { value: 'child', label: 'Child Families' },
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('families.title')}
        subtitle={t('families.subtitle')}
        action={
          <Button onClick={() => navigate('/families/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Family
          </Button>
        }
      />
      
      <div className="flex-1 mt-6">
        <DataTable
          data={mockFamilies}
          columns={columns}
          searchPlaceholder="Search families..."
          filters={filters}
          onRowClick={(family) => navigate(`/families/${family.id}`)}
          emptyState={{
            icon: <Layers className="h-12 w-12" />,
            title: 'No families found',
            description: 'Get started by creating your first family',
            action: (
              <Button onClick={() => navigate('/families/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Family
              </Button>
            )
          }}
        />
      </div>
    </div>
  );
};