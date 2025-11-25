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
import type { AppSettings, SettingsPatchPayload, SettingsPatchRequest } from '../api/types/api.types';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import { savePreferences } from '../utils/preferences';

interface SettingsContextValue {
  settings: AppSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (payload: SettingsPatchPayload, comment: string) => Promise<AppSettings>;
  applyLocally: (settings: AppSettings) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

const COMPACT_CLASS = 'ui-compact-mode';
const HIDE_AVATAR_CLASS = 'ui-hide-avatars';
const FONT_LARGE_CLASS = 'ui-font-large';

const rootElement = () =>
  typeof document !== 'undefined' ? document.documentElement : (null as HTMLElement | null);

function updateCompactClass(compact: boolean) {
  if (typeof document === 'undefined') {
    return;
  }
  const root = rootElement();
  if (!root) return;
  root.classList.toggle(COMPACT_CLASS, compact);
}

function updateAvatarVisibility(show: boolean) {
  if (typeof document === 'undefined') {
    return;
  }
  const root = rootElement();
  if (!root) return;
  root.classList.toggle(HIDE_AVATAR_CLASS, !show);
}

function updateFontScaleClass(scale: 'normal' | 'large' | undefined) {
  if (typeof document === 'undefined') {
    return;
  }
  const root = rootElement();
  if (!root) return;
  root.classList.toggle(FONT_LARGE_CLASS, scale === 'large');
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
        updateAvatarVisibility(Boolean(data.appearance?.showAvatars ?? true));
        updateFontScaleClass(data.appearance?.fontScale ?? 'normal');
        savePreferences({
          dateFormat: data.general?.dateFormat,
          timeZone: data.general?.timezone,
          locale: data.localization?.defaultLanguage,
        });
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
      updateAvatarVisibility(true);
      updateFontScaleClass('normal');
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

  useEffect(() => {
    if (settings) {
      updateAvatarVisibility(Boolean(settings.appearance?.showAvatars ?? true));
    }
  }, [settings?.appearance?.showAvatars]);

  useEffect(() => {
    if (settings) {
      updateFontScaleClass(settings.appearance?.fontScale ?? 'normal');
    }
  }, [settings?.appearance?.fontScale]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setSettings(null);
      updateCompactClass(false);
      return;
    }
    await load();
  }, [isAuthenticated, load]);

  const save = useCallback(
    async (payload: SettingsPatchPayload, comment: string) => {
      if (!isAuthenticated) {
        throw new Error('Cannot save settings while not authenticated');
      }
      setIsSaving(true);
      setError(null);
      try {
        const request: SettingsPatchRequest = {
          ...payload,
          comment: comment.trim(),
        };
        const response = await settingsService.updateSettings(request);
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
