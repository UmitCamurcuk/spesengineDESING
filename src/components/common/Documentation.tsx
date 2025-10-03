import React, { useState } from 'react';
import { FileText, Edit2, Save, Plus, Trash2, Eye, Code, Type, Hash } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { DocumentationSection } from '../../types/common';

interface DocumentationProps {
  entityType: string;
  entityId: string;
  editMode?: boolean;
}

// Mock documentation sections
const mockDocumentationSections: DocumentationSection[] = [
  {
    id: '1',
    title: 'Overview',
    content: `# Attribute Overview

This attribute represents the status of a product in the system. It's a required field that helps categorize and filter products based on their current state.

## Usage
- **Active**: Product is live and available
- **Draft**: Product is being prepared
- **Inactive**: Product is temporarily unavailable

## Validation Rules
- Must be one of the predefined values
- Cannot be empty for required items
- Automatically defaults to 'draft' for new items`,
    order: 1,
    type: 'markdown',
    lastUpdated: '2024-01-25T10:30:00Z',
    author: 'John Doe'
  },
  {
    id: '2',
    title: 'Implementation Guide',
    content: `# Implementation Guide

## Frontend Integration

\`\`\`javascript
// Example usage in React
const ProductStatus = ({ value, onChange }) => {
  const options = ['active', 'draft', 'inactive'];
  
  return (
    <select value={value} onChange={onChange}>
      {options.map(option => (
        <option key={option} value={option}>
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </option>
      ))}
    </select>
  );
};
\`\`\`

## Backend Validation

\`\`\`python
def validate_product_status(value):
    allowed_values = ['active', 'draft', 'inactive']
    if value not in allowed_values:
        raise ValidationError(f"Invalid status: {value}")
    return value
\`\`\``,
    order: 2,
    type: 'markdown',
    lastUpdated: '2024-01-24T15:45:00Z',
    author: 'Jane Smith'
  },
  {
    id: '3',
    title: 'API Reference',
    content: `# API Reference

## Endpoints

### GET /api/attributes/product-status
Get the current product status attribute configuration.

**Response:**
\`\`\`json
{
  "id": "attr-1",
  "name": "Product Status",
  "type": "select",
  "options": ["active", "draft", "inactive"],
  "required": true,
  "defaultValue": "draft"
}
\`\`\`

### POST /api/items/{id}/status
Update the status of a specific item.

**Request Body:**
\`\`\`json
{
  "status": "active"
}
\`\`\``,
    order: 3,
    type: 'markdown',
    lastUpdated: '2024-01-23T09:20:00Z',
    author: 'Mike Johnson'
  }
];

export const Documentation: React.FC<DocumentationProps> = ({
  entityType,
  entityId,
  editMode = false
}) => {
  const [sections, setSections] = useState(mockDocumentationSections);
  const [selectedSection, setSelectedSection] = useState<DocumentationSection | null>(sections[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<DocumentationSection | null>(null);

  const handleEditSection = (section: DocumentationSection) => {
    setEditingSection({ ...section });
    setIsEditing(true);
  };

  const handleSaveSection = () => {
    if (!editingSection) return;

    setSections(prev => prev.map(section => 
      section.id === editingSection.id ? editingSection : section
    ));
    
    if (selectedSection?.id === editingSection.id) {
      setSelectedSection(editingSection);
    }
    
    setIsEditing(false);
    setEditingSection(null);
  };

  const handleAddSection = () => {
    const newSection: DocumentationSection = {
      id: Date.now().toString(),
      title: 'New Section',
      content: '# New Section\n\nAdd your content here...',
      order: sections.length + 1,
      type: 'markdown',
      lastUpdated: new Date().toISOString(),
      author: 'Current User'
    };
    
    setSections(prev => [...prev, newSection]);
    setEditingSection(newSection);
    setSelectedSection(newSection);
    setIsEditing(true);
  };

  const handleDeleteSection = (sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId));
    if (selectedSection?.id === sectionId) {
      setSelectedSection(sections[0] || null);
    }
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering (in a real app, use a proper markdown library)
    return content
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-900 mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-gray-800 mb-3 mt-6">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium text-gray-700 mb-2 mt-4">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Documentation</h3>
          <p className="text-sm text-gray-500">Comprehensive documentation for this {entityType}</p>
        </div>
        {editMode && (
          <Button onClick={handleAddSection} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sections List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="Sections" />
            <div className="space-y-2">
              {sections.map((section) => (
                <div key={section.id} className="group">
                  <button
                    onClick={() => setSelectedSection(section)}
                    className={`w-full p-3 text-left border rounded-lg transition-all duration-200 ${
                      selectedSection?.id === section.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{section.title}</span>
                      </div>
                      <Badge variant="outline" size="sm">{section.order}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Updated {new Date(section.lastUpdated).toLocaleDateString()}
                    </p>
                  </button>
                  
                  {editMode && (
                    <div className="flex items-center space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSection(section)}
                        className="p-1"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card>
            {selectedSection && (
              <>
                <CardHeader 
                  title={isEditing ? 'Edit Section' : selectedSection.title}
                  subtitle={isEditing ? 'Make your changes below' : `Last updated by ${selectedSection.author}`}
                  action={
                    editMode && !isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSection(selectedSection)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    ) : isEditing ? (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsEditing(false);
                            setEditingSection(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveSection}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    ) : null
                  }
                />
                
                {isEditing && editingSection ? (
                  <div className="space-y-4">
                    <Input
                      label="Section Title"
                      value={editingSection.title}
                      onChange={(e) => setEditingSection(prev => prev ? { ...prev, title: e.target.value } : null)}
                    />
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Content
                      </label>
                      <textarea
                        value={editingSection.content}
                        onChange={(e) => setEditingSection(prev => prev ? { ...prev, content: e.target.value } : null)}
                        rows={20}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        placeholder="Enter content in Markdown format..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: renderMarkdown(selectedSection.content) 
                      }} 
                    />
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};