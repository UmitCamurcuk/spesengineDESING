import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Bell, Radio, Settings } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Stepper } from '../../components/ui/Stepper';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { notificationsService, type NotificationChannelPayload } from '../../api/services/notifications.service';

const steps = [
  { id: 'basic', name: 'Basic Info', description: 'Name and type' },
  { id: 'config', name: 'Configuration', description: 'Channel settings' },
  { id: 'review', name: 'Review', description: 'Confirm details' },
];

const channelTypeOptions = [
  { value: 'slack', label: 'Slack' },
  { value: 'email', label: 'Email' },
  { value: 'webhook', label: 'Webhook' },
];

export const NotificationChannelsCreate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'slack',
    name: '',
    isEnabled: true,
    configJson: '{\n  \n}',
    metadataJson: '{\n  \n}',
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const parseJson = (value: string, fallback: Record<string, unknown>) => {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const payload: NotificationChannelPayload = {
        type: formData.type.trim(),
        name: formData.name.trim(),
        isEnabled: formData.isEnabled,
        config: parseJson(formData.configJson, {}),
        metadata: parseJson(formData.metadataJson, {}),
      };

      await notificationsService.createChannel(payload);
      showToast({
        type: 'success',
        message: t('notifications.channels.created') ?? 'Channel created successfully',
      });
      navigate('/notifications/channels');
    } catch (error: any) {
      console.error('Failed to create channel', error);
      showToast({
        type: 'error',
        message: error?.message || t('common.error'),
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim() !== '' && formData.type.trim() !== '';
      case 1:
        return true;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader
              title={t('notifications.channels.fields.type') ?? 'Channel Information'}
              subtitle="Enter the basic details for the notification channel"
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <Select
                    label={t('notifications.channels.fields.type') ?? 'Channel Type'}
                    value={formData.type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                    options={channelTypeOptions}
                    required
                    leftIcon={<Radio className="h-4 w-4" />}
                  />
                  <Input
                    label={t('notifications.channels.fields.name') ?? 'Channel Name'}
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter channel name"
                    required
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isEnabled"
                      checked={formData.isEnabled}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isEnabled: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isEnabled" className="text-sm font-medium text-gray-700">
                      {t('notifications.channels.fields.isEnabled') ?? 'Enable channel'}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardHeader
              title={t('notifications.channels.fields.config') ?? 'Channel Configuration'}
              subtitle="Configure channel-specific settings"
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <Textarea
                    label={t('notifications.channels.fields.config') ?? 'Configuration (JSON)'}
                    value={formData.configJson}
                    onChange={(e) => setFormData((prev) => ({ ...prev, configJson: e.target.value }))}
                    rows={8}
                    placeholder='{\n  "webhookUrl": "https://...",\n  "token": "..."\n}'
                  />
                  <Textarea
                    label={t('notifications.channels.fields.metadata') ?? 'Metadata (JSON)'}
                    value={formData.metadataJson}
                    onChange={(e) => setFormData((prev) => ({ ...prev, metadataJson: e.target.value }))}
                    rows={6}
                  />
                </div>
              </div>
            </div>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader
              title="Review & Confirm"
              subtitle="Please review the channel details before creating"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Channel Information</h4>
                  <div className="space-y-2">
                    <p>
                      <span className="text-gray-500">Type:</span> {formData.type}
                    </p>
                    <p>
                      <span className="text-gray-500">Name:</span> {formData.name}
                    </p>
                    <p>
                      <span className="text-gray-500">Enabled:</span> {formData.isEnabled ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Configuration</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {formData.configJson.trim().length > 2 ? 'Custom configuration provided' : 'No configuration'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formData.metadataJson.trim().length > 2 ? 'Metadata provided' : 'No metadata'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card padding="lg">
        <Stepper steps={steps} currentStep={currentStep} />
      </Card>

      {renderStepContent()}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          {t('common.back')}
        </Button>

        <div className="flex space-x-3">
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!canProceed()}
              leftIcon={<Check className="h-4 w-4" />}
            >
              {t('common.create')}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()} rightIcon={<ArrowRight className="h-4 w-4" />}>
              {t('common.next')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};



