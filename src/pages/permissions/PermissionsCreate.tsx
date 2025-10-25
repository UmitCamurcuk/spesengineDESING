import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Key, FolderTree, Settings } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Stepper } from '../../components/ui/Stepper';
import { Badge } from '../../components/ui/Badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { permissionsService } from '../../api/services/permissions.service';
import { permissionGroupsService } from '../../api/services/permission-groups.service';
import type { PermissionCreateRequest, PermissionGroupRecord } from '../../api/types/api.types';

interface TranslationFields {
  tr: string;
  en: string;
}

export function PermissionsCreate() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<PermissionGroupRecord[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    name: { tr: '', en: '' } as TranslationFields,
    description: { tr: '', en: '' } as TranslationFields,
    permissionGroupId: '',
    displayOrder: 0,
    logo: '',
  });

  const steps = [
    { label: 'Basic Information', icon: Key },
    { label: 'Group & Settings', icon: FolderTree },
    { label: 'Review & Create', icon: Check },
  ];

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const result = await permissionGroupsService.list();
      setGroups(result.items);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const validateCode = (code: string): boolean => {
    return /^[a-z0-9]+\.[a-z0-9]+\.[a-z0-9]+$/.test(code);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return (
          formData.code.trim() !== '' &&
          validateCode(formData.code) &&
          formData.name.tr.trim() !== '' &&
          formData.name.en.trim() !== '' &&
          formData.description.tr.trim() !== '' &&
          formData.description.en.trim() !== ''
        );
      case 1:
        return formData.permissionGroupId !== '';
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
      showToast({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    try {
      setLoading(true);

      const payload: PermissionCreateRequest = {
        code: formData.code.toLowerCase(),
        name: formData.name,
        description: formData.description,
        permissionGroupId: formData.permissionGroupId,
        displayOrder: formData.displayOrder,
        logo: formData.logo || null,
      };

      await permissionsService.create(payload);

      showToast({ type: 'success', message: 'Permission created successfully' });
      navigate('/permissions');
    } catch (error: any) {
      console.error('Failed to create permission:', error);
      showToast({ type: 'error', message: error?.message || 'Failed to create permission' });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedGroup = () => {
    return groups.find(g => g.id === formData.permissionGroupId);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader 
              title="Basic Information" 
              subtitle="Define the permission code and multilingual descriptions"
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Key className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-6">
                  {/* Permission Code */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Permission Code <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                      placeholder="users.users.create"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: module.resource.action (e.g., users.users.create)
                    </p>
                    {formData.code && !validateCode(formData.code) && (
                      <p className="text-xs text-red-500 mt-1">
                        Invalid format! Use: module.resource.action
                      </p>
                    )}
                    {formData.code && validateCode(formData.code) && (
                      <div className="mt-2">
                        <Badge variant="success" size="sm">Valid Format ✓</Badge>
                      </div>
                    )}
                  </div>

                  {/* Turkish Name */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Name (Turkish) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.name.tr}
                      onChange={(e) => setFormData({ ...formData, name: { ...formData.name, tr: e.target.value } })}
                      placeholder="Kullanıcı Oluştur"
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
                      placeholder="Create User"
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
                      placeholder="Yeni kullanıcı oluşturma izni"
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
                      placeholder="Permission to create new users"
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
              title="Group & Display Settings" 
              subtitle="Assign permission to a group and configure display options"
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FolderTree className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 space-y-6">
                  {/* Permission Group */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Permission Group <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.permissionGroupId}
                      onChange={(e) => setFormData({ ...formData, permissionGroupId: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select a group</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.nameLocalizationId}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose which group this permission belongs to
                    </p>
                  </div>

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
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );

      case 2:
        const selectedGroup = getSelectedGroup();
        return (
          <Card>
            <CardHeader 
              title="Review & Create" 
              subtitle="Review your permission details before creating"
            />
            <div className="space-y-6">
              {/* Permission Code */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Permission Code</h4>
                <div className="p-3 bg-muted rounded-lg">
                  <code className="text-sm font-mono text-foreground">{formData.code}</code>
                  <Badge variant="success" size="sm" className="ml-2">Valid Format</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Names */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Permission Names</h4>
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

              {/* Settings */}
              <div className="border-t border-border pt-6">
                <h4 className="text-sm font-medium text-foreground mb-4">Group & Display Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium text-foreground">Group</span>
                    <Badge variant="secondary" size="sm">
                      {selectedGroup?.nameLocalizationId || 'Unknown'}
                    </Badge>
                  </div>
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
          onClick={() => navigate('/permissions')}
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Permission</h1>
          <p className="text-sm text-muted-foreground">Create a new permission step by step</p>
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
                Create Permission
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
