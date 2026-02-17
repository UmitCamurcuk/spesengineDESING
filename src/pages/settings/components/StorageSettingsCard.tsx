import React, { useState } from 'react';
import { HardDrive, Server, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useToast } from '../../../contexts/ToastContext';
import { settingsService } from '../../../api/services/settings.service';
import { backupsService } from '../../../api/services/backups.service';
import type { StorageSettings } from '../../../types';

interface StorageSettingsCardProps {
  storage: StorageSettings;
  onSaved: (storage: StorageSettings) => void;
}

export const StorageSettingsCard: React.FC<StorageSettingsCardProps> = ({ storage, onSaved }) => {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [form, setForm] = useState<StorageSettings>(storage);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; latencyMs?: number; error?: string } | null>(null);

  const isDirty = JSON.stringify(form) !== JSON.stringify(storage);

  const providerOptions = [
    { value: 'local', label: t('settings.storage_local') || 'Local Disk' },
    { value: 'minio', label: t('settings.storage_minio') || 'MinIO' },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateSettings({ storage: form } as any);
      onSaved(form);
      showToast({ type: 'success', message: t('common.saved') || 'Saved' });
    } catch {
      showToast({ type: 'error', message: t('common.error') || 'Error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestMinio = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await backupsService.testMinio(form.minio);
      setTestResult({ ok: true, latencyMs: result.latencyMs });
    } catch (error: any) {
      setTestResult({ ok: false, error: error?.response?.data?.message || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <HardDrive className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">{t('settings.storage_title') || 'Storage'}</h3>
        </div>

        {/* Provider selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            {t('settings.storage_provider') || 'Storage Provider'}
          </label>
          <Select
            options={providerOptions}
            value={form.provider}
            onChange={(e) => setForm((prev) => ({ ...prev, provider: e.target.value as 'local' | 'minio' }))}
          />
        </div>

        {/* Local settings */}
        {form.provider === 'local' && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <HardDrive className="h-4 w-4" />
              {t('settings.storage_local') || 'Local Disk'}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Upload Path</label>
                <Input
                  value={form.local.uploadPath}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      local: { ...prev.local, uploadPath: e.target.value },
                    }))
                  }
                  placeholder="uploads"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('settings.storage_max_file_size') || 'Max File Size (MB)'}
                </label>
                <Input
                  type="number"
                  value={form.local.maxFileSizeMB}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      local: { ...prev.local, maxFileSizeMB: Number(e.target.value) },
                    }))
                  }
                  min={1}
                />
              </div>
            </div>
          </div>
        )}

        {/* MinIO settings */}
        {form.provider === 'minio' && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Server className="h-4 w-4" />
              MinIO
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('settings.minio_endpoint') || 'Endpoint'}
                </label>
                <Input
                  value={form.minio.endpoint}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, minio: { ...prev.minio, endpoint: e.target.value } }))
                  }
                  placeholder="192.168.1.10"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('settings.minio_port') || 'Port'}
                </label>
                <Input
                  type="number"
                  value={form.minio.port}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, minio: { ...prev.minio, port: Number(e.target.value) } }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('settings.minio_access_key') || 'Access Key'}
                </label>
                <Input
                  value={form.minio.accessKey}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, minio: { ...prev.minio, accessKey: e.target.value } }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('settings.minio_secret_key') || 'Secret Key'}
                </label>
                <Input
                  type="password"
                  value={form.minio.secretKey}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, minio: { ...prev.minio, secretKey: e.target.value } }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('settings.minio_bucket') || 'Bucket'}
                </label>
                <Input
                  value={form.minio.bucket}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, minio: { ...prev.minio, bucket: e.target.value } }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('settings.minio_public_url') || 'Public URL'}
                </label>
                <Input
                  value={form.minio.publicUrl}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, minio: { ...prev.minio, publicUrl: e.target.value } }))
                  }
                  placeholder="http://minio.local:9000/spesengine"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                checked={form.minio.useSSL}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, minio: { ...prev.minio, useSSL: e.target.checked } }))
                }
                label={t('settings.minio_use_ssl') || 'Use SSL'}
              />
            </div>

            {/* Test connection */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestMinio}
                disabled={testing}
              >
                {testing ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : null}
                {t('settings.test_connection') || 'Test Connection'}
              </Button>
              {testResult && (
                <div className={`flex items-center gap-1.5 text-sm ${testResult.ok ? 'text-success' : 'text-error'}`}>
                  {testResult.ok ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {t('settings.connection_ok') || 'Connected'} ({testResult.latencyMs}ms)
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      {testResult.error || t('settings.connection_fail') || 'Failed'}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save */}
        <div className="flex justify-end pt-2 border-t border-border">
          <Button onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {t('common.save') || 'Save'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
