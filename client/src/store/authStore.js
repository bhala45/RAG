import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  // Initialize auth state from localStorage
  loadUser: async () => {
    try {
      if (typeof window === 'undefined') return;

      const token = localStorage.getItem('campuswise_token');
      const storedUser = localStorage.getItem('campuswise_user');

      if (!token) {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }

      set({ token, isAuthenticated: true, user: storedUser ? JSON.parse(storedUser) : null });

      // Verify token freshness against backend
      const res = await api.get('/auth/me');
      if (res.data && res.data.data) {
        localStorage.setItem('campuswise_user', JSON.stringify(res.data.data));
        set({ user: res.data.data, isAuthenticated: true, isLoading: false });
      }
    } catch (err) {
      console.warn('[AuthStore] Session verification failed, clearing auth.');
      localStorage.removeItem('campuswise_token');
      localStorage.removeItem('campuswise_user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data.data;

      localStorage.setItem('campuswise_token', token);
      localStorage.setItem('campuswise_user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true, user };
    } catch (err) {
      set({ isLoading: false });
      const message = err.response?.data?.error || err.response?.data?.errors?.[0]?.message || err.message;
      return { success: false, error: message };
    }
  },

  register: async ({ name, email, password, role = 'student', department = 'General' }) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', { name, email, password, role, department });
      const { user, token } = res.data.data;

      localStorage.setItem('campuswise_token', token);
      localStorage.setItem('campuswise_user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true, user };
    } catch (err) {
      set({ isLoading: false });
      const message = err.response?.data?.error || err.response?.data?.errors?.[0]?.message || err.message;
      return { success: false, error: message };
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('campuswise_token');
      localStorage.removeItem('campuswise_user');
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
}));
