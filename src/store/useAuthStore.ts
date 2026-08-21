import { create } from 'zustand';
import { api } from '@/services/api';
import { User, LoginResponse } from '@/types/chat';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRestoring: boolean;
  error: string | null;
  login: (phone: string, name: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isRestoring: true,
  error: null,

  login: async (phone: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<LoginResponse>('/auth/login', { phone, name });
      const { token, user } = response.data;
      
      localStorage.setItem('chat_app_token', token);
      localStorage.setItem('chat_app_user', JSON.stringify(user));
      
      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      console.error('Login error:', err);
      let errorMessage = 'Login failed. Please try again.';
      
      const axiosError = err as {
        response?: {
          data?: {
            error?: {
              code?: string;
              message?: string;
              details?: Array<{ path: string; message: string }>;
            };
          };
        };
      };

      if (axiosError.response?.data?.error) {
        const apiError = axiosError.response.data.error;
        if (apiError.code === 'VALIDATION_ERROR' && apiError.details) {
          errorMessage = apiError.details.map((d) => `${d.path}: ${d.message}`).join(', ');
        } else {
          errorMessage = apiError.message || errorMessage;
        }
      }
      set({ isLoading: false, error: errorMessage });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('chat_app_token');
    localStorage.removeItem('chat_app_user');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  restoreSession: async () => {
    set({ isRestoring: true });
    try {
      const storedToken = localStorage.getItem('chat_app_token');

      if (!storedToken) {
        set({ isRestoring: false, isAuthenticated: false });
        return false;
      }

      // Pre-set in state so api interceptor can use it
      set({ token: storedToken });

      // Verify token with backend
      const response = await api.get<User>('/auth/me');
      const user = response.data;

      localStorage.setItem('chat_app_user', JSON.stringify(user));
      set({
        user,
        isAuthenticated: true,
        isRestoring: false,
      });
      return true;
    } catch (err) {
      console.error('Session restoration failed:', err);
      // Clean up invalid session
      localStorage.removeItem('chat_app_token');
      localStorage.removeItem('chat_app_user');
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isRestoring: false,
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
