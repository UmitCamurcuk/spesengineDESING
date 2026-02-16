import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Tag } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import type { WorkflowBoard } from '../../../types';
import { workflowBoardsService } from '../../../api/services/workflow-boards.service';

interface BoardSettingsPanelProps {
  board: WorkflowBoard;
  onClose: () => void;
  onBoardUpdated: (board: WorkflowBoard) => void;
}

export const BoardSettingsPanel: React.FC<BoardSettingsPanelProps> = ({
  board,
  onClose,
  onBoardUpdated,
}) => {
  const [taskTypes, setTaskTypes] = useState<string[]>(
    Array.isArray(board.taskTypes) && board.taskTypes.length > 0
      ? board.taskTypes
      : ['task', 'bug', 'story', 'epic'],
  );
  const [newType, setNewType] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddType = () => {
    const type = newType.trim().toLowerCase();
    if (!type || taskTypes.includes(type)) return;
    setTaskTypes((prev) => [...prev, type]);
    setNewType('');
  };

  const handleRemoveType = (type: string) => {
    setTaskTypes((prev) => prev.filter((t) => t !== type));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await workflowBoardsService.update(board.id, { taskTypes });
      onBoardUpdated(updated);
      onClose();
    } catch (err) {
      console.error('Failed to update board settings', err);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-background shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Pano Ayarları</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Task Types */}
          <div className="p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Tag className="h-3 w-3" />
              Görev Tipleri
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Bu panoda kullanılabilecek görev tiplerini yönetin.
            </p>

            {/* Current types */}
            <div className="space-y-1.5">
              {taskTypes.map((type) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {type}
                    </Badge>
                  </div>
                  <button
                    onClick={() => handleRemoveType(type)}
                    disabled={taskTypes.length <= 1}
                    className="p-1 rounded hover:bg-error/10 text-muted-foreground hover:text-error transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Tipi sil"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new type */}
            <div className="flex items-center gap-2">
              <Input
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="Yeni tip adı..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddType()}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddType}
                disabled={!newType.trim() || taskTypes.includes(newType.trim().toLowerCase())}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
