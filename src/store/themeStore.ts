import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  loadSavedTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  setMode: async (mode: ThemeMode) => {
    set({ mode });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    } catch (e) {
      console.warn('Failed to save theme mode to storage', e);
    }
  },
  loadSavedTheme: async () => {
    try {
      const savedMode = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        set({ mode: savedMode });
      }
    } catch (e) {
      console.warn('Failed to load theme mode from storage', e);
    }
  },
}));
