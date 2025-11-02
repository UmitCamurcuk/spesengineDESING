export const normalizeLanguageCode = (code: string): string => {
  const trimmed = (code ?? '').trim();
  if (trimmed.length === 0) {
    return 'tr';
  }
  if (!trimmed.includes('-')) {
    return trimmed.toLowerCase();
  }
  const [language, region] = trimmed.split('-', 2);
  return `${language.toLowerCase()}-${(region ?? '').toUpperCase()}`;
};

export const getLanguageLabel = (code: string, fallback?: string | null): string => {
  if (fallback && fallback.trim().length > 0) {
    return fallback.trim();
  }

  const normalized = normalizeLanguageCode(code);
  switch (normalized) {
    case 'tr':
      return 'Türkçe';
    case 'en':
      return 'English';
    default:
      return normalized.toUpperCase();
  }
};
