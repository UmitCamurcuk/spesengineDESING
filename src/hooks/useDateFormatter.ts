import { useCallback, useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { loadPreferences } from '../utils/preferences';

interface FormatOptions {
  includeTime?: boolean;
}

const DEFAULT_FORMAT = 'YYYY-MM-DD';

const normalizeLocale = (value?: string): string => {
  if (!value) {
    return 'en-US';
  }
  const trimmed = value.trim();
  if (trimmed.includes('-')) {
    const [lang, region] = trimmed.split('-', 2);
    return `${lang.toLowerCase()}-${(region ?? lang).toUpperCase()}`;
  }
  if (trimmed.length === 2) {
    return `${trimmed.toLowerCase()}-${trimmed.toUpperCase()}`;
  }
  return trimmed;
};

const buildFormattedDate = (
  date: Date,
  format: string,
  locale: string,
  timeZone?: string,
): { date: string; parts: Record<string, string> } => {
  const baseOptions: Intl.DateTimeFormatOptions = {
    timeZone: timeZone || undefined,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  let parts: Record<string, string> = {};
  try {
    parts = new Intl.DateTimeFormat(locale, baseOptions)
      .formatToParts(date)
      .reduce<Record<string, string>>((acc, part) => {
        if (part.type !== 'literal') {
          acc[part.type] = part.value;
        }
        return acc;
      }, {});
  } catch (error) {
    console.warn('Failed to parse date parts', error);
  }

  const year = parts.year;
  const month = parts.month;
  const day = parts.day;

  let formattedDate: string | undefined;
  if (year && month && day) {
    switch (format) {
      case 'YYYY-MM-DD':
        formattedDate = `${year}-${month}-${day}`;
        break;
      case 'DD.MM.YYYY':
        formattedDate = `${day}.${month}.${year}`;
        break;
      case 'DD/MM/YYYY':
        formattedDate = `${day}/${month}/${year}`;
        break;
      case 'MM/DD/YYYY':
        formattedDate = `${month}/${day}/${year}`;
        break;
      default:
        formattedDate = undefined;
    }
  }

  if (!formattedDate) {
    try {
      formattedDate = new Intl.DateTimeFormat(locale, {
        timeZone: timeZone || undefined,
        dateStyle: 'medium',
      }).format(date);
    } catch (error) {
      console.warn('Fallback date formatting failed', error);
      formattedDate = date.toISOString();
    }
  }

  return { date: formattedDate, parts };
};

const buildTimePart = (
  date: Date,
  locale: string,
  timeZone?: string,
): string | undefined => {
  try {
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: timeZone || undefined,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(date);
  } catch (error) {
    console.warn('Time formatting failed', error);
    return undefined;
  }
};

export const useDateFormatter = () => {
  const { settings } = useSettings();

  const preferences = useMemo(() => {
    const stored = loadPreferences();
    const dateFormat = settings?.general?.dateFormat ?? stored.dateFormat ?? DEFAULT_FORMAT;
    const timeZone = settings?.general?.timezone ?? stored.timeZone;
    const localeSource = settings?.localization?.defaultLanguage ?? stored.locale;
    const locale = normalizeLocale(localeSource);
    return { dateFormat, timeZone, locale };
  }, [settings?.general?.dateFormat, settings?.general?.timezone, settings?.localization?.defaultLanguage]);

  const formatDateTime = useCallback(
    (value: string | number | Date | null | undefined, options?: FormatOptions): string => {
      if (value === null || value === undefined) {
        return '—';
      }

      const includeTime = options?.includeTime ?? false;
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) {
        return typeof value === 'string' ? value : '—';
      }

      const { date: formattedDate } = buildFormattedDate(
        date,
        preferences.dateFormat,
        preferences.locale,
        preferences.timeZone,
      );

      if (!includeTime) {
        return formattedDate;
      }

      const timePart = buildTimePart(date, preferences.locale, preferences.timeZone);
      return timePart ? `${formattedDate} ${timePart}` : formattedDate;
    },
    [preferences.dateFormat, preferences.locale, preferences.timeZone],
  );

  return { formatDateTime, preferences };
};
