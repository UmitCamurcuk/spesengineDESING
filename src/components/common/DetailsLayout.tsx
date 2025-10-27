import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Tabs, TabPanel } from '../ui/Tabs';
import { TabConfig } from '../../types/common';
import { useLanguage } from '../../contexts/LanguageContext';
import { useEditActionContext } from '../../contexts/EditActionContext';

interface DetailsLayoutProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  tabs: TabConfig[];
  defaultTab?: string;
  backUrl?: string;
  headerActions?: React.ReactNode;
  editMode?: boolean;
  hasChanges?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  inlineActions?: boolean;
}

export const DetailsLayout: React.FC<DetailsLayoutProps> = ({
  title,
  subtitle,
  icon,
  tabs,
  defaultTab,
  backUrl,
  headerActions,
  editMode = false,
  hasChanges = false,
  onEdit,
  onSave,
  onCancel,
  inlineActions = false,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { register } = useEditActionContext();
  const visibleTabs = useMemo(() => tabs.filter((tab) => !tab.hidden), [tabs]);
  const initialTabId = useMemo(() => {
    if (defaultTab && visibleTabs.some((tab) => tab.id === defaultTab)) {
      return defaultTab;
    }
    return visibleTabs[0]?.id;
  }, [defaultTab, visibleTabs]);

  const [activeTab, setActiveTab] = useState(initialTabId);

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(initialTabId);
    }
  }, [activeTab, initialTabId, visibleTabs]);

  const activeTabConfig = visibleTabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabConfig?.component;

  const tabsWithBadges = visibleTabs.map(tab => ({
    id: tab.id,
    label: tab.label,
    icon: <tab.icon className="h-4 w-4" />,
    badge: tab.badge,
    disabled: tab.requiresEdit && !editMode && tab.id !== 'details'
  }));

  useEffect(() => {
    if (!onEdit) {
      register(null);
      return () => register(null);
    }

    register({
      isEditing: editMode,
      canEdit: !editMode,
      canSave: Boolean(onSave) && Boolean(hasChanges),
      onEdit,
      onCancel: onCancel ?? (() => {}),
      onSave,
    });

    return () => register(null);
  }, [editMode, hasChanges, onCancel, onEdit, onSave, register]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          {backUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(backUrl)}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              {icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {headerActions}
          {inlineActions && onEdit ? (
            !editMode ? (
              <Button
                onClick={onEdit}
                size="sm"
                variant="outline"
                className="p-2 h-9 w-9"
                aria-label={t('common.edit')}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">{t('common.edit')}</span>
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                {onSave ? (
                  <Button onClick={onSave} size="sm" disabled={!hasChanges}>
                    <Save className="h-4 w-4 mr-2" />
                    {t('common.save')}
                  </Button>
                ) : null}
                <Button variant="outline" onClick={onCancel} size="sm">
                  <X className="h-4 w-4 mr-2" />
                  {t('common.cancel')}
                </Button>
              </div>
            )
          ) : null}
        </div>
      </div>

      {tabsWithBadges.length > 0 ? (
        <Card padding="none" className="overflow-hidden">
          <div className="px-6 pt-6">
            <Tabs
              tabs={tabsWithBadges}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="underline"
            />
          </div>

          <TabPanel className="px-6 pb-6">
            {ActiveComponent && (
              <ActiveComponent
                editMode={editMode}
                {...activeTabConfig.props}
              />
            )}
          </TabPanel>
        </Card>
      ) : (
        <Card>
          <div className="px-6 py-8 text-sm text-muted-foreground">
            {t('common.no_results')}
          </div>
        </Card>
      )}
    </div>
  );
};
