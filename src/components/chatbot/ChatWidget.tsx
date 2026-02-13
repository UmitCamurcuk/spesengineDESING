import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { ChatPanel } from './ChatPanel';
import { chatbotConfigService } from '../../api/services/chatbot.service';
import type { WidgetSettings } from '../../types';

const DEFAULT_WIDGET: WidgetSettings = {
  position: 'bottom-right',
  primaryColor: '#6366f1',
  bubbleSize: 56,
  title: 'AI Asistan',
  subtitle: '',
  avatarUrl: '',
  showOnPages: 'all',
  customPages: [],
  embedEnabled: false,
  embedAllowedDomains: [],
};

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [widget, setWidget] = useState<WidgetSettings>(DEFAULT_WIDGET);

  useEffect(() => {
    chatbotConfigService
      .getActive()
      .then((config) => {
        if (config?.widgetSettings) {
          setWidget({ ...DEFAULT_WIDGET, ...config.widgetSettings });
        }
      })
      .catch(() => {
        // Use defaults if config unavailable
      });
  }, []);

  const isRight = widget.position === 'bottom-right';

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed z-50 rounded-full text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
          style={{
            width: widget.bubbleSize,
            height: widget.bubbleSize,
            backgroundColor: widget.primaryColor,
            bottom: 24,
            right: isRight ? 24 : undefined,
            left: isRight ? undefined : 24,
          }}
          aria-label="AI Asistan'i ac"
        >
          {widget.avatarUrl ? (
            <img
              src={widget.avatarUrl}
              alt=""
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </button>
      )}

      {/* Slide-over panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none lg:pointer-events-none"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div
            className={`fixed bottom-0 z-50 w-full sm:w-[400px] sm:bottom-6 sm:rounded-xl h-[80vh] sm:h-[600px] bg-card border border-border shadow-2xl flex flex-col overflow-hidden sm:rounded-xl animate-in slide-in-from-bottom-4 duration-300 ${
              isRight ? 'right-0 sm:right-6' : 'left-0 sm:left-6'
            }`}
          >
            <ChatPanel
              onClose={() => setIsOpen(false)}
              title={widget.title}
              primaryColor={widget.primaryColor}
              avatarUrl={widget.avatarUrl}
            />
          </div>
        </>
      )}
    </>
  );
};
