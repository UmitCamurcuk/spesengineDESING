import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Folder, Settings } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Stepper } from '../../components/ui/Stepper';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { permissionGroupsService } from '../../api/services/permission-groups.service';
import type { PermissionGroupCreateRequest } from '../../api/types/api.types';

interface TranslationFields {
  tr: string;
  en: string;
}

export function PermissionGroupsCreate() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: { tr: '', en: '' } as TranslationFields,
    description: { tr: '', en: '' } as TranslationFields,
    displayOrder: 0,
    logo: '',
  });

  const steps = [
    { label: 'Basic Information', icon: Folder },
    { label: 'Display Settings', icon: Settings },
    { label: 'Review & Create', icon: Check },
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return (
          formData.name.tr.trim() !== '' &&
          formData.name.en.trim() !== '' &&
          formData.description.tr.trim() !== '' &&
          formData.description.en.trim() !== ''
        );
      case 1:
        return true; // Display settings are optional
      case 2:
        return true; // Review step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      showToast({
        type: 'error',
        message: 'Please fill in all required fields',
      });
      return;
    }

    try {
      setLoading(true);

      const payload: PermissionGroupCreateRequest = {
        name: formData.name,
        description: formData.description,
        displayOrder: formData.displayOrder,
        logo: formData.logo || null,
      };

      await permissionGroupsService.create(payload);

      showToast({
        type: 'success',
        message: 'Permission group created successfully',
      });

      navigate('/permission-groups');
    } catch (error: any) {
      console.error('Failed to create permission group:', error);
      showToast({
        type: 'error',
        message: error?.message || 'Failed to create permission group',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader 
              title="Basic Information" 
              subtitle="Enter the name and description in multiple languages"
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Folder className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-6">
                  {/* Turkish Name */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Name (Turkish) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.name.tr}
                      onChange={(e) => setFormData({ ...formData, name: { ...formData.name, tr: e.target.value } })}
                      placeholder="Kullanıcı Yönetimi"
                      required
                    />
                  </div>

                  {/* English Name */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Name (English) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.name.en}
                      onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
                      placeholder="User Management"
                      required
                    />
                  </div>

                  {/* Turkish Description */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description (Turkish) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description.tr}
                      onChange={(e) => setFormData({ ...formData, description: { ...formData.description, tr: e.target.value } })}
                      placeholder="Kullanıcı işlemleri izinleri"
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  {/* English Description */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description (English) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description.en}
                      onChange={(e) => setFormData({ ...formData, description: { ...formData.description, en: e.target.value } })}
                      placeholder="User operations permissions"
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
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
              title="Display Settings" 
              subtitle="Configure how this group appears in the system"
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-6">
                  {/* Display Order */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Display Order
                    </label>
                    <Input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
                  </div>

                  {/* Logo URL */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Logo URL (Optional)
                    </label>
                    <Input
                      type="url"
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                      placeholder="https://example.com/icon.png"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Provide a URL to an icon or leave empty</p>
                  </div>

                  {formData.logo && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="text-sm font-medium text-foreground mb-2">Logo Preview</h4>
                      <img 
                        src={formData.logo} 
                        alt="Logo preview" 
                        className="w-16 h-16 object-contain rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader 
              title="Review & Create" 
              subtitle="Review your permission group details before creating"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Names */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Group Names</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="text-xs text-muted-foreground">Turkish:</span>
                      <p className="text-sm font-medium text-foreground">{formData.name.tr}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="text-xs text-muted-foreground">English:</span>
                      <p className="text-sm font-medium text-foreground">{formData.name.en}</p>
                    </div>
                  </div>
                </div>

                {/* Descriptions */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Descriptions</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="text-xs text-muted-foreground">Turkish:</span>
                      <p className="text-sm text-foreground">{formData.description.tr}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="text-xs text-muted-foreground">English:</span>
                      <p className="text-sm text-foreground">{formData.description.en}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Settings */}
              <div className="border-t border-border pt-6">
                <h4 className="text-sm font-medium text-foreground mb-4">Display Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium text-foreground">Display Order</span>
                    <span className="text-sm text-muted-foreground">{formData.displayOrder}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium text-foreground">Logo</span>
                    <span className="text-sm text-muted-foreground">{formData.logo || 'None'}</span>
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
    <div className="space-y-6 flex flex-col" style={{ height: '-webkit-fill-available' }}>
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/permission-groups')}
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Permission Group</h1>
          <p className="text-sm text-muted-foreground">Create a new permission group step by step</p>
        </div>
      </div>

      {/* Stepper */}
      <Card padding="lg">
        <Stepper steps={steps} currentStep={currentStep} />
      </Card>

      {/* Main Content Card */}
      <Card className="flex-1 flex flex-col">
        {/* Step Content */}
        <div className="flex-1 overflow-hidden">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-border flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || loading}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          
          <div className="flex space-x-3">
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                loading={loading}
                disabled={!canProceed()}
                leftIcon={<Check className="h-4 w-4" />}
              >
                Create Group
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
