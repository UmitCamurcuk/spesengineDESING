import React, { useState } from 'react';
import { Bell, Mail, Smartphone, Webhook, Users, Settings, Save } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { NotificationSettings as NotificationSettingsType } from '../../types/common';

interface NotificationSettingsProps {
  entityType: string;
  entityId: string;
  editMode?: boolean;
}

// Mock notification settings
const mockNotificationSettings: NotificationSettingsType = {
  id: '1',
  entityType: 'attribute',
  entityId: 'attr-1',
  onCreate: true,
  onUpdate: true,
  onDelete: true,
  onView: false,
  emailNotifications: true,
  pushNotifications: false,
  webhookUrl: 'https://api.example.com/webhooks/attribute-changes',
  notificationChannels: ['email', 'webhook'],
  recipients: ['admin@company.com', 'team@company.com'],
  customMessage: 'Attribute {name} has been {action}',
  isActive: true,
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-25T10:30:00Z',
};

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  entityType,
  entityId,
  editMode = false
}) => {
  const [settings, setSettings] = useState(mockNotificationSettings);
  const [loading, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  };

  const updateSetting = (key: keyof NotificationSettingsType, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const addRecipient = (email: string) => {
    if (email && !settings.recipients.includes(email)) {
      updateSetting('recipients', [...settings.recipients, email]);
    }
  };

  const removeRecipient = (email: string) => {
    updateSetting('recipients', settings.recipients.filter(r => r !== email));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
          <p className="text-sm text-gray-500">Configure when and how to receive notifications</p>
        </div>
        <Badge variant={settings.isActive ? 'success' : 'default'} size="sm">
          {settings.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trigger Events */}
        <Card>
          <CardHeader 
            title="Trigger Events" 
            subtitle="Choose which events should trigger notifications"
          />
          <div className="space-y-4">
            {[
              { key: 'onCreate', label: 'When created', icon: <Bell className="h-4 w-4" /> },
              { key: 'onUpdate', label: 'When updated', icon: <Settings className="h-4 w-4" /> },
              { key: 'onDelete', label: 'When deleted', icon: <Bell className="h-4 w-4" /> },
              { key: 'onView', label: 'When viewed', icon: <Bell className="h-4 w-4" /> },
            ].map(({ key, label, icon }) => (
              <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {icon}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{label}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[key as keyof NotificationSettingsType] as boolean}
                    onChange={(e) => updateSetting(key as keyof NotificationSettingsType, e.target.checked)}
                    disabled={!editMode}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </Card>

        {/* Delivery Methods */}
        <Card>
          <CardHeader 
            title="Delivery Methods" 
            subtitle="How you want to receive notifications"
          />
          <div className="space-y-4">
            {[
              { key: 'emailNotifications', label: 'Email notifications', icon: <Mail className="h-4 w-4" /> },
              { key: 'pushNotifications', label: 'Push notifications', icon: <Smartphone className="h-4 w-4" /> },
            ].map(({ key, label, icon }) => (
              <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    {icon}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{label}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[key as keyof NotificationSettingsType] as boolean}
                    onChange={(e) => updateSetting(key as keyof NotificationSettingsType, e.target.checked)}
                    disabled={!editMode}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            ))}

            {/* Webhook URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Webhook className="h-4 w-4" />
                <span>Webhook URL</span>
              </label>
              <Input
                value={settings.webhookUrl || ''}
                onChange={(e) => updateSetting('webhookUrl', e.target.value)}
                placeholder="https://api.example.com/webhooks"
                disabled={!editMode}
              />
            </div>
          </div>
        </Card>

        {/* Recipients */}
        <Card>
          <CardHeader 
            title="Recipients" 
            subtitle="Who should receive notifications"
          />
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {settings.recipients.map((email, index) => (
                <div key={index} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  <Users className="h-3 w-3" />
                  <span>{email}</span>
                  {editMode && (
                    <button
                      onClick={() => removeRecipient(email)}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <Settings className="h-3 w-3 rotate-45" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {editMode && (
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter email address"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addRecipient((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Enter email address"]') as HTMLInputElement;
                    if (input?.value) {
                      addRecipient(input.value);
                      input.value = '';
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Custom Message */}
        <Card>
          <CardHeader 
            title="Custom Message Template" 
            subtitle="Customize the notification message"
          />
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Message Template
              </label>
              <textarea
                value={settings.customMessage || ''}
                onChange={(e) => updateSetting('customMessage', e.target.value)}
                placeholder="Enter custom message template..."
                rows={3}
                disabled={!editMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {'{name}'} for entity name, {'{action}'} for action type
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-700 mb-1">Preview:</p>
              <p className="text-sm text-gray-600 italic">
                {settings.customMessage?.replace('{name}', 'Product Status').replace('{action}', 'updated') || 'No custom message set'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {editMode && (
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Notification Settings
          </Button>
        </div>
      )}
    </div>
  );
};