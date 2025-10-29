import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { LocalizationExportBundle } from '../../api/types/api.types';

export interface CachedLocalizationBundle extends LocalizationExportBundle {
  fetchedAt: number;
}

interface CachePayload {
  key: string;
  bundle: LocalizationExportBundle;
}

export interface TranslationsState {
  bundles: Record<string, CachedLocalizationBundle>;
}

const initialState: TranslationsState = {
  bundles: {},
};

const translationsSlice = createSlice({
  name: 'translations',
  initialState,
  reducers: {
    cacheBundle(state, action: PayloadAction<CachePayload>) {
      const { key, bundle } = action.payload;
      state.bundles[key] = {
        ...bundle,
        fetchedAt: Date.now(),
      };
    },
    removeBundle(state, action: PayloadAction<string>) {
      delete state.bundles[action.payload];
    },
    clearBundles(state) {
      state.bundles = {};
    },
  },
});

export const { cacheBundle, removeBundle, clearBundles } = translationsSlice.actions;

export default translationsSlice.reducer;
