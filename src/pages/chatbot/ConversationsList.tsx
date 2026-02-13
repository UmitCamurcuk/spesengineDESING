import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Trash2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { PERMISSIONS } from '../../config/permissions';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import type { Conversation } from '../../types';
import { conversationService } from '../../api/services/chatbot.service';

const statusColors: Record<string, string> = {
  active: 'success',
  closed: 'secondary',
  archived: 'default',
};

export const ConversationsList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const { addToast } = useToast();
  const canDelete = hasPermission(PERMISSIONS.CHATBOT.CONVERSATIONS.DELETE);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        const { items } = await conversationService.list({ limit: 100 });
        if (!cancelled) setConversations(items);
      } catch (err: any) {
        console.error('Failed to load conversations', err);
        if (!cancelled) {
          setError(err?.response?.data?.error?.message ?? 'Sohbet listesi yüklenemedi.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchConversations();
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu sohbeti silmek istediğinize emin misiniz?')) return;
    try {
      await conversationService.delete(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      addToast({ type: 'success', message: 'Sohbet silindi' });
    } catch (err: any) {
      addToast({ type: 'error', message: 'Sohbet silinemedi' });
    }
  };

  const columns = [
    {
      key: 'title',
      title: 'Başlık',
      render: (_val: unknown, conv: Conversation) => (
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">
            {conv.title || 'İsimsiz Sohbet'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Durum',
      render: (_val: unknown, conv: Conversation) => (
        <Badge variant={statusColors[conv.status] as any}>{conv.status}</Badge>
      ),
    },
    {
      key: 'messages',
      title: 'Mesaj',
      render: (_val: unknown, conv: Conversation) => (
        <span className="text-muted-foreground">{conv.messages?.length ?? 0} mesaj</span>
      ),
    },
    {
      key: 'totalTokens',
      title: 'Token',
      render: (_val: unknown, conv: Conversation) => (
        <span className="text-muted-foreground">{conv.totalTokens}</span>
      ),
    },
    {
      key: 'lastMessageAt',
      title: 'Son Mesaj',
      render: (_val: unknown, conv: Conversation) => (
        <span className="text-muted-foreground text-sm">
          {new Date(conv.lastMessageAt).toLocaleString('tr-TR')}
        </span>
      ),
    },
    ...(canDelete
      ? [
          {
            key: 'actions',
            title: '',
            render: (_val: unknown, conv: Conversation) => (
              <Button
                variant="ghost"
                size="sm"
                className="text-error"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleDelete(conv.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sohbetler"
        subtitle="Chatbot sohbet geçmişini görüntüleyin"
      />

      {error && (
        <div className="rounded-lg border border-error/20 bg-error/5 p-4">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <DataTable
        data={conversations}
        columns={columns}
        loading={loading}
        emptyState={{ title: 'Henüz sohbet başlatılmamış.' }}
      />
    </div>
  );
};
