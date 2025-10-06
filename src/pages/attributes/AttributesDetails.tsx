import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  FileText, 
  Tags, 
  Bell, 
  BarChart3, 
  Globe, 
  BookOpen, 
  History,
  X
} from 'lucide-react';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { AttributeRenderer } from '../../components/attributes/AttributeRenderer';
import { HistoryTable } from '../../components/common/HistoryTable';
import { NotificationSettings } from '../../components/common/NotificationSettings';
import { APITester } from '../../components/common/APITester';
import { Documentation } from '../../components/common/Documentation';
import { Statistics } from '../../components/common/Statistics';
import { ChangeConfirmDialog } from '../../components/ui/ChangeConfirmDialog';
import { useToast } from '../../contexts/ToastContext';
import { Attribute, AttributeType } from '../../types';
import { TabConfig } from '../../types/common';

// Mock data
const mockAttribute: Attribute = {
  id: 'attr-1',
  name: 'Product Status',
  type: AttributeType.SELECT,
  required: true,
  options: ['active', 'draft', 'inactive', 'discontinued'],
  defaultValue: 'draft',
  description: 'The current status of the product in the system',
  validation: {
    minLength: 1,
    maxLength: 20,
  },
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-25T10:30:00Z',
};

// Mock attribute groups
const mockAttributeGroups = [
  { id: 'group-1', name: 'Basic Product Info' },
  { id: 'group-2', name: 'Marketing Information' },
  { id: 'group-3', name: 'Technical Specifications' },
];

// Details Component
const AttributeDetailsTab: React.FC<{ 
  editMode: boolean; 
  attribute: Attribute; 
  onAttributeChange: (attribute: Attribute) => void;
}> = ({ editMode, attribute, onAttributeChange }) => {
  const { t } = useLanguage();

  const getAttributeTypeColor = (type: AttributeType) => {
    switch (type) {
      case AttributeType.TEXT: return 'primary';
      case AttributeType.NUMBER: return 'secondary';
      case AttributeType.BOOLEAN: return 'success';
      case AttributeType.SELECT: return 'warning';
      case AttributeType.RICH_TEXT: return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader 
              title={t('attributes.basic_information')} 
              subtitle={t('attributes.basic_information_subtitle')}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label={t('attributes.name')}
                  value={attribute.name}
                  onChange={(e) => {
                    const updatedAttribute = { ...attribute, name: e.target.value };
                    onAttributeChange(updatedAttribute);
                  }}
                  disabled={!editMode}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {t('attributes.type')}
                </label>
                <div className="flex items-center space-x-2">
                  <Badge variant={getAttributeTypeColor(attribute.type) as any}>
                    {attribute.type}
                  </Badge>
                  {!editMode && (
                    <span className="text-sm text-muted-foreground">{t('attributes.cannot_be_changed')}</span>
                  )}
                </div>
              </div>
              
              <div className="md:col-span-2">
                <Input
                  label={t('attributes.description')}
                  value={attribute.description || ''}
                  onChange={(e) => {
                    const updatedAttribute = { ...attribute, description: e.target.value };
                    onAttributeChange(updatedAttribute);
                  }}
                  disabled={!editMode}
                />
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="required"
                    checked={attribute.required}
                    onChange={(e) => {
                      const updatedAttribute = { ...attribute, required: e.target.checked };
                      onAttributeChange(updatedAttribute);
                    }}
                    disabled={!editMode}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="required" className="text-sm font-medium text-foreground">
                    {t('attributes.this_attribute_is_required')}
                  </label>
                </div>
              </div>
              
              <div>
                <Input
                  label={t('attributes.default_value')}
                  value={attribute.defaultValue || ''}
                  onChange={(e) => {
                    const updatedAttribute = { ...attribute, defaultValue: e.target.value };
                    onAttributeChange(updatedAttribute);
                  }}
                  disabled={!editMode}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Metadata */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title={t('attributes.metadata')} />
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">{t('attributes.attribute_id')}</label>
                <p className="text-sm text-foreground mt-1 font-mono bg-muted px-2 py-1 rounded">
                  {attribute.id}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground">{t('attributes.created')}</label>
                <p className="text-sm text-foreground mt-1">
                  {new Date(attribute.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground">{t('attributes.last_updated')}</label>
                <p className="text-sm text-foreground mt-1">
                  {new Date(attribute.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Options (if applicable) */}
      {attribute.options && (
        <Card>
          <CardHeader 
            title={t('attributes.available_options')} 
            subtitle={t('attributes.available_options_subtitle')}
          />
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {attribute.options.map((option, index) => (
                <div 
                  key={index} 
                  className="group relative flex items-center justify-between p-3 bg-muted hover:bg-muted-hover border border-border rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm font-medium text-foreground">{option}</span>
                  </div>
                  {editMode && (
                    <button
                      onClick={() => {
                        const newOptions = attribute.options?.filter((_, i) => i !== index);
                        const updatedAttribute = { ...attribute, options: newOptions };
                        onAttributeChange(updatedAttribute);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-md hover:bg-error/10 text-error hover:text-error-hover"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {editMode && (
              <div className="border-t border-border pt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary/50 rounded-full"></div>
                  <span className="text-sm font-medium text-muted-foreground">{t('attributes.add_new_option')}</span>
                </div>
                <div className="mt-3">
                  <Input
                    placeholder={t('attributes.add_new_option')}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = (e.target as HTMLInputElement).value.trim();
                        if (value && !attribute.options?.includes(value)) {
                          const updatedAttribute = {
                            ...attribute,
                            options: [...(attribute.options || []), value]
                          };
                          onAttributeChange(updatedAttribute);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('attributes.press_enter_to_add')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Preview */}
      <Card>
        <CardHeader 
          title={t('attributes.attribute_preview')} 
          subtitle={t('attributes.attribute_preview_subtitle')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">{t('attributes.edit_mode')}</h4>
            <div className="p-4 border-2 border-dashed border-border rounded-lg bg-muted">
              <AttributeRenderer
                attribute={attribute}
                value={attribute.defaultValue}
                mode="edit"
                onChange={() => {}}
              />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">{t('attributes.view_mode')}</h4>
            <div className="p-4 border-2 border-dashed border-border rounded-lg bg-muted">
              <AttributeRenderer
                attribute={attribute}
                value={attribute.options?.[0] || attribute.defaultValue}
                mode="view"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Attribute Groups Component
const AttributeGroupsTab: React.FC<{ editMode: boolean }> = ({ editMode }) => {
  const { t } = useLanguage();
  const [selectedGroups, setSelectedGroups] = useState(['group-1', 'group-2']);

  const toggleGroup = (groupId: string) => {
    if (!editMode) return;
    
    setSelectedGroups(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('attributes.attribute_groups')}</h3>
          <p className="text-sm text-muted-foreground">{t('attributes.attribute_groups_subtitle')}</p>
        </div>
        <Badge variant="primary" size="sm">
          {selectedGroups.length} {t('attributes.groups_selected')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockAttributeGroups.map(group => {
          const isSelected = selectedGroups.includes(group.id);
          return (
            <button
              key={group.id}
              onClick={() => toggleGroup(group.id)}
              disabled={!editMode}
              className={`p-4 border-2 rounded-xl transition-all duration-200 text-left ${
                isSelected
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-border hover:border-border hover:bg-muted'
              } ${!editMode && 'cursor-default'}`}
            >
              <div className="flex items-center space-x-3">
                <Tags className="h-6 w-6 text-purple-600" />
                <div>
                  <h4 className="text-sm font-medium text-foreground">{group.name}</h4>
                  <p className="text-xs text-muted-foreground">ID: {group.id}</p>
                </div>
                {isSelected && (
                  <div className="ml-auto">
                    <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                      <FileText className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const AttributesDetails: React.FC = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const { showToast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [originalAttribute, setOriginalAttribute] = useState(mockAttribute);
  const [currentAttribute, setCurrentAttribute] = useState(mockAttribute);

  // Listen for edit mode toggle from navbar
  React.useEffect(() => {
    const handleToggleEditMode = () => {
      setEditMode(prev => !prev);
    };

    const handleCancelEdit = () => {
      handleCancel();
    };

    const handleSaveEdit = () => {
      handleSave();
    };

    window.addEventListener('toggleEditMode', handleToggleEditMode);
    window.addEventListener('cancelEdit', handleCancelEdit);
    window.addEventListener('saveEdit', handleSaveEdit);
    
    return () => {
      window.removeEventListener('toggleEditMode', handleToggleEditMode);
      window.removeEventListener('cancelEdit', handleCancelEdit);
      window.removeEventListener('saveEdit', handleSaveEdit);
    };
  }, []);

  // Track changes
  React.useEffect(() => {
    const hasChanges = JSON.stringify(originalAttribute) !== JSON.stringify(currentAttribute);
    setHasChanges(hasChanges);
  }, [originalAttribute, currentAttribute]);

  // Publish edit mode and changes state to global
  React.useEffect(() => {
    const event = new CustomEvent('editModeChanged', { 
      detail: { editMode, hasChanges } 
    });
    window.dispatchEvent(event);
  }, [editMode, hasChanges]);

  const handleAttributeChange = (updatedAttribute: Attribute) => {
    setCurrentAttribute(updatedAttribute);
  };

  const handleSave = () => {
    setChangeDialogOpen(true);
  };

  const handleSaveWithComment = (comment: string) => {
    showToast('Attribute saved successfully with comment: ' + comment, 'success');
    setChangeDialogOpen(false);
    setEditMode(false);
    setOriginalAttribute(currentAttribute);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setCurrentAttribute(originalAttribute);
    setEditMode(false);
    setHasChanges(false);
  };

  const getChanges = () => {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    
    if (originalAttribute.name !== currentAttribute.name) {
      changes.push({
        field: t('attributes.name'),
        oldValue: originalAttribute.name,
        newValue: currentAttribute.name
      });
    }
    
    if (originalAttribute.description !== currentAttribute.description) {
      changes.push({
        field: t('attributes.description'),
        oldValue: originalAttribute.description || '—',
        newValue: currentAttribute.description || '—'
      });
    }
    
    if (originalAttribute.required !== currentAttribute.required) {
      changes.push({
        field: t('attributes.required'),
        oldValue: originalAttribute.required ? t('common.yes') : t('common.no'),
        newValue: currentAttribute.required ? t('common.yes') : t('common.no')
      });
    }
    
    if (originalAttribute.defaultValue !== currentAttribute.defaultValue) {
      changes.push({
        field: t('attributes.default_value'),
        oldValue: originalAttribute.defaultValue || '—',
        newValue: currentAttribute.defaultValue || '—'
      });
    }
    
    return changes;
  };


  const tabs: TabConfig[] = [
    {
      id: 'details',
      label: t('attributes.details'),
      icon: FileText,
      component: AttributeDetailsTab,
      props: { 
        editMode, 
        attribute: currentAttribute, 
        onAttributeChange: handleAttributeChange 
      },
    },
    {
      id: 'attribute-groups',
      label: t('attributes.attribute_groups'),
      icon: Tags,
      component: AttributeGroupsTab,
      badge: '2',
    },
    {
      id: 'notifications',
      label: t('attributes.notifications'),
      icon: Bell,
      component: NotificationSettings,
      props: { entityType: 'attribute', entityId: id },
    },
    {
      id: 'statistics',
      label: t('attributes.statistics'),
      icon: BarChart3,
      component: Statistics,
      props: { entityType: 'attribute', entityId: id },
    },
    {
      id: 'api',
      label: t('attributes.api'),
      icon: Globe,
      component: APITester,
      props: { entityType: 'attribute', entityId: id },
    },
    {
      id: 'documentation',
      label: t('attributes.documentation'),
      icon: BookOpen,
      component: Documentation,
      props: { entityType: 'attribute', entityId: id },
    },
    {
      id: 'history',
      label: t('attributes.history'),
      icon: History,
      component: HistoryTable,
      props: { entityType: 'attribute', entityId: id },
      badge: '24',
    },
  ];

  return (
    <>
      <DetailsLayout
        title={currentAttribute.name}
        subtitle={`${currentAttribute.type} ${t('attributes.attribute')} • ${currentAttribute.required ? t('attributes.required') : t('attributes.optional')}`}
        icon={<FileText className="h-6 w-6 text-white" />}
        tabs={tabs}
        defaultTab="details"
        backUrl="/attributes"
        editMode={editMode}
      />
      
      {/* Change Confirmation Dialog */}
      <ChangeConfirmDialog
        open={changeDialogOpen}
        onClose={() => setChangeDialogOpen(false)}
        onConfirm={handleSaveWithComment}
        title={t('attributes.save_changes')}
        changes={getChanges()}
        entityName={t('attributes.attribute')}
      />
    </>
  );
};