import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, BarChart3, Code, BookOpen, History as HistoryIcon, Loader2 } from 'lucide-react';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsService, type NotificationTemplate } from '../../api/services/notifications.service';
import type { TabConfig } from '../../types/common';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
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
  channelType: string;
  eventKey: string;
  language: string;
  subject: string;
  body: string;
  isDefault: boolean;
};

type ChangeItem = {
  field: string;
  oldValue: string | number | boolean;
  newValue: string | number | boolean;
};

const channelTypeOptions = [
  { value: 'slack', label: 'Slack' },
  { value: 'email', label: 'Email' },
  { value: 'webhook', label: 'Webhook' },
];

const languageOptions = [
  { value: 'tr', label: 'Turkish' },
  { value: 'en', label: 'English' },
];

const cloneGeneralForm = (form: GeneralForm): GeneralForm => ({ ...form });

const normalizeGeneralForm = (form: GeneralForm): GeneralForm => ({
  name: form.name.trim(),
  description: form.description.trim(),
  channelType: form.channelType.trim(),
  eventKey: form.eventKey.trim(),
  language: form.language.trim(),
  subject: form.subject.trim(),
  body: form.body.trim(),
  isDefault: form.isDefault,
});

const generalFormsEqual = (a: GeneralForm, b: GeneralForm): boolean => {
  const normalizedA = normalizeGeneralForm(a);
  const normalizedB = normalizeGeneralForm(b);
  return (
    normalizedA.name === normalizedB.name &&
    normalizedA.description === normalizedB.description &&
    normalizedA.channelType === normalizedB.channelType &&
    normalizedA.eventKey === normalizedB.eventKey &&
    normalizedA.language === normalizedB.language &&
    normalizedA.subject === normalizedB.subject &&
    normalizedA.body === normalizedB.body &&
    normalizedA.isDefault === normalizedB.isDefault
  );
};

interface TemplateDetailsTabProps {
  form: GeneralForm;
  editMode: boolean;
  onChange: (updater: (prev: GeneralForm) => GeneralForm) => void;
}

const TemplateDetailsTab: React.FC<TemplateDetailsTabProps> = ({ form, editMode, onChange }) => {
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
        <CardHeader title="Template Information" subtitle="Basic template properties and configuration" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Template Name"
            value={form.name}
            onChange={(event) => handleFieldChange('name', event.target.value)}
            disabled={!editMode}
          />
          <Select
            label="Channel Type"
            value={form.channelType}
            onChange={(event) => handleFieldChange('channelType', event.target.value)}
            options={channelTypeOptions}
            disabled={!editMode}
          />
          <Input
            label="Event Key"
            value={form.eventKey}
            onChange={(event) => handleFieldChange('eventKey', event.target.value)}
            disabled={!editMode}
          />
          <Select
            label="Language"
            value={form.language}
            onChange={(event) => handleFieldChange('language', event.target.value)}
            options={languageOptions}
            disabled={!editMode}
          />
        </div>
        <div className="mt-4">
          <Textarea
            label="Description"
            value={form.description}
            onChange={(event) => handleFieldChange('description', event.target.value)}
            rows={2}
            disabled={!editMode}
          />
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) => handleFieldChange('isDefault', event.target.checked)}
              disabled={!editMode}
            />
            Set as default template
          </label>
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader title="Template Content" subtitle="Message subject and body" />
        <div className="space-y-4">
          <Input
            label="Subject"
            value={form.subject}
            onChange={(event) => handleFieldChange('subject', event.target.value)}
            disabled={!editMode}
            placeholder="Email subject or message title"
          />
          <Textarea
            label="Body"
            value={form.body}
            onChange={(event) => handleFieldChange('body', event.target.value)}
            rows={12}
            disabled={!editMode}
            placeholder="Message template body"
          />
          {!editMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Template Variables</h4>
              <p className="text-xs text-blue-700">
                This template uses variables in double curly braces format: <code className="bg-blue-100 px-1 py-0.5 rounded">{'{{variableName}}'}</code>
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

const StatisticsTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <Statistics entityType="notification-template" entityId={entityId} editMode={editMode} />
);

const ApiTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <APITester entityType="notification-template" entityId={entityId} editMode={editMode} />
);

const DocumentationTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <Documentation entityType="notification-template" entityId={entityId} editMode={editMode} />
);

const HistoryTab: React.FC<{ entityId: string }> = ({ entityId }) => (
  <HistoryTable entityType="NotificationTemplate" entityId={entityId} />
);

export function NotificationTemplatesDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();

  const canRead = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.TEMPLATES.VIEW);
  const canUpdate = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.TEMPLATES.UPDATE);
  const canViewHistory = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.TEMPLATES.VIEW);

  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<NotificationTemplate | null>(null);
  const [generalForm, setGeneralForm] = useState<GeneralForm | null>(null);
  const [isGeneralEditing, setIsGeneralEditing] = useState(false);
  const [generalHasChanges, setGeneralHasChanges] = useState(false);
  const generalBaselineRef = useRef<GeneralForm | null>(null);

  const [pendingChanges, setPendingChanges] = useState<ChangeItem[]>([]);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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

      const templateResponse = await notificationsService.getTemplate(id);

      const general: GeneralForm = {
        name: templateResponse.name ?? '',
        description: templateResponse.description ?? '',
        channelType: templateResponse.channelType ?? '',
        eventKey: templateResponse.eventKey ?? '',
        language: templateResponse.language ?? '',
        subject: templateResponse.subject ?? '',
        body: templateResponse.body ?? '',
        isDefault: templateResponse.isDefault,
      };

      generalBaselineRef.current = cloneGeneralForm(general);
      setGeneralForm(cloneGeneralForm(general));
      setGeneralHasChanges(false);

      setTemplate(templateResponse);
    } catch (error: any) {
      console.error('Failed to load template details', error);
      showToast({
        type: 'error',
        message: error?.message || t('common.error'),
      });
      navigate('/notifications/templates');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
        channelType: generalForm.channelType.trim(),
        eventKey: generalForm.eventKey.trim(),
        language: generalForm.language.trim(),
        subject: generalForm.subject.trim() || undefined,
        body: generalForm.body.trim(),
        isDefault: generalForm.isDefault,
      };

      await notificationsService.updateTemplate(id, payload);
      showToast({
        type: 'success',
        message: 'Template updated successfully',
      });

      setCommentDialogOpen(false);
      setPendingChanges([]);
      await loadData();
    } catch (error: any) {
      console.error('Failed to update template', error);
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
    if (!generalForm || !template) {
      return [];
    }
    return [
      {
        id: 'details',
        label: t('common.details') ?? 'Details',
        icon: FileText,
        component: TemplateDetailsTab,
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
          entityId: template.id,
          editMode: isGeneralEditing,
        },
        hidden: !canRead,
      },
      {
        id: 'api',
        label: t('details.tabs.api') ?? 'API',
        icon: Code,
        component: ApiTab,
        props: {
          entityId: template.id,
          editMode: isGeneralEditing,
        },
        hidden: !canRead,
      },
      {
        id: 'documentation',
        label: t('details.tabs.documentation') ?? 'Documentation',
        icon: BookOpen,
        component: DocumentationTab,
        props: {
          entityId: template.id,
          editMode: isGeneralEditing,
        },
        hidden: !canRead,
      },
      {
        id: 'history',
        label: t('details.tabs.history') ?? 'History',
        icon: HistoryIcon,
        component: HistoryTab,
        props: {
          entityId: template.id,
        },
        hidden: !canViewHistory,
      },
    ];
  }, [canRead, canViewHistory, generalForm, isGeneralEditing, t, template, updateGeneralForm]);

  if (loading || !template || !generalForm) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <DetailsLayout
        title={template.name}
        subtitle={`${template.channelType} · ${template.language}`}
        icon={<FileText className="h-6 w-6 text-white" />}
        backUrl="/notifications/templates"
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
        entityName={template.name}
      />
    </>
  );
}



