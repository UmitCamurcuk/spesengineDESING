import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { localizationsService } from '../api/services/localizations.service';
import type { LocalizationExportBundle, LocalizationRecord } from '../api/types/api.types';
import { useAppDispatch, useReduxSelector } from '../redux/hooks';
import { cacheBundle } from '../redux/slices/translationsSlice';
import type { CachedLocalizationBundle } from '../redux/slices/translationsSlice';

export type Language = string;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translationsReady: boolean;
  ensureTranslationsReady: () => Promise<void>;
  getLocalization: (id: string) => LocalizationRecord | undefined;
  resolveLocalization: (id: string, preferredLanguage?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

const LANGUAGE_STORAGE_KEY = 'language';
const TRANSLATION_STORAGE_PREFIX = 'translations';
const GLOBAL_TENANT_KEY = 'global';

const normalizeLanguageCode = (code: string): string => {
  const trimmed = (code || '').trim();
  if (trimmed.length === 0) {
    return 'tr';
  }
  if (!trimmed.includes('-')) {
    return trimmed.toLowerCase();
  }
  const [language, region] = trimmed.split('-', 2);
  return `${language.toLowerCase()}-${(region ?? '').toUpperCase()}`;
};

const buildCacheKey = (tenantId: string | undefined, language: string): string => {
  const normalizedTenant = tenantId && tenantId.trim().length > 0 ? tenantId : GLOBAL_TENANT_KEY;
  const normalizedLanguage = normalizeLanguageCode(language);
  return `${normalizedTenant}:${normalizedLanguage}`;
};

const storageKeyForBundle = (cacheKey: string): string => `${TRANSLATION_STORAGE_PREFIX}:${cacheKey}`;

const safeGetItem = (key: string): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('LanguageContext: unable to access localStorage.getItem', error);
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('LanguageContext: unable to access localStorage.setItem', error);
  }
};

const safeRemoveItem = (key: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('LanguageContext: unable to access localStorage.removeItem', error);
  }
};

const safeReadBundle = (cacheKey: string): CachedLocalizationBundle | null => {
  const raw = safeGetItem(storageKeyForBundle(cacheKey));
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as CachedLocalizationBundle;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.translations !== 'object' ||
      typeof parsed.localizations !== 'object'
    ) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('LanguageContext: failed to parse cached translations', error);
    return null;
  }
};

const safeWriteBundle = (cacheKey: string, bundle: LocalizationExportBundle): void => {
  const payload: CachedLocalizationBundle = {
    ...bundle,
    fetchedAt: Date.now(),
  };
  safeSetItem(storageKeyForBundle(cacheKey), JSON.stringify(payload));
  const [tenantPart, languagePart] = cacheKey.split(':', 2);
  if (tenantPart && tenantPart !== GLOBAL_TENANT_KEY && languagePart) {
    safeRemoveItem(storageKeyForBundle(`${GLOBAL_TENANT_KEY}:${languagePart}`));
  }
};

const createEmptyBundle = (): LocalizationExportBundle => ({
  translations: {},
  localizations: {},
});

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const session = useReduxSelector((state) => state.auth.session);
  const tenantId = session?.tenantId ?? undefined;

  const [language, setLanguageState] = useState<Language>(() => {
    const stored = safeGetItem(LANGUAGE_STORAGE_KEY);
    return normalizeLanguageCode(stored ?? 'tr');
  });

  const cacheKey = useMemo(() => buildCacheKey(tenantId, language), [tenantId, language]);
  const cachedBundleFromStore = useReduxSelector(
    (state) => state.translations.bundles[cacheKey] ?? null,
  );

  const [bundle, setBundle] = useState<LocalizationExportBundle>(createEmptyBundle);
  const [translationsReady, setTranslationsReady] = useState<boolean>(false);
  const readyResolversRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!translationsReady) {
      return;
    }
    if (readyResolversRef.current.length === 0) {
      return;
    }
    readyResolversRef.current.forEach((resolve) => resolve());
    readyResolversRef.current = [];
  }, [translationsReady]);

  const ensureTranslationsReady = useCallback(() => {
    if (translationsReady) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      readyResolversRef.current.push(resolve);
    });
  }, [translationsReady]);

  useEffect(() => {
    let cancelled = false;

    const applyBundle = (next: LocalizationExportBundle) => {
      if (cancelled) {
        return;
      }
      setBundle(next);
      setTranslationsReady(true);
    };

    const bundleFromStore = cachedBundleFromStore
      ? ({
          translations: cachedBundleFromStore.translations,
          localizations: cachedBundleFromStore.localizations,
        } satisfies LocalizationExportBundle)
      : null;

    if (bundleFromStore) {
      applyBundle(bundleFromStore);
      safeWriteBundle(cacheKey, bundleFromStore);
      return;
    }

    const stored = safeReadBundle(cacheKey);
    if (stored) {
      const { fetchedAt: _ignored, ...plainBundle } = stored;
      applyBundle(plainBundle);
      dispatch(cacheBundle({ key: cacheKey, bundle: plainBundle }));
      return;
    }

    setBundle(createEmptyBundle());
    setTranslationsReady(false);

    const fetchTranslations = async () => {
      try {
        const data = await localizationsService.export(language, tenantId);
        if (cancelled) {
          return;
        }
        applyBundle(data);
        dispatch(cacheBundle({ key: cacheKey, bundle: data }));
        safeWriteBundle(cacheKey, data);
      } catch (error) {
        console.error('Failed to load translations from database:', error);
        if (cancelled) {
          return;
        }
        applyBundle(createEmptyBundle());
      }
    };

    void fetchTranslations();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, cachedBundleFromStore, dispatch, language, tenantId]);

  const setLanguage = useCallback((lang: Language) => {
    const normalized = normalizeLanguageCode(lang || 'tr');
    setLanguageState((prev) => {
      if (prev === normalized) {
        return prev;
      }
      return normalized;
    });
    safeSetItem(LANGUAGE_STORAGE_KEY, normalized);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const keys = key.split('.');
      let current: unknown = bundle.translations;

      for (const piece of keys) {
        if (current && typeof current === 'object' && piece in (current as Record<string, unknown>)) {
          current = (current as Record<string, unknown>)[piece];
        } else {
          return key;
        }
      }

      return typeof current === 'string' ? current : key;
    },
    [bundle.translations],
  );

  const getLocalization = useCallback(
    (id: string): LocalizationRecord | undefined => {
      if (!id) {
        return undefined;
      }
      return bundle.localizations[id];
    },
    [bundle.localizations],
  );

  const resolveLocalization = useCallback(
    (id: string, preferredLanguage?: string): string => {
      if (!id) {
        return '';
      }
      const record = bundle.localizations[id];
      if (!record) {
        return '';
      }

      const preferences = [
        preferredLanguage ? normalizeLanguageCode(preferredLanguage) : null,
        language ? normalizeLanguageCode(language) : null,
        'en',
      ].filter((code): code is string => Boolean(code));

      for (const code of preferences) {
        const value = record.translations[code];
        if (value && value.trim().length > 0) {
          return value;
        }
      }

      const firstValue = Object.values(record.translations)[0];
      return firstValue ?? '';
    },
    [bundle.localizations, language],
  );

  const contextValue = useMemo<LanguageContextType>(
    () => ({
      language,
      setLanguage,
      t,
      translationsReady,
      ensureTranslationsReady,
      getLocalization,
      resolveLocalization,
    }),
    [ensureTranslationsReady, getLocalization, language, resolveLocalization, setLanguage, t, translationsReady],
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
