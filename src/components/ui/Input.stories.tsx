import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { Search, Mail, Lock, User } from 'lucide-react';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile input component with various states and configurations.',
      },
    },
  },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
      description: 'The type of input',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'error', 'success'],
      description: 'The visual variant of the input',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'The size of the input',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text',
    },
    label: {
      control: { type: 'text' },
      description: 'Label for the input',
    },
    helperText: {
      control: { type: 'text' },
      description: 'Helper text below the input',
    },
    error: {
      control: { type: 'text' },
      description: 'Error message',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
    label: 'Name',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    type: 'email',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    helperText: 'Must be at least 8 characters long',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
    error: 'Please enter a valid email address',
    variant: 'error',
  },
};

export const WithLeftIcon: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search...',
    leftIcon: <Search className="h-4 w-4" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    rightIcon: <Lock className="h-4 w-4" />,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'This input is disabled',
    disabled: true,
  },
};

export const Small: Story = {
  args: {
    label: 'Small Input',
    placeholder: 'Small size',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    label: 'Large Input',
    placeholder: 'Large size',
    size: 'lg',
  },
};

export const AllTypes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input label="Text" placeholder="Text input" />
      <Input label="Email" type="email" placeholder="Email input" />
      <Input label="Password" type="password" placeholder="Password input" />
      <Input label="Number" type="number" placeholder="Number input" />
      <Input label="Tel" type="tel" placeholder="Phone input" />
      <Input label="URL" type="url" placeholder="URL input" />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input label="Default" placeholder="Default variant" />
      <Input label="Error" placeholder="Error variant" error="This field has an error" variant="error" />
      <Input label="Success" placeholder="Success variant" variant="success" />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input label="Small" placeholder="Small size" size="sm" />
      <Input label="Medium" placeholder="Medium size" size="md" />
      <Input label="Large" placeholder="Large size" size="lg" />
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input label="Search" placeholder="Search..." leftIcon={<Search className="h-4 w-4" />} />
      <Input label="Email" placeholder="Email" leftIcon={<Mail className="h-4 w-4" />} />
      <Input label="User" placeholder="Username" leftIcon={<User className="h-4 w-4" />} />
      <Input label="Password" type="password" placeholder="Password" rightIcon={<Lock className="h-4 w-4" />} />
    </div>
  ),
};
