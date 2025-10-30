import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Zap, FileText, BarChart3, Code, BookOpen, History as HistoryIcon, Loader2 } from 'lucide-react';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsService, type NotificationRule } from '../../api/services/notifications.service';
import type { TabConfig, APIEndpoint, DocumentationSection } from '../../types/common';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Statistics } from '../../components/common/Statistics';
import { APITester } from '../../components/common/APITester';
import { Documentation } from '../../components/common/Documentation';
import { HistoryTable } from '../../components/common/HistoryTable';
import { ChangeConfirmDialog } from '../../components/ui/ChangeConfirmDialog';
import { PERMISSIONS } from '../../config/permissions';

type GeneralForm = {
  name: string;
  description: string;
  eventKey: string;
  isActive: boolean;
  filtersJson: string;
  recipientsJson: string;
  channelsJson: string;
};

type ChangeItem = {
  field: string;
  oldValue: string | number | boolean;
  newValue: string | number | boolean;
};

const cloneGeneralForm = (form: GeneralForm): GeneralForm => ({ ...form });

const normalizeGeneralForm = (form: GeneralForm): GeneralForm => ({
  name: form.name.trim(),
  description: form.description.trim(),
  eventKey: form.eventKey.trim(),
  isActive: form.isActive,
  filtersJson: form.filtersJson.trim(),
  recipientsJson: form.recipientsJson.trim(),
  channelsJson: form.channelsJson.trim(),
});

const generalFormsEqual = (a: GeneralForm, b: GeneralForm): boolean => {
  const normalizedA = normalizeGeneralForm(a);
  const normalizedB = normalizeGeneralForm(b);
  return (
    normalizedA.name === normalizedB.name &&
    normalizedA.description === normalizedB.description &&
    normalizedA.eventKey === normalizedB.eventKey &&
    normalizedA.isActive === normalizedB.isActive &&
    normalizedA.filtersJson === normalizedB.filtersJson &&
    normalizedA.recipientsJson === normalizedB.recipientsJson &&
    normalizedA.channelsJson === normalizedB.channelsJson
  );
};

interface RuleDetailsTabProps {
  form: GeneralForm;
  editMode: boolean;
  onChange: (updater: (prev: GeneralForm) => GeneralForm) => void;
}

const RuleDetailsTab: React.FC<RuleDetailsTabProps> = ({ form, editMode, onChange }) => {
  const { t } = useLanguage();

  const handleFieldChange = (field: keyof GeneralForm, value: string | boolean) => {
    onChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <CardHeader
          title={t('notifications.rules.title') ?? 'Rule Information'}
          subtitle="Basic rule properties and trigger configuration"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('notifications.rules.fields.name') ?? 'Rule Name'}
            value={form.name}
            onChange={(event) => handleFieldChange('name', event.target.value)}
            disabled={!editMode}
          />
          <Input
            label={t('notifications.rules.fields.eventKey') ?? 'Event Key'}
            value={form.eventKey}
            onChange={(event) => handleFieldChange('eventKey', event.target.value)}
            disabled={!editMode}
          />
        </div>
        <div className="mt-4">
          <Textarea
            label={t('notifications.rules.fields.description') ?? 'Description'}
            value={form.description}
            onChange={(event) => handleFieldChange('description', event.target.value)}
            rows={3}
            disabled={!editMode}
          />
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => handleFieldChange('isActive', event.target.checked)}
              disabled={!editMode}
            />
            {t('notifications.rules.fields.isActive') ?? 'Active'}
          </label>
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader
          title="Filters & Recipients"
          subtitle="Configure rule filters, recipients and channels"
        />
        <div className="space-y-4">
          <Textarea
            label={t('notifications.rules.fields.filters') ?? 'Filters (JSON)'}
            value={form.filtersJson}
            onChange={(event) => handleFieldChange('filtersJson', event.target.value)}
            rows={6}
            disabled={!editMode}
          />
          <Textarea
            label={t('notifications.rules.fields.recipients') ?? 'Recipients (JSON)'}
            value={form.recipientsJson}
            onChange={(event) => handleFieldChange('recipientsJson', event.target.value)}
            rows={8}
            disabled={!editMode}
          />
          <Textarea
            label={t('notifications.rules.fields.channels') ?? 'Channels (JSON)'}
            value={form.channelsJson}
            onChange={(event) => handleFieldChange('channelsJson', event.target.value)}
            rows={8}
            disabled={!editMode}
          />
        </div>
      </Card>
    </div>
  );
};

const StatisticsTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <Statistics entityType="notification-rule" entityId={entityId} editMode={editMode} />
);

const ApiTab: React.FC<{
  entityId: string;
  editMode: boolean;
  endpoints: APIEndpoint[];
  onEndpointsChange?: (endpoints: APIEndpoint[]) => Promise<void> | void;
}> = ({ entityId, editMode, endpoints, onEndpointsChange }) => (
  <APITester
    entityType="notification-rule"
    entityId={entityId}
    editMode={editMode}
    endpoints={endpoints}
    onEndpointsChange={onEndpointsChange}
  />
);

const DocumentationTab: React.FC<{
  entityId: string;
  editMode: boolean;
  sections: DocumentationSection[];
  onSave?: (sections: DocumentationSection[]) => Promise<void> | void;
}> = ({ entityId, editMode, sections, onSave }) => (
  <Documentation
    entityType="notification-rule"
    entityId={entityId}
    editMode={editMode}
    sections={sections}
    onSave={onSave}
  />
);

const HistoryTab: React.FC<{ entityId: string }> = ({ entityId }) => (
  <HistoryTable entityType="NotificationRule" entityId={entityId} />
);

export function NotificationRulesDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();

  const canRead = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.VIEW);
  const canUpdate = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.UPDATE);
  const canViewStatistics = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.STATISTICS.VIEW);
  const canEditStatistics = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.STATISTICS.EDIT);
  const canViewApiReference = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.API.VIEW);
  const canEditApiReference = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.API.EDIT);
  const canViewDocumentation = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.DOCUMENTATION.VIEW);
  const canEditDocumentation = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.DOCUMENTATION.EDIT);
  const canViewHistory = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.RULES.HISTORY.VIEW);

  const [loading, setLoading] = useState(true);
  const [rule, setRule] = useState<NotificationRule | null>(null);
  const [generalForm, setGeneralForm] = useState<GeneralForm | null>(null);
  const [isGeneralEditing, setIsGeneralEditing] = useState(false);
  const [generalHasChanges, setGeneralHasChanges] = useState(false);
  const generalBaselineRef = useRef<GeneralForm | null>(null);

  const [pendingChanges, setPendingChanges] = useState<ChangeItem[]>([]);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiReference, setApiReference] = useState<APIEndpoint[]>([]);
  const [documentationSections, setDocumentationSections] = useState<DocumentationSection[]>([]);


  const updateGeneralForm = useCallback((updater: (prev: GeneralForm) => GeneralForm) => {
    setGeneralForm((prev) => {
      if (!prev) {
        return prev;
      }
      const next = updater(prev);
      if (generalBaselineRef.current) {
        setGeneralHasChanges(!generalFormsEqual(next, generalBaselineRef.current));
      }
      return next;
    });
  }, []);

  const loadData = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      setLoading(true);
      setIsGeneralEditing(false);

      const ruleResponse = await notificationsService.getRule(id);

      const general: GeneralForm = {
        name: ruleResponse.name ?? '',
        description: ruleResponse.description ?? '',
        eventKey: ruleResponse.eventKey ?? '',
        isActive: ruleResponse.isActive,
        filtersJson: JSON.stringify(ruleResponse.filters ?? {}, null, 2),
        recipientsJson: JSON.stringify(ruleResponse.recipients ?? [], null, 2),
        channelsJson: JSON.stringify(ruleResponse.channels ?? [], null, 2),
      };

      generalBaselineRef.current = cloneGeneralForm(general);
      setGeneralForm(cloneGeneralForm(general));
      setGeneralHasChanges(false);

      const fetchTasks: Promise<void>[] = [];

      if (canViewApiReference) {
        fetchTasks.push(
          notificationsService
            .getRuleApiReference(id)
            .then((data) => setApiReference(data))
            .catch((error: any) => {
              console.error('Failed to load API reference', error);
              showToast({
                type: 'error',
                message: t('notifications.rules.api_reference_error') || 'API referansı yüklenemedi',
              });
              setApiReference([]);
            }),
        );
      } else {
        setApiReference([]);
      }

      if (canViewDocumentation) {
        fetchTasks.push(
          notificationsService
            .getRuleDocumentation(id)
            .then((data) => setDocumentationSections(data))
            .catch((error: any) => {
              console.error('Failed to load rule documentation', error);
              showToast({
                type: 'error',
                message: t('notifications.rules.documentation_error') || 'Dokümantasyon yüklenemedi',
              });
              setDocumentationSections([]);
            }),
        );
      } else {
        setDocumentationSections([]);
      }

      if (fetchTasks.length > 0) {
        await Promise.all(fetchTasks);
      }

      setRule(ruleResponse);
    } catch (error: any) {
      console.error('Failed to load rule details', error);
      showToast({
        type: 'error',
        message: error?.message || t('common.error'),
      });
      navigate('/notifications/rules');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast, t, canViewApiReference, canViewDocumentation]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleUpdateApiReference = useCallback(async (endpoints: APIEndpoint[]) => {
    if (!id) {
      return;
    }
    try {
      const updated = await notificationsService.updateRuleApiReference(id, endpoints);
      setApiReference(updated);
      showToast({
        type: 'success',
        message: t('notifications.rules.api_reference_updated') || 'API referansı güncellendi',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        message: error?.message || t('common.error'),
      });
      throw error;
    }
  }, [id, showToast, t]);

  const handleUpdateDocumentation = useCallback(async (nextSections: DocumentationSection[]) => {
    if (!id) {
      return;
    }
    try {
      const updated = await notificationsService.updateRuleDocumentation(id, nextSections);
      setDocumentationSections(updated);
      showToast({
        type: 'success',
        message: t('notifications.rules.documentation_updated') || 'Dokümantasyon güncellendi',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        message: error?.message || t('common.error'),
      });
      throw error;
    }
  }, [id, showToast, t]);

  const handleEnterGeneralEdit = () => {
    if (!canUpdate) {
      return;
    }
    setIsGeneralEditing(true);
  };

  const handleCancelGeneralEdit = () => {
    if (!generalBaselineRef.current) {
      return;
    }
    setGeneralForm(cloneGeneralForm(generalBaselineRef.current));
    setGeneralHasChanges(false);
    setIsGeneralEditing(false);
  };

  const parseJson = (value: string, fallback: any) => {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  const handleGeneralSave = () => {
    if (!generalForm || !generalBaselineRef.current) {
      return;
    }
    const normalizedCurrent = normalizeGeneralForm(generalForm);
    const normalizedBaseline = normalizeGeneralForm(generalBaselineRef.current);

    const changes: ChangeItem[] = [];
    (Object.keys(normalizedCurrent) as (keyof GeneralForm)[]).forEach((key) => {
      if (typeof normalizedCurrent[key] === 'boolean') {
        if (normalizedCurrent[key] !== normalizedBaseline[key]) {
          changes.push({
            field: String(key),
            oldValue: normalizedBaseline[key] as boolean,
            newValue: normalizedCurrent[key] as boolean,
          });
        }
      } else if ((normalizedCurrent[key] as string) !== (normalizedBaseline[key] as string)) {
        changes.push({
          field: String(key),
          oldValue: (normalizedBaseline[key] as string) || '—',
          newValue: (normalizedCurrent[key] as string) || '—',
        });
      }
    });

    if (changes.length === 0) {
      showToast({ type: 'info', message: t('common.no_changes') ?? 'No changes detected' });
      return;
    }

    setPendingChanges(changes);
    setCommentDialogOpen(true);
  };

  const handleConfirmSave = async (comment: string) => {
    if (!id || !generalForm) {
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: generalForm.name.trim(),
        description: generalForm.description.trim() || undefined,
        eventKey: generalForm.eventKey.trim(),
        isActive: generalForm.isActive,
        filters: parseJson(generalForm.filtersJson, {}),
        recipients: parseJson(generalForm.recipientsJson, []),
        channels: parseJson(generalForm.channelsJson, []),
      };

      await notificationsService.updateRule(id, payload);
      showToast({
        type: 'success',
        message: t('notifications.rules.updated') ?? 'Rule updated successfully',
      });

      setCommentDialogOpen(false);
      setPendingChanges([]);
      await loadData();
    } catch (error: any) {
      console.error('Failed to update rule', error);
      showToast({
        type: 'error',
        message: error?.message || t('common.error'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCommentDialogClose = () => {
    setCommentDialogOpen(false);
    if (!saving) {
      setPendingChanges([]);
    }
  };

  const tabs = useMemo<TabConfig[]>(() => {
    if (!generalForm || !rule) {
      return [];
    }
    return [
      {
        id: 'details',
        label: t('common.details') ?? 'Details',
        icon: FileText,
        component: RuleDetailsTab,
        props: {
          form: generalForm,
          editMode: isGeneralEditing,
          onChange: updateGeneralForm,
        },
        hidden: !canRead,
      },
      {
        id: 'statistics',
        label: t('details.tabs.statistics') ?? 'Statistics',
        icon: BarChart3,
        component: StatisticsTab,
        props: {
          entityId: rule.id,
          editMode: isGeneralEditing && canEditStatistics,
        },
        hidden: !canViewStatistics,
      },
      {
        id: 'api',
        label: t('details.tabs.api') ?? 'API',
        icon: Code,
        component: ApiTab,
        props: {
          entityId: rule.id,
          editMode: isGeneralEditing && canEditApiReference,
          endpoints: apiReference,
          onEndpointsChange: handleUpdateApiReference,
        },
        hidden: !canViewApiReference,
      },
      {
        id: 'documentation',
        label: t('details.tabs.documentation') ?? 'Documentation',
        icon: BookOpen,
        component: DocumentationTab,
        props: {
          entityId: rule.id,
          editMode: isGeneralEditing && canEditDocumentation,
          sections: documentationSections,
          onSave: handleUpdateDocumentation,
        },
        hidden: !canViewDocumentation,
      },
      {
        id: 'history',
        label: t('details.tabs.history') ?? 'History',
        icon: HistoryIcon,
        component: HistoryTab,
        props: {
          entityId: rule.id,
        },
        hidden: !canViewHistory,
      },
    ];
  }, [
    apiReference,
    canEditApiReference,
    canEditDocumentation,
    canEditStatistics,
    canRead,
    canViewApiReference,
    canViewDocumentation,
    canViewHistory,
    canViewStatistics,
    documentationSections,
    generalForm,
    isGeneralEditing,
    rule,
    t,
    updateGeneralForm,
    handleUpdateApiReference,
    handleUpdateDocumentation,
  ]);

  if (loading || !rule || !generalForm) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <DetailsLayout
        title={rule.name}
        subtitle={`Event: ${rule.eventKey}`}
        icon={<Zap className="h-6 w-6 text-white" />}
        backUrl="/notifications/rules"
        tabs={tabs}
        editMode={isGeneralEditing}
        hasChanges={generalHasChanges}
        onEdit={canUpdate ? handleEnterGeneralEdit : undefined}
        onSave={canUpdate ? handleGeneralSave : undefined}
        onCancel={handleCancelGeneralEdit}
        inlineActions={false}
      />

      <ChangeConfirmDialog
        open={commentDialogOpen}
        onClose={handleCommentDialogClose}
        onConfirm={handleConfirmSave}
        changes={pendingChanges}
        loading={saving}
        entityName={rule.name}
      />
    </>
  );
}



