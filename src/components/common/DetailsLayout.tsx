import React, { useState } from 'react';
import { Edit2, Save, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Tabs, TabPanel } from '../ui/Tabs';
import { TabConfig } from '../../types/common';

interface DetailsLayoutProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  tabs: TabConfig[];
  defaultTab?: string;
  onSave?: () => Promise<void>;
  canEdit?: boolean;
  backUrl?: string;
  headerActions?: React.ReactNode;
}

export const DetailsLayout: React.FC<DetailsLayoutProps> = ({
  title,
  subtitle,
  icon,
  tabs,
  defaultTab,
  onSave,
  canEdit = true,
  backUrl,
  headerActions
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!onSave) return;
    
    setLoading(true);
    try {
      await onSave();
      setEditMode(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {headerActions}
          
          {canEdit && (
            <>
              {editMode ? (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(false)}
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    loading={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </>
          )}
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