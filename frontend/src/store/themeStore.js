import { create } from 'zustand';

const useThemeStore = create((set) => ({
  isDark: localStorage.getItem('nexmeet_theme') !== 'light',
  toggleTheme: () => set((state) => {
    const newDark = !state.isDark;
    localStorage.setItem('nexmeet_theme', newDark ? 'dark' : 'light');
    return { isDark: newDark };
  }),
}));

export default useThemeStore;
