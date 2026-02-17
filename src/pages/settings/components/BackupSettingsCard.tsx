import React, { useCallback, useEffect, useState } from 'react';
import { Archive, Play, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Checkbox } from '../../../components/ui/Checkbox';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useToast } from '../../../contexts/ToastContext';
import { backupsService } from '../../../api/services/backups.service';
import type { Backup, BackupSettingsData, BackupStatus } from '../../../types';

const CRON_PRESETS = [
  { label: 'Her gece 03:00', value: '0 3 * * *' },
  { label: 'Her 6 saatte bir', value: '0 */6 * * *' },
  { label: 'Her Pazar 02:00', value: '0 2 * * 0' },
];

const statusBadge = (status: BackupStatus) => {
  if (status === 'success') return <Badge variant="success" size="sm">Başarılı</Badge>;
  if (status === 'failed') return <Badge variant="error" size="sm">Başarısız</Badge>;
  return <Badge variant="warning" size="sm">Çalışıyor</Badge>;
};

const StatusIcon = ({ status }: { status: BackupStatus }) => {
  if (status === 'success') return <CheckCircle className="h-4 w-4 text-success" />;
  if (status === 'failed') return <XCircle className="h-4 w-4 text-error" />;
  return <Clock className="h-4 w-4 text-warning" />;
};

function formatBytes(bytes?: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function formatMs(ms?: number) {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

interface BackupSettingsCardProps {
  settings: BackupSettingsData;
  onSaved: (settings: BackupSettingsData) => void;
}

export const BackupSettingsCard: React.FC<BackupSettingsCardProps> = ({ settings, onSaved }) => {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [form, setForm] = useState<BackupSettingsData>(settings);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);

  const isDirty = JSON.stringify(form) !== JSON.stringify(settings);

  const loadBackups = useCallback(async () => {
    setLoadingBackups(true);
    try {
      const result = await backupsService.list({ page: 1, pageSize: 10 });
      setBackups(result.items);
    } catch {
      // silently ignore
    } finally {
      setLoadingBackups(false);
    }
  }, []);

  useEffect(() => {
    void loadBackups();
  }, [loadBackups]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await backupsService.updateSettings(form);
      onSaved(result.backup);
      showToast({ type: 'success', message: t('common.saved') || 'Saved' });
    } catch {
      showToast({ type: 'error', message: t('common.error') || 'Error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await backupsService.trigger();
      showToast({
        type: 'success',
        message: t('backups.trigger_success') || 'Backup started',
      });
      setTimeout(() => void loadBackups(), 2000);
    } catch {
      showToast({ type: 'error', message: t('common.error') || 'Error' });
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Schedule card */}
      <Card>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <Archive className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold">{t('settings.backup_title') || 'Backup'}</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTrigger}
              disabled={triggering}
            >
              {triggering ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 mr-1.5" />
              )}
              {t('backups.trigger_backup') || 'Backup Now'}
            </Button>
          </div>

          {/* Schedule */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t('settings.backup_schedule') || 'Schedule'}</h4>
            <Checkbox
              checked={form.schedule.enabled}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  schedule: { ...prev.schedule, enabled: e.target.checked },
                }))
              }
              label={t('settings.backup_enabled') || 'Enable scheduled backup'}
            />
            {form.schedule.enabled && (
              <div className="space-y-2 pl-6">
                <div className="flex flex-wrap gap-2">
                  {CRON_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          schedule: { ...prev.schedule, cronExpression: p.value },
                        }))
                      }
                      className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                        form.schedule.cronExpression === p.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <Input
                  value={form.schedule.cronExpression}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      schedule: { ...prev.schedule, cronExpression: e.target.value },
                    }))
                  }
                  placeholder="0 3 * * *"
                />
              </div>
            )}
          </div>

          {/* Targets */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('settings.backup_targets') || 'Backup Targets'}</h4>
            <Checkbox
              checked={form.targets.database}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, targets: { ...prev.targets, database: e.target.checked } }))
              }
              label={t('settings.backup_target_db') || 'Database'}
            />
            <Checkbox
              checked={form.targets.uploadedFiles}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, targets: { ...prev.targets, uploadedFiles: e.target.checked } }))
              }
              label={t('settings.backup_target_files') || 'Uploaded Files'}
            />
          </div>

          {/* Destinations */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Destinations</h4>

            {/* Local */}
            <div className="rounded-lg border border-border p-3 space-y-3">
              <Checkbox
                checked={form.destination.local.enabled}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    destination: {
                      ...prev.destination,
                      local: { ...prev.destination.local, enabled: e.target.checked },
                    },
                  }))
                }
                label={t('settings.backup_dest_local') || 'Local Disk'}
              />
              {form.destination.local.enabled && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {t('settings.backup_local_path') || 'Local Path'}
                    </label>
                    <Input
                      value={form.destination.local.path}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          destination: {
                            ...prev.destination,
                            local: { ...prev.destination.local, path: e.target.value },
                          },
                        }))
                      }
                      placeholder="/backups"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {t('settings.backup_keep_last_n') || 'Keep last N'}
                    </label>
                    <Input
                      type="number"
                      value={form.destination.local.keepLastN}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          destination: {
                            ...prev.destination,
                            local: { ...prev.destination.local, keepLastN: Number(e.target.value) },
                          },
                        }))
                      }
                      min={1}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* MinIO */}
            <div className="rounded-lg border border-border p-3 space-y-3">
              <Checkbox
                checked={form.destination.minio.enabled}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    destination: {
                      ...prev.destination,
                      minio: { ...prev.destination.minio, enabled: e.target.checked },
                    },
                  }))
                }
                label={t('settings.backup_dest_minio') || 'MinIO'}
              />
              {form.destination.minio.enabled && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {t('settings.backup_minio_bucket') || 'Bucket'}
                    </label>
                    <Input
                      value={form.destination.minio.bucket}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          destination: {
                            ...prev.destination,
                            minio: { ...prev.destination.minio, bucket: e.target.value },
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {t('settings.backup_minio_prefix') || 'Prefix'}
                    </label>
                    <Input
                      value={form.destination.minio.prefix}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          destination: {
                            ...prev.destination,
                            minio: { ...prev.destination.minio, prefix: e.target.value },
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-2 border-t border-border">
            <Button onClick={handleSave} disabled={!isDirty || saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {t('common.save') || 'Save'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Backup history */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{t('backups.list_title') || 'Backup History'}</h4>
            <Button variant="ghost" size="sm" onClick={loadBackups} disabled={loadingBackups}>
              {loadingBackups ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Yenile'}
            </Button>
          </div>

          {loadingBackups ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t('backups.no_backups') || 'No backups yet'}
            </p>
          ) : (
            <div className="space-y-2">
              {backups.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon status={b.status} />
                    <div>
                      <p className="font-medium">{new Date(b.createdAt).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.trigger === 'manual' ? t('backups.trigger.manual') || 'Manual' : t('backups.trigger.scheduled') || 'Scheduled'}
                        {b.triggeredBy ? ` · ${b.triggeredBy}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{formatBytes(b.sizeBytes)}</span>
                    <span>{formatMs(b.durationMs)}</span>
                    {statusBadge(b.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
