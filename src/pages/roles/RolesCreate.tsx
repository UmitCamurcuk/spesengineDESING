import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Shield, Key, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Stepper } from '../../components/ui/Stepper';
import { Badge } from '../../components/ui/Badge';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { rolesService } from '../../api/services/roles.service';
import { permissionsService } from '../../api/services/permissions.service';
import { permissionGroupsService } from '../../api/services/permission-groups.service';
import type { 
  RoleCreateRequest, 
  PermissionRecord, 
  PermissionGroupRecord 
} from '../../api/types/api.types';

interface TranslationFields {
  tr: string;
  en: string;
}

export function RolesCreate() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [groups, setGroups] = useState<PermissionGroupRecord[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    name: { tr: '', en: '' } as TranslationFields,
    description: { tr: '', en: '' } as TranslationFields,
    permissions: [] as string[], // Array of enabled permission IDs
  });

  const steps = [
    { label: 'Basic Information', icon: Shield },
    { label: 'Select Permissions', icon: Key },
    { label: 'Review & Create', icon: Check },
  ];

  useEffect(() => {
    loadData();
  }, [language]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [permResult, groupsResult] = await Promise.all([
        permissionsService.list({ pageSize: 1000, language }),
        permissionGroupsService.list({ pageSize: 1000, language }),
      ]);
      setPermissions(permResult.items);
      setGroups(groupsResult.items);
      
      // Expand first group by default
      if (groupsResult.items.length > 0) {
        setExpandedGroups(new Set([groupsResult.items[0].id]));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast({ type: 'error', message: 'Failed to load permissions data' });
    } finally {
      setLoadingData(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const toggleAllInGroup = (groupId: string) => {
    const groupPermissions = permissions.filter(p => p.permissionGroupId === groupId);
    const allEnabled = groupPermissions.every(p => formData.permissions.includes(p.id));
    
    setFormData(prev => ({
      ...prev,
      permissions: allEnabled
        ? prev.permissions.filter(id => !groupPermissions.some(gp => gp.id === id))
        : [...new Set([...prev.permissions, ...groupPermissions.map(p => p.id)])],
    }));
  };

  const getGroupPermissions = (groupId: string) => {
    return permissions.filter(p => p.permissionGroupId === groupId);
  };

  const getEnabledCount = (groupId: string) => {
    const groupPermissions = getGroupPermissions(groupId);
    return groupPermissions.filter(p => formData.permissions.includes(p.id)).length;
  };

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
        return true; // Permissions are optional
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

      const payload: RoleCreateRequest = {
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
      };

      await rolesService.create(payload);

      showToast({ type: 'success', message: 'Role created successfully' });
      navigate('/roles');
    } catch (error: any) {
      console.error('Failed to create role:', error);
      showToast({ type: 'error', message: error?.message || 'Failed to create role' });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (loadingData) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader 
              title="Basic Information" 
              subtitle="Define the role name and description in multiple languages"
            />
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="h-8 w-8 text-white" />
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
                      placeholder="Yönetici"
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
                      placeholder="Admin"
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
                      placeholder="Tam yetkili yönetici rolü"
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
                      placeholder="Full administrator role"
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
              title="Select Permissions" 
              subtitle="Choose which permissions this role should have"
            />
            <div className="space-y-3">
              {groups.map((group) => {
                const groupPerms = getGroupPermissions(group.id);
                const enabledCount = getEnabledCount(group.id);
                const isExpanded = expandedGroups.has(group.id);

                return (
                  <div key={group.id} className="border border-border rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted transition"
                      onClick={() => toggleGroup(group.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-semibold text-foreground">
                            {group.name?.trim() || group.nameLocalizationId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {group.description?.trim() || group.descriptionLocalizationId || '—'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary" size="sm">
                          {enabledCount} / {groupPerms.length}
                        </Badge>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAllInGroup(group.id);
                          }}
                        >
                          {enabledCount === groupPerms.length ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 space-y-2 bg-background">
                        {groupPerms.map((permission) => {
                          const isEnabled = formData.permissions.includes(permission.id);
                          return (
                            <label
                              key={permission.id}
                              className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition"
                            >
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={() => togglePermission(permission.id)}
                                className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <code className="text-sm font-mono text-foreground">{permission.code}</code>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {permission.name?.trim() || permission.nameLocalizationId || '—'}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader 
              title="Review & Create" 
              subtitle="Review your role details before creating"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Names */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Role Names</h4>
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

              {/* Permissions Summary */}
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-foreground">Permissions</h4>
                  <Badge variant="primary">
                    {formData.permissions.length} / {permissions.length} Selected
                  </Badge>
                </div>

                {groups.map((group) => {
                  const groupPerms = getGroupPermissions(group.id);
                  const enabledPerms = groupPerms.filter(p => formData.permissions.includes(p.id));
                  
                  if (enabledPerms.length === 0) return null;

                  return (
                    <div key={group.id} className="mb-4">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-2">
                        <span className="text-sm font-medium text-foreground">
                          {group.name?.trim() || group.nameLocalizationId}
                        </span>
                        <Badge variant="secondary" size="sm">
                          {enabledPerms.length} / {groupPerms.length}
                        </Badge>
                      </div>
                      <div className="pl-4 space-y-1">
                        {enabledPerms.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <code className="font-mono text-xs">{permission.code}</code>
                            <span>-</span>
                            <span>{permission.name?.trim() || permission.nameLocalizationId || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {formData.permissions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No permissions selected</p>
                )}
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
          onClick={() => navigate('/roles')}
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Role</h1>
          <p className="text-sm text-muted-foreground">Create a new role step by step</p>
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
                Create Role
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
