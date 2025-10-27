import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bell, FileText, BarChart3, Code, BookOpen, History as HistoryIcon, Loader2 } from 'lucide-react';
import { DetailsLayout } from '../../components/common/DetailsLayout';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsService, type NotificationChannel } from '../../api/services/notifications.service';
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
  type: string;
  name: string;
  isEnabled: boolean;
  configJson: string;
  metadataJson: string;
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

const cloneGeneralForm = (form: GeneralForm): GeneralForm => ({ ...form });

const normalizeGeneralForm = (form: GeneralForm): GeneralForm => ({
  type: form.type.trim(),
  name: form.name.trim(),
  isEnabled: form.isEnabled,
  configJson: form.configJson.trim(),
  metadataJson: form.metadataJson.trim(),
});

const generalFormsEqual = (a: GeneralForm, b: GeneralForm): boolean => {
  const normalizedA = normalizeGeneralForm(a);
  const normalizedB = normalizeGeneralForm(b);
  return (
    normalizedA.type === normalizedB.type &&
    normalizedA.name === normalizedB.name &&
    normalizedA.isEnabled === normalizedB.isEnabled &&
    normalizedA.configJson === normalizedB.configJson &&
    normalizedA.metadataJson === normalizedB.metadataJson
  );
};

interface ChannelDetailsTabProps {
  form: GeneralForm;
  editMode: boolean;
  onChange: (updater: (prev: GeneralForm) => GeneralForm) => void;
}

const ChannelDetailsTab: React.FC<ChannelDetailsTabProps> = ({ form, editMode, onChange }) => {
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
          title={t('notifications.channels.title') ?? 'Channel Information'}
          subtitle="Basic channel properties and configuration"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={t('notifications.channels.fields.type') ?? 'Channel Type'}
            value={form.type}
            onChange={(event) => handleFieldChange('type', event.target.value)}
            options={channelTypeOptions}
            disabled={!editMode}
          />
          <Input
            label={t('notifications.channels.fields.name') ?? 'Channel Name'}
            value={form.name}
            onChange={(event) => handleFieldChange('name', event.target.value)}
            disabled={!editMode}
          />
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={form.isEnabled}
              onChange={(event) => handleFieldChange('isEnabled', event.target.checked)}
              disabled={!editMode}
            />
            {t('notifications.channels.fields.isEnabled') ?? 'Enabled'}
          </label>
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader
          title={t('notifications.channels.fields.config') ?? 'Configuration'}
          subtitle="Channel-specific configuration (JSON)"
        />
        <div className="space-y-4">
          <Textarea
            label={t('notifications.channels.fields.config') ?? 'Configuration (JSON)'}
            value={form.configJson}
            onChange={(event) => handleFieldChange('configJson', event.target.value)}
            rows={8}
            disabled={!editMode}
          />
          <Textarea
            label={t('notifications.channels.fields.metadata') ?? 'Metadata (JSON)'}
            value={form.metadataJson}
            onChange={(event) => handleFieldChange('metadataJson', event.target.value)}
            rows={6}
            disabled={!editMode}
          />
        </div>
      </Card>
    </div>
  );
};

const StatisticsTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <Statistics entityType="notification-channel" entityId={entityId} editMode={editMode} />
);

const ApiTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <APITester entityType="notification-channel" entityId={entityId} editMode={editMode} />
);

const DocumentationTab: React.FC<{ entityId: string; editMode: boolean }> = ({ entityId, editMode }) => (
  <Documentation entityType="notification-channel" entityId={entityId} editMode={editMode} />
);

const HistoryTab: React.FC<{ entityId: string }> = ({ entityId }) => (
  <HistoryTable entityType="NotificationChannel" entityId={entityId} />
);

export function NotificationChannelsDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();

  const canRead = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.CHANNELS.VIEW);
  const canUpdate = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.CHANNELS.UPDATE);
  const canViewHistory = hasPermission(PERMISSIONS.SYSTEM.NOTIFICATIONS.CHANNELS.VIEW);

  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<NotificationChannel | null>(null);
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

      const channelResponse = await notificationsService.getChannel(id);

      const general: GeneralForm = {
        type: channelResponse.type ?? '',
        name: channelResponse.name ?? '',
        isEnabled: channelResponse.isEnabled,
        configJson: JSON.stringify(channelResponse.config ?? {}, null, 2),
        metadataJson: JSON.stringify(channelResponse.metadata ?? {}, null, 2),
      };

      generalBaselineRef.current = cloneGeneralForm(general);
      setGeneralForm(cloneGeneralForm(general));
      setGeneralHasChanges(false);

      setChannel(channelResponse);
    } catch (error: any) {
      console.error('Failed to load channel details', error);
      showToast({
        type: 'error',
        message: error?.message || t('common.error'),
      });
      navigate('/notifications/channels');
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

  const parseJson = (value: string, fallback: Record<string, unknown>) => {
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
        type: generalForm.type.trim(),
        name: generalForm.name.trim(),
        isEnabled: generalForm.isEnabled,
        config: parseJson(generalForm.configJson, {}),
        metadata: parseJson(generalForm.metadataJson, {}),
      };

      await notificationsService.updateChannel(id, payload);
      showToast({
        type: 'success',
        message: t('notifications.channels.updated') ?? 'Channel updated successfully',
      });

      setCommentDialogOpen(false);
      setPendingChanges([]);
      await loadData();
    } catch (error: any) {
      console.error('Failed to update channel', error);
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
    if (!generalForm || !channel) {
      return [];
    }
    return [
      {
        id: 'details',
        label: t('common.details') ?? 'Details',
        icon: FileText,
        component: ChannelDetailsTab,
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
          entityId: channel.id,
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
          entityId: channel.id,
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
          entityId: channel.id,
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
          entityId: channel.id,
        },
        hidden: !canViewHistory,
      },
    ];
  }, [canRead, canViewHistory, channel, generalForm, isGeneralEditing, t, updateGeneralForm]);

  if (loading || !channel || !generalForm) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <DetailsLayout
        title={channel.name}
        subtitle={`${channel.type} channel`}
        icon={<Bell className="h-6 w-6 text-white" />}
        backUrl="/notifications/channels"
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
        entityName={channel.name}
      />
    </>
  );
}

