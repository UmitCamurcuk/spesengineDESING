import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible card component for displaying content in a structured way.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'outline', 'elevated'],
      description: 'The visual variant of the card',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the card content. It can contain any React elements.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card with Footer</CardTitle>
        <CardDescription>This card includes a footer section</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const Outline: Story = {
  render: () => (
    <Card variant="outline" className="w-80">
      <CardHeader>
        <CardTitle>Outline Card</CardTitle>
        <CardDescription>This card has an outline variant</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Content for the outline card.</p>
      </CardContent>
    </Card>
  ),
};

export const Elevated: Story = {
  render: () => (
    <Card variant="elevated" className="w-80">
      <CardHeader>
        <CardTitle>Elevated Card</CardTitle>
        <CardDescription>This card has an elevated appearance</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Content for the elevated card.</p>
      </CardContent>
    </Card>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Card with Badge</CardTitle>
          <Badge variant="success">Active</Badge>
        </div>
        <CardDescription>This card includes a status badge</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Content with a status indicator.</p>
      </CardContent>
    </Card>
  ),
};

export const MultipleActions: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Multiple Actions</CardTitle>
        <CardDescription>Card with multiple action buttons</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Content for the card with multiple actions.</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </CardFooter>
    </Card>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Long Content Card</CardTitle>
        <CardDescription>This card demonstrates how it handles longer content</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          This is a longer piece of content that demonstrates how the card component
          handles text that spans multiple lines. The card will automatically adjust
          its height to accommodate the content while maintaining proper spacing
          and visual hierarchy.
        </p>
        <p className="mt-4">
          Additional paragraphs will be properly spaced and formatted within the card.
        </p>
      </CardContent>
      <CardFooter>
        <Button>Read More</Button>
      </CardFooter>
    </Card>
  ),
};

export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Card 1</CardTitle>
          <CardDescription>First card in the grid</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content for the first card.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Card 2</CardTitle>
          <CardDescription>Second card in the grid</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content for the second card.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Card 3</CardTitle>
          <CardDescription>Third card in the grid</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content for the third card.</p>
        </CardContent>
      </Card>
    </div>
  ),
};

