import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatPanel } from '../../components/chatbot/ChatPanel';
import type { WidgetSettings } from '../../types';
import { apiClient } from '../../api/client/axios';
import { API_ENDPOINTS } from '../../api/endpoints';

interface EmbedConfig {
  widgetSettings: Partial<WidgetSettings>;
  welcomeMessage: string;
  name: string;
}

export const ChatbotEmbed: React.FC = () => {
  const [searchParams] = useSearchParams();
  const configId = searchParams.get('configId');
  const [config, setConfig] = useState<EmbedConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configId) {
      setError('configId parametresi gerekli');
      return;
    }

    apiClient
      .get(API_ENDPOINTS.CHATBOT.EMBED(configId))
      .then((res) => setConfig(res.data))
      .catch((err) => {
        setError(err?.response?.data?.error ?? 'Konfigürasyon yüklenemedi');
      });
  }, [configId]);

  // Notify parent iframe of size/state changes
  const postToParent = (type: string, data?: unknown) => {
    if (window.parent !== window) {
      window.parent.postMessage({ source: 'spesengine-chatbot', type, data }, '*');
    }
  };

  const handleClose = () => {
    postToParent('close');
  };

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
        {error}
      </div>
    );
  }

  if (!config) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const ws = config.widgetSettings;

  return (
    <div className="h-screen flex flex-col bg-card">
      <ChatPanel
        onClose={handleClose}
        title={ws.title ?? config.name}
        primaryColor={ws.primaryColor}
        avatarUrl={ws.avatarUrl}
      />
    </div>
  );
};
