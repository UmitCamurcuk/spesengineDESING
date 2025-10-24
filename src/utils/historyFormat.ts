type Translate = (key: string, options?: Record<string, unknown>) => string;

const formatBoolean = (value: boolean, t: Translate) => (value ? t('common.yes') : t('common.no'));

const formatBasicValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (_error) {
      return '[object]';
    }
  }
  return String(value);
};

const mapLocalizationFieldLabel = (key: string, t: Translate): string => {
  switch (key) {
    case 'defaultLanguage':
      return t('settings.localization.default_language');
    case 'fallbackLanguage':
      return t('settings.localization.fallback_language');
    case 'supportedLanguages':
      return t('settings.localization.supported_languages');
    case 'allowUserLanguageSwitch':
      return t('settings.localization.allow_user_switch');
    case 'autoTranslateNewContent':
      return t('settings.localization.auto_translate');
    default:
      return key;
  }
};

const formatLocalizationValue = (value: unknown, t: Translate): string => {
  if (!value || typeof value !== 'object') {
    return formatBasicValue(value);
  }

  const entries = Object.entries(value as Record<string, unknown>).map(([key, rawValue]) => {
    const label = mapLocalizationFieldLabel(key, t);

    if (Array.isArray(rawValue)) {
      const formatted = rawValue
        .map((item) => {
          if (item && typeof item === 'object' && 'code' in item && 'label' in item) {
            const descriptor = `${(item as { label: string }).label} (${(item as { code: string }).code})`;
            if ((item as { required?: boolean }).required) {
              return `${descriptor} [${t('settings.localization.labels.required_badge')}]`;
            }
            return descriptor;
          }
          return formatBasicValue(item);
        })
        .join(', ');
      return `${label}: ${formatted || '—'}`;
    }

    if (typeof rawValue === 'boolean') {
      return `${label}: ${formatBoolean(rawValue, t)}`;
    }

    if (typeof rawValue === 'string') {
      const normalized = rawValue.trim();
      return `${label}: ${normalized.length > 0 ? normalized : '—'}`;
    }

    return `${label}: ${formatBasicValue(rawValue)}`;
  });

  return entries.join('\n');
};

export const formatHistoryFieldLabel = (field: string, t: Translate): string => {
  switch (field) {
    case 'general':
      return t('settings.tabs.general');
    case 'appearance':
      return t('settings.tabs.appearance');
    case 'localization':
      return t('settings.tabs.localization');
    case 'notifications':
      return t('settings.tabs.notifications');
    case 'integrations':
      return t('settings.tabs.integrations');
    case 'security':
      return t('settings.tabs.security');
    case 'data':
      return t('settings.tabs.data');
    default:
      return field
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
  }
};

export const formatHistoryValue = (field: string, value: unknown, t: Translate): string => {
  if (value === null || value === undefined) {
    return '—';
  }

  if (field === 'localization') {
    return formatLocalizationValue(value, t);
  }

  if (typeof value === 'boolean') {
    return formatBoolean(value, t);
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatBasicValue(item)).join(', ');
  }

  return formatBasicValue(value);
};
