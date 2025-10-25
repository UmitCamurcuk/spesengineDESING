const STORAGE_KEY = 'app.preferences';

export interface AppPreferences {
  dateFormat?: string;
  timeZone?: string;
  locale?: string;
}

export const loadPreferences = (): AppPreferences => {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as AppPreferences;
    return parsed ?? {};
  } catch (error) {
    console.warn('Failed to load preferences', error);
    return {};
  }
};

export const savePreferences = (partial: AppPreferences): AppPreferences => {
  if (typeof window === 'undefined') {
    return partial;
  }
  try {
    const current = loadPreferences();
    const merged: AppPreferences = {
      ...current,
      ...partial,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (error) {
    console.warn('Failed to save preferences', error);
  }
  return partial;
};
