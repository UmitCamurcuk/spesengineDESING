import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from './DataTable';
import { Badge } from './Badge';
import { Button } from './Button';
import { UserInfo } from './DataTable';

// Mock data for stories
const mockData = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'inactive',
    createdAt: '2024-01-14T14:20:00Z',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Moderator',
    status: 'active',
    createdAt: '2024-01-13T09:15:00Z',
  },
];

const meta: Meta<typeof DataTable> = {
  title: 'UI/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A powerful data table component with sorting, filtering, and pagination.',
      },
    },
  },
  argTypes: {
    data: {
      description: 'Array of data objects to display',
    },
    columns: {
      description: 'Array of column configurations',
    },
    searchPlaceholder: {
      control: { type: 'text' },
      description: 'Placeholder text for the search input',
    },
    pageSize: {
      control: { type: 'number' },
      description: 'Number of items per page',
    },
    showPagination: {
      control: { type: 'boolean' },
      description: 'Whether to show pagination controls',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const columns = [
  {
    key: 'name',
    title: 'Name',
    sortable: true,
    render: (value: string, item: any) => (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-white">
            {value.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{item.email}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'role',
    title: 'Role',
    sortable: true,
    render: (value: string) => (
      <Badge variant="outline" size="sm">
        {value}
      </Badge>
    ),
  },
  {
    key: 'status',
    title: 'Status',
    sortable: true,
    render: (value: string) => (
      <Badge variant={value === 'active' ? 'success' : 'error'} size="sm">
        {value}
      </Badge>
    ),
  },
  {
    key: 'createdAt',
    title: 'Created',
    sortable: true,
    render: (value: string) => (
      <span className="text-sm text-muted-foreground">
        {new Date(value).toLocaleDateString()}
      </span>
    ),
  },
  {
    key: 'actions',
    title: 'Actions',
    render: () => (
      <div className="flex space-x-2">
        <Button size="sm" variant="outline">Edit</Button>
        <Button size="sm" variant="destructive">Delete</Button>
      </div>
    ),
  },
];

export const Default: Story = {
  args: {
    data: mockData,
    columns,
    searchPlaceholder: 'Search users...',
  },
};

export const WithPagination: Story = {
  args: {
    data: mockData,
    columns,
    searchPlaceholder: 'Search users...',
    pageSize: 2,
    showPagination: true,
  },
};

export const WithoutPagination: Story = {
  args: {
    data: mockData,
    columns,
    searchPlaceholder: 'Search users...',
    showPagination: false,
  },
};

export const EmptyState: Story = {
  args: {
    data: [],
    columns,
    searchPlaceholder: 'Search users...',
    emptyState: {
      icon: <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
        <span className="text-2xl">👥</span>
      </div>,
      title: 'No users found',
      description: 'Get started by creating your first user',
      action: <Button>Create User</Button>,
    },
  },
};

export const WithFilters: Story = {
  args: {
    data: mockData,
    columns,
    searchPlaceholder: 'Search users...',
    filters: [
      {
        key: 'role',
        label: 'Role',
        type: 'select',
        options: [
          { value: 'admin', label: 'Admin' },
          { value: 'user', label: 'User' },
          { value: 'moderator', label: 'Moderator' },
        ],
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      },
    ],
  },
};

