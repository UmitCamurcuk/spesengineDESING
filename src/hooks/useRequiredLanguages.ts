import { useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { getLanguageLabel, normalizeLanguageCode } from '../utils/language';

export interface RequiredLanguage {
  code: string;
  label: string;
}

const FALLBACK_REQUIRED_LANGUAGE: RequiredLanguage = {
  code: 'tr',
  label: 'Türkçe',
};

export const useRequiredLanguages = (): RequiredLanguage[] => {
  const { settings } = useSettings();

  return useMemo(() => {
    const supported = settings?.localization?.supportedLanguages ?? [];
    const normalized = supported.map((lang) => ({
      code: normalizeLanguageCode(lang.code),
      label: getLanguageLabel(lang.code, lang.label),
      required: Boolean(lang.required),
    }));

    const required = normalized.filter((lang) => lang.required);
    if (required.length > 0) {
      return required.map(({ code, label }) => ({ code, label }));
    }

    if (normalized.length > 0) {
      const [first] = normalized;
      return [{ code: first.code, label: first.label }];
    }

    return [FALLBACK_REQUIRED_LANGUAGE];
  }, [settings?.localization?.supportedLanguages]);
};
