import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, FileText, Languages, Radio } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Stepper } from '../../components/ui/Stepper';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { notificationsService, type NotificationTemplatePayload } from '../../api/services/notifications.service';

const steps = [
  { id: 'basic', name: 'Basic Info', description: 'Name and type' },
  { id: 'content', name: 'Content', description: 'Message content' },
  { id: 'review', name: 'Review', description: 'Confirm details' },
];

const channelTypeOptions = [
  { value: 'slack', label: 'Slack' },
  { value: 'email', label: 'Email' },
  { value: 'webhook', label: 'Webhook' },
];

const languageOptions = [
  { value: 'tr', label: 'Turkish' },
  { value: 'en', label: 'English' },
];

export const NotificationTemplatesCreate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channelType: 'slack',
    eventKey: '',
    language: 'tr',
    subject: '',
    body: '',
    isDefault: false,
    version: 1,
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

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const payload: NotificationTemplatePayload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        channelType: formData.channelType.trim(),
        eventKey: formData.eventKey.trim(),
        language: formData.language.trim(),
        subject: formData.subject.trim() || undefined,
        body: formData.body.trim(),
        isDefault: formData.isDefault,
        version: formData.version,
      };

      await notificationsService.createTemplate(payload);
      showToast({
        type: 'success',
        message: 'Template created successfully',
      });
      navigate('/notifications/templates');
    } catch (error: any) {
      console.error('Failed to create template', error);
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
        return formData.body.trim() !== '';
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader title="Template Information" subtitle="Enter the basic details for the template" />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <Input
                    label="Template Name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Channel Type"
                      value={formData.channelType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, channelType: e.target.value }))}
                      options={channelTypeOptions}
                      required
                      leftIcon={<Radio className="h-4 w-4" />}
                    />
                    <Select
                      label="Language"
                      value={formData.language}
                      onChange={(e) => setFormData((prev) => ({ ...prev, language: e.target.value }))}
                      options={languageOptions}
                      required
                      leftIcon={<Languages className="h-4 w-4" />}
                    />
                  </div>
                  <Input
                    label="Event Key"
                    value={formData.eventKey}
                    onChange={(e) => setFormData((prev) => ({ ...prev, eventKey: e.target.value }))}
                    placeholder="e.g., user.created"
                    required
                  />
                  <Textarea
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    placeholder="Describe this template"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                      Set as default template
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
            <CardHeader title="Template Content" subtitle="Enter the message content" />
            <div className="space-y-6">
              <Input
                label="Subject (optional)"
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject or message title"
              />
              <Textarea
                label="Body"
                value={formData.body}
                onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
                rows={12}
                placeholder="Enter message template. Use {{variableName}} for dynamic content."
                required
              />
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Template Variables</h4>
                <p className="text-xs text-blue-700">
                  Use double curly braces for variables: <code className="bg-blue-100 px-1 py-0.5 rounded">{'{{userName}}'}</code>,{' '}
                  <code className="bg-blue-100 px-1 py-0.5 rounded">{'{{email}}'}</code>
                </p>
              </div>
            </div>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader title="Review & Confirm" subtitle="Please review the template details before creating" />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Template Information</h4>
                  <div className="space-y-2">
                    <p>
                      <span className="text-gray-500">Name:</span> {formData.name}
                    </p>
                    <p>
                      <span className="text-gray-500">Channel Type:</span> {formData.channelType}
                    </p>
                    <p>
                      <span className="text-gray-500">Event Key:</span> {formData.eventKey}
                    </p>
                    <p>
                      <span className="text-gray-500">Language:</span> {formData.language}
                    </p>
                    <p>
                      <span className="text-gray-500">Default:</span> {formData.isDefault ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Content</h4>
                  <div className="space-y-2">
                    {formData.subject && (
                      <p>
                        <span className="text-gray-500">Subject:</span> {formData.subject}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Body: {formData.body.length} characters
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



