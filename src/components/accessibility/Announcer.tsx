import React, { createContext, useContext, useState, useCallback } from 'react';

interface AnnouncerContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AnnouncerContext = createContext<AnnouncerContextType | undefined>(undefined);

export const useAnnouncer = () => {
  const context = useContext(AnnouncerContext);
  if (!context) {
    throw new Error('useAnnouncer must be used within an AnnouncerProvider');
  }
  return context;
};

interface AnnouncerProviderProps {
  children: React.ReactNode;
}

export const AnnouncerProvider: React.FC<AnnouncerProviderProps> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<Array<{
    id: string;
    message: string;
    priority: 'polite' | 'assertive';
  }>>([]);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const id = Date.now().toString();
    setAnnouncements(prev => [...prev, { id, message, priority }]);
    
    // Remove announcement after 3 seconds
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(announcement => announcement.id !== id));
    }, 3000);
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcements
          .filter(announcement => announcement.priority === 'polite')
          .map(announcement => (
            <div key={announcement.id}>{announcement.message}</div>
          ))
        }
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {announcements
          .filter(announcement => announcement.priority === 'assertive')
          .map(announcement => (
            <div key={announcement.id}>{announcement.message}</div>
          ))
        }
      </div>
    </AnnouncerContext.Provider>
  );
};

