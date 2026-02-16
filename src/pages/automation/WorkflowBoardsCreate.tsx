import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { workflowBoardsService } from '../../api/services/workflow-boards.service';

export const WorkflowBoardsCreate: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prefix, setPrefix] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  const handlePrefixChange = (value: string) => {
    setPrefix(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prefix.trim()) return;

    try {
      setSaving(true);
      setError(null);
      const board = await workflowBoardsService.create({
        name: name.trim(),
        description: description.trim() || undefined,
        prefix: prefix.trim(),
      });
      navigate(`/automation/boards/${board.id}`);
    } catch (err: any) {
      console.error('Failed to create board', err);
      setError(err?.response?.data?.error?.message ?? 'Pano oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title={tr('boards.create_title', 'Yeni Pano')} />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {tr('boards.name', 'Pano Adı')} *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tr('boards.name', 'Pano Adı')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {tr('boards.prefix', 'Önek')} *
            </label>
            <Input
              value={prefix}
              onChange={(e) => handlePrefixChange(e.target.value)}
              placeholder="PROJ"
              required
              maxLength={10}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {tr('boards.prefix_help', 'Görev anahtarları için kullanılacak önek (ör: PROJ → PROJ-1)')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {tr('boards.description', 'Açıklama')}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tr('boards.description', 'Açıklama')}
              rows={3}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving || !name.trim() || !prefix.trim()}>
            {saving ? tr('common.saving', 'Kaydediliyor...') : tr('common.save', 'Kaydet')}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/automation/boards')}>
            {tr('common.cancel', 'İptal')}
          </Button>
        </div>
      </form>
    </div>
  );
};
