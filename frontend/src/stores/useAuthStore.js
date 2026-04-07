import { create } from 'zustand';
import { STORAGE_KEYS } from '@/utils/constants';
import { authService } from '@/services/authService';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || null,
  user: null,
  isAuthenticated: !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(username, password);
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      set({
        token: data.token,
        user: { username },
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
