import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import translationsReducer from './slices/translationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    translations: translationsReducer,
  },
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
