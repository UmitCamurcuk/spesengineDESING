import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import { User } from '../api/types/api.types';

// Mock providers for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock user for testing
export const mockUser: User = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: '1',
  updatedBy: '1',
};

// Mock API responses
export const mockApiResponse = <T>(data: T) => ({
  data,
  message: 'Success',
  success: true,
  timestamp: new Date().toISOString(),
});

export const mockPaginatedResponse = <T>(data: T[], total: number = data.length) => ({
  data,
  pagination: {
    page: 1,
    limit: 20,
    total,
    totalPages: Math.ceil(total / 20),
    hasNext: false,
    hasPrev: false,
  },
  message: 'Success',
  success: true,
  timestamp: new Date().toISOString(),
});

// Mock items
export const mockItems = [
  {
    id: '1',
    name: 'Test Item 1',
    description: 'Test Description 1',
    type: 'Type 1',
    category: 'Category 1',
    family: 'Family 1',
    status: 'active' as const,
    attributes: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: '1',
    updatedBy: '1',
  },
  {
    id: '2',
    name: 'Test Item 2',
    description: 'Test Description 2',
    type: 'Type 2',
    category: 'Category 2',
    family: 'Family 2',
    status: 'draft' as const,
    attributes: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: '1',
    updatedBy: '1',
  },
];

// Mock categories
export const mockCategories = [
  {
    id: '1',
    name: 'Test Category 1',
    description: 'Test Description 1',
    parentId: undefined,
    level: 0,
    path: 'Test Category 1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: '1',
    updatedBy: '1',
  },
  {
    id: '2',
    name: 'Test Category 2',
    description: 'Test Description 2',
    parentId: '1',
    level: 1,
    path: 'Test Category 1 > Test Category 2',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: '1',
    updatedBy: '1',
  },
];

// Mock families
export const mockFamilies = [
  {
    id: '1',
    name: 'Test Family 1',
    description: 'Test Description 1',
    categoryId: '1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: '1',
    updatedBy: '1',
  },
  {
    id: '2',
    name: 'Test Family 2',
    description: 'Test Description 2',
    categoryId: '2',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: '1',
    updatedBy: '1',
  },
];

// Test utilities
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockFetch = (response: any, status: number = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(response),
  });
};

export const mockFetchError = (message: string = 'Network Error') => {
  global.fetch = vi.fn().mockRejectedValue(new Error(message));
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };

