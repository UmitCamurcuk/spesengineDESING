# UI Components

This directory contains all the reusable UI components for the SpesEngine application.

## Components

### Button
A versatile button component with multiple variants and sizes.

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
- `size`: 'sm' | 'md' | 'lg'
- `disabled`: boolean
- `loading`: boolean
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode

### Input
A form input component with various states and configurations.

**Props:**
- `type`: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
- `variant`: 'default' | 'error' | 'success'
- `size`: 'sm' | 'md' | 'lg'
- `label`: string
- `helperText`: string
- `error`: string
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode

### Card
A flexible card component for displaying content in a structured way.

**Props:**
- `variant`: 'default' | 'outline' | 'elevated'
- `className`: string

### DataTable
A powerful data table component with sorting, filtering, and pagination.

**Props:**
- `data`: Array of data objects
- `columns`: Array of column configurations
- `searchPlaceholder`: string
- `pageSize`: number
- `showPagination`: boolean
- `filters`: Array of filter configurations
- `emptyState`: Empty state configuration

### Modal
A modal dialog component for overlays and forms.

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `children`: ReactNode
- `size`: 'sm' | 'md' | 'lg' | 'xl'

### Select
A dropdown select component.

**Props:**
- `options`: Array of option objects
- `value`: string
- `onChange`: (value: string) => void
- `placeholder`: string
- `disabled`: boolean

### Badge
A small status indicator component.

**Props:**
- `variant`: 'default' | 'success' | 'error' | 'warning' | 'info'
- `size`: 'sm' | 'md' | 'lg'

## Usage

```tsx
import { Button, Input, Card } from '@/components/ui';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Card</CardTitle>
      </CardHeader>
      <CardContent>
        <Input label="Name" placeholder="Enter your name" />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  );
}
```

## Styling

All components use Tailwind CSS classes and are theme-aware. They automatically adapt to light and dark themes.

## Accessibility

All components include proper ARIA attributes and keyboard navigation support.

