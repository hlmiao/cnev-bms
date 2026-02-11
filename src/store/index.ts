import { create } from 'zustand';

interface ThemeStore {
  isDarkMode: boolean;
  setDarkMode: (isDarkMode: boolean) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDarkMode: false,
  setDarkMode: (isDarkMode: boolean) => set({ isDarkMode }),
}));