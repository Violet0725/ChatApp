import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginFormData, RegisterFormData } from '../types';
import { authApi } from '../services/api';
import { STORAGE_KEYS } from '../config/constants';
import { initializeSocket, disconnectSocket } from '../services/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (formData: LoginFormData) => Promise<void>;
  register: (formData: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (formData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(formData);
          const { user, token, refreshToken } = response.data;

          localStorage.setItem(STORAGE_KEYS.TOKEN, token);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Initialize socket connection
          initializeSocket();
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      register: async (formData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(formData);
          const { user, token, refreshToken } = response.data;

          localStorage.setItem(STORAGE_KEYS.TOKEN, token);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          initializeSocket();
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Continue with logout even if API call fails
        } finally {
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          disconnectSocket();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user) => set({ user }),

      checkAuth: async () => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const response = await authApi.getMe();
          if (response.data) {
            set({ user: response.data, isAuthenticated: true });
            initializeSocket();
          }
        } catch {
          // Token invalid, clear auth state
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          set({ isAuthenticated: false, user: null, token: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
