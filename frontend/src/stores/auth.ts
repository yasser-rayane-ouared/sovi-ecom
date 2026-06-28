import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  avatar: string;
  is_verified: boolean;
  is_superadmin: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  initialize: async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const response = await api.get('/auth/profile/');
        set({ user: response.data, loading: false, initialized: true });
      } else {
        set({ user: null, loading: false, initialized: true });
      }
    } catch (err) {
      set({ user: null, loading: false, initialized: true });
    }
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null });
  },
}));
