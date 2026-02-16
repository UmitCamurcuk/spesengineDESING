import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, UserMinus, Search } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import type { WorkflowBoard } from '../../../types';
import { workflowBoardsService } from '../../../api/services/workflow-boards.service';
import { usersService } from '../../../api/services/users.service';

interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface BoardMembersPanelProps {
  board: WorkflowBoard;
  onClose: () => void;
  onBoardUpdated: (board: WorkflowBoard) => void;
}

export const BoardMembersPanel: React.FC<BoardMembersPanelProps> = ({
  board,
  onClose,
  onBoardUpdated,
}) => {
  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await usersService.list({ pageSize: 200 });
      setAllUsers(response.items ?? []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (userId: string) => {
    setActionLoading(userId);
    try {
      const updated = await workflowBoardsService.addMember(board.id, userId);
      onBoardUpdated(updated);
    } catch (err) {
      console.error('Failed to add member', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (userId: string) => {
    setActionLoading(userId);
    try {
      const updated = await workflowBoardsService.removeMember(board.id, userId);
      onBoardUpdated(updated);
    } catch (err) {
      console.error('Failed to remove member', err);
    } finally {
      setActionLoading(null);
    }
  };

  const memberIds = new Set(board.members);
  const members = allUsers.filter((u) => memberIds.has(u.id));
  const nonMembers = allUsers.filter(
    (u) =>
      !memberIds.has(u.id) &&
      (search
        ? `${u.firstName} ${u.lastName} ${u.email}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true),
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-background shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Üye Yönetimi</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Current Members */}
          <div className="p-4 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Mevcut Üyeler ({members.length})
            </h3>
            {loading ? (
              <div className="text-xs text-muted-foreground py-2">Yükleniyor...</div>
            ) : members.length === 0 ? (
              <div className="text-xs text-muted-foreground py-2">Henüz üye yok</div>
            ) : (
              members.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-medium text-primary">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(user.id)}
                    disabled={actionLoading === user.id}
                    className="p-1 rounded hover:bg-error/10 text-muted-foreground hover:text-error transition-colors flex-shrink-0"
                    title="Üyeyi çıkar"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Members */}
          <div className="p-4 border-t border-border space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Üye Ekle
            </h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kullanıcı ara..."
                className="pl-8"
              />
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {nonMembers.length === 0 ? (
                <div className="text-xs text-muted-foreground py-2 text-center">
                  {search ? 'Sonuç bulunamadı' : 'Tüm kullanıcılar zaten üye'}
                </div>
              ) : (
                nonMembers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-medium text-secondary">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAdd(user.id)}
                      disabled={actionLoading === user.id}
                      className="p-1 rounded hover:bg-success/10 text-muted-foreground hover:text-success transition-colors flex-shrink-0"
                      title="Üye ekle"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
