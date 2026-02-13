import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Cog, BookOpen, Copy, Check } from 'lucide-react';
import type { ConversationMessage } from '../../types';

interface ChatMessageProps {
  message: ConversationMessage;
}

const sourceLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ai: { label: 'AI', icon: Bot, color: 'text-primary' },
  rule: { label: 'Kural', icon: BookOpen, color: 'text-amber-500' },
  system: { label: 'Sistem', icon: Cog, color: 'text-muted-foreground' },
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback - ignore
    }
  };

  return (
    <div className={`group flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* Source badge + copy button for assistant messages */}
        {!isUser && (
          <div className="flex items-center gap-1 mt-1.5">
            {message.source && (
              <div className="flex items-center gap-1 opacity-60">
                {(() => {
                  const meta = sourceLabels[message.source] ?? sourceLabels.ai;
                  const Icon = meta.icon;
                  return (
                    <>
                      <Icon className={`h-3 w-3 ${meta.color}`} />
                      <span className="text-[10px]">{meta.label}</span>
                    </>
                  );
                })()}
                {message.tokens && (
                  <span className="text-[10px] ml-2">
                    {(message.tokens.prompt ?? 0) + (message.tokens.completion ?? 0)} token
                  </span>
                )}
              </div>
            )}
            <button
              onClick={handleCopy}
              className="ml-auto opacity-0 group-hover:opacity-60 hover:!opacity-100 p-0.5 rounded transition-opacity"
              title="Kopyala"
            >
              {copied ? (
                <Check className="h-3 w-3 text-success" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
