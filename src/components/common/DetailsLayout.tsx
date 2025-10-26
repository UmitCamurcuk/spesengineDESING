import React, { useState } from 'react';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Tabs, TabPanel } from '../ui/Tabs';
import { TabConfig } from '../../types/common';
import { useLanguage } from '../../contexts/LanguageContext';

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
  onCancel
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabConfig = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabConfig?.component;

  const tabsWithBadges = tabs.map(tab => ({
    id: tab.id,
    label: tab.label,
    icon: <tab.icon className="h-4 w-4" />,
    badge: tab.badge,
    disabled: tab.requiresEdit && !editMode && tab.id !== 'details'
  }));

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
          {onEdit ? (
            !editMode ? (
              <Button onClick={onEdit} size="sm">
                <Edit className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                {hasChanges && (
                  <Button onClick={onSave} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    {t('common.save')}
                  </Button>
                )}
                <Button variant="outline" onClick={onCancel} size="sm">
                  <X className="h-4 w-4 mr-2" />
                  {t('common.cancel')}
                </Button>
              </div>
            )
          ) : null}
          {headerActions}
        </div>
      </div>

      {/* Tabs */}
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
    </div>
  );
};
