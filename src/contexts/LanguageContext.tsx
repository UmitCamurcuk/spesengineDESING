import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { localizationsService } from '../api/services/localizations.service';

export type Language = string;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Load language from localStorage first (before any API calls)
  const [language, setLanguageState] = useState<Language>(() => {
    return localStorage.getItem('language') || 'tr';
  });
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const loadingRef = useRef<boolean>(false);

  // Load translations from database via API
  useEffect(() => {
    // Prevent double calls
    if (loadingRef.current) return;

    const loadTranslations = async () => {
      loadingRef.current = true;
      try {
        // Try to load from API
        const data = await localizationsService.export(language);
        setTranslations(data);
      } catch (error) {
        console.error('Failed to load translations from database:', error);
        
        // Fallback to JSON files if API fails
        try {
          const response = await fetch(`/locales/${language}.json`);
          if (response.ok) {
            const data = await response.json();
            setTranslations(data);
            console.warn('Using fallback JSON translations');
          } else {
            setTranslations({});
          }
        } catch (fallbackError) {
          console.error('Fallback to JSON also failed:', fallbackError);
          setTranslations({});
        }
      } finally {
        loadingRef.current = false;
      }
    };

    loadTranslations();
  }, [language]); // Only trigger when language actually changes

  const setLanguage = useCallback((lang: Language) => {
    const normalized = lang.trim() || 'tr';
    setLanguageState((prev) => {
      if (prev === normalized) {
        return prev;
      }
      return normalized;
    });
    localStorage.setItem('language', normalized);
  }, []);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
