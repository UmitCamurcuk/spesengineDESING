import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { settingsService } from '../api';
import type { AppSettings, UpdateSettingsPayload, SettingsPatchPayload } from '../api/types/api.types';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';

interface SettingsContextValue {
  settings: AppSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (payload: SettingsPatchPayload) => Promise<AppSettings>;
  applyLocally: (settings: AppSettings) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

function updateCompactClass(compact: boolean) {
  if (typeof document === 'undefined') {
    return;
  }
  const className = 'ui-compact-mode';
  const root = document.documentElement;
  if (compact) {
    root.classList.add(className);
  } else {
    root.classList.remove(className);
  }
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  const { setLanguage } = useLanguage();
  const { setMode, setDarkVariant } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const applyLocally = useCallback(
    (data: AppSettings) => {
      try {
        if (data.localization?.defaultLanguage) {
          setLanguage(data.localization.defaultLanguage);
        }
        if (data.appearance?.themeMode) {
          setMode(data.appearance.themeMode);
        }
        if (data.appearance?.darkVariant) {
          setDarkVariant(data.appearance.darkVariant);
        }
        updateCompactClass(Boolean(data.appearance?.compactMode));
      } catch (err) {
        console.warn('Settings apply error', err);
      }
    },
    [setLanguage, setMode, setDarkVariant],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await settingsService.getSettings();
      setSettings(response);
      applyLocally(response);
    } catch (err) {
      console.error('Failed to load settings', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
      setInitialized(true);
    }
  }, [applyLocally]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setSettings(null);
      updateCompactClass(false);
      setIsLoading(false);
      setInitialized(true);
      return;
    }

    load().catch((err) => {
      console.error('Settings load error', err);
    });
  }, [authLoading, isAuthenticated, load]);

  useEffect(() => {
    if (settings) {
      updateCompactClass(Boolean(settings.appearance?.compactMode));
    }
  }, [settings?.appearance?.compactMode]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setSettings(null);
      updateCompactClass(false);
      return;
    }
    await load();
  }, [isAuthenticated, load]);

  const save = useCallback(
    async (payload: SettingsPatchPayload) => {
      if (!isAuthenticated) {
        throw new Error('Cannot save settings while not authenticated');
      }
      setIsSaving(true);
      setError(null);
      try {
        const response = await settingsService.updateSettings(payload);
        setSettings(response);
        applyLocally(response);
        return response;
      } catch (err) {
        console.error('Failed to save settings', err);
        setError(err instanceof Error ? err.message : 'Failed to save settings');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [isAuthenticated, applyLocally],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      isLoading: !initialized || isLoading,
      isSaving,
      error,
      refresh,
      save,
      applyLocally,
    }),
    [settings, isLoading, initialized, isSaving, error, refresh, save, applyLocally],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
