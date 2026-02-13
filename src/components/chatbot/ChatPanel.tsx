import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Plus,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { ChatMessage } from './ChatMessage';
import { conversationService } from '../../api/services/chatbot.service';
import type { Conversation, ConversationMessage } from '../../types';

interface ChatPanelProps {
  onClose: () => void;
  title?: string;
  primaryColor?: string;
  avatarUrl?: string;
}

type View = 'list' | 'chat';

export const ChatPanel: React.FC<ChatPanelProps> = ({
  onClose,
  title,
  primaryColor,
  avatarUrl,
}) => {
  const [view, setView] = useState<View>('list');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when entering chat view
  useEffect(() => {
    if (view === 'chat') {
      inputRef.current?.focus();
    }
  }, [view]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const result = await conversationService.list({ status: 'active', limit: 20 });
      setConversations(result.items);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      setLoading(true);
      const conv = await conversationService.create();
      setActiveConversation(conv);
      setMessages(conv.messages ?? []);
      setView('chat');
    } catch (err) {
      console.error('Failed to create conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConversation = async (conv: Conversation) => {
    try {
      setLoading(true);
      const full = await conversationService.getById(conv.id);
      setActiveConversation(full);
      setMessages(full.messages ?? []);
      setView('chat');
    } catch (err) {
      console.error('Failed to open conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await conversationService.delete(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setActiveConversation(null);
    setMessages([]);
    loadConversations();
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeConversation || sending) return;

    setInput('');
    setSending(true);

    // Optimistic user message
    const tempUserMsg: ConversationMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      source: 'ai',
      tokens: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const { userMessage, assistantMessage } = await conversationService.sendMessage(
        activeConversation.id,
        text,
      );
      // Replace optimistic message with real ones
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        userMessage,
        assistantMessage,
      ]);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Replace optimistic message with error
      const errorMsg: ConversationMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Mesaj gönderilemedi. Lütfen tekrar deneyin.',
        source: 'system',
        tokens: null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-border"
        style={primaryColor ? { backgroundColor: primaryColor, color: '#fff' } : undefined}
      >
        <div className="flex items-center gap-2">
          {view === 'chat' && (
            <button
              onClick={handleBackToList}
              className="p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className={`h-4 w-4 ${primaryColor ? 'text-white/70' : 'text-muted-foreground'}`} />
            </button>
          )}
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <MessageSquare className={`h-5 w-5 ${primaryColor ? 'text-white/90' : 'text-primary'}`} />
          )}
          <h3 className={`text-sm font-semibold ${primaryColor ? 'text-white' : 'text-foreground'}`}>
            {view === 'chat'
              ? activeConversation?.title || 'Yeni Sohbet'
              : title || 'AI Asistan'}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-white/10 transition-colors"
        >
          <X className={`h-4 w-4 ${primaryColor ? 'text-white/70' : 'text-muted-foreground'}`} />
        </button>
      </div>

      {/* Body */}
      {view === 'list' ? (
        /* Conversation List */
        <div className="flex-1 overflow-y-auto">
          {/* New conversation button */}
          <div className="p-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleNewConversation}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Sohbet
            </Button>
          </div>

          {loading && conversations.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Henüz sohbet yok. Yeni bir sohbet başlatın!
              </p>
            </div>
          ) : (
            <div className="space-y-1 px-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleOpenConversation(conv)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground truncate flex-1">
                      {conv.title || 'Adsız Sohbet'}
                    </p>
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {conv.messages?.length ?? 0} mesaj &middot;{' '}
                    {new Date(conv.lastMessageAt || conv.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Chat View */
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !sending && (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Merhaba! Size nasıl yardımcı olabilirim?
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 bg-card">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Mesajınızı yazın..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-[120px]"
                style={{ minHeight: '40px' }}
                disabled={sending}
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="flex-shrink-0"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
