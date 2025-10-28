import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Zap, Activity, Users } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Stepper } from '../../components/ui/Stepper';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { notificationsService, type NotificationRulePayload } from '../../api/services/notifications.service';

const steps = [
  { id: 'basic', name: 'Basic Info', description: 'Name and event' },
  { id: 'recipients', name: 'Recipients', description: 'Who receives notifications' },
  { id: 'review', name: 'Review', description: 'Confirm details' },
];

export const NotificationRulesCreate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventKey: '',
    isActive: true,
    filtersJson: '{\n  \n}',
    recipientsJson: '[]',
    channelsJson: '[]',
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

  const parseJson = (value: string, fallback: any) => {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const payload: NotificationRulePayload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        eventKey: formData.eventKey.trim(),
        isActive: formData.isActive,
        filters: parseJson(formData.filtersJson, {}),
        recipients: parseJson(formData.recipientsJson, []),
        channels: parseJson(formData.channelsJson, []),
      };

      await notificationsService.createRule(payload);
      showToast({
        type: 'success',
        message: t('notifications.rules.created') ?? 'Rule created successfully',
      });
      navigate('/notifications/rules');
    } catch (error: any) {
      console.error('Failed to create rule', error);
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
        return formData.name.trim() !== '' && formData.eventKey.trim() !== '';
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
              title={t('notifications.rules.fields.name') ?? 'Rule Information'}
              subtitle="Enter the basic details for the notification rule"
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <Input
                    label={t('notifications.rules.fields.name') ?? 'Rule Name'}
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter rule name"
                    required
                  />
                  <Input
                    label={t('notifications.rules.fields.eventKey') ?? 'Event Key'}
                    value={formData.eventKey}
                    onChange={(e) => setFormData((prev) => ({ ...prev, eventKey: e.target.value }))}
                    placeholder="e.g., user.created, order.completed"
                    required
                    leftIcon={<Activity className="h-4 w-4" />}
                  />
                  <Textarea
                    label={t('notifications.rules.fields.description') ?? 'Description'}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Describe when this rule should trigger"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      {t('notifications.rules.fields.isActive') ?? 'Active rule'}
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
              title="Recipients & Channels"
              subtitle="Configure who receives notifications and through which channels"
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <Textarea
                    label={t('notifications.rules.fields.filters') ?? 'Filters (JSON)'}
                    value={formData.filtersJson}
                    onChange={(e) => setFormData((prev) => ({ ...prev, filtersJson: e.target.value }))}
                    rows={6}
                    placeholder='{\n  "priority": "high",\n  "department": "sales"\n}'
                  />
                  <Textarea
                    label={t('notifications.rules.fields.recipients') ?? 'Recipients (JSON)'}
                    value={formData.recipientsJson}
                    onChange={(e) => setFormData((prev) => ({ ...prev, recipientsJson: e.target.value }))}
                    rows={8}
                    placeholder='[\n  {\n    "type": "role",\n    "value": "admin"\n  }\n]'
                  />
                  <Textarea
                    label={t('notifications.rules.fields.channels') ?? 'Channels (JSON)'}
                    value={formData.channelsJson}
                    onChange={(e) => setFormData((prev) => ({ ...prev, channelsJson: e.target.value }))}
                    rows={8}
                    placeholder='[\n  {\n    "channelType": "slack",\n    "enabled": true\n  }\n]'
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
              subtitle="Please review the rule details before creating"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Rule Information</h4>
                  <div className="space-y-2">
                    <p>
                      <span className="text-gray-500">Name:</span> {formData.name}
                    </p>
                    <p>
                      <span className="text-gray-500">Event Key:</span> {formData.eventKey}
                    </p>
                    <p>
                      <span className="text-gray-500">Active:</span> {formData.isActive ? 'Yes' : 'No'}
                    </p>
                    {formData.description && (
                      <p>
                        <span className="text-gray-500">Description:</span> {formData.description}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recipients & Channels</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {formData.recipientsJson.trim().length > 2 ? 'Recipients configured' : 'No recipients'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formData.channelsJson.trim().length > 2 ? 'Channels configured' : 'No channels'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formData.filtersJson.trim().length > 4 ? 'Filters configured' : 'No filters'}
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



