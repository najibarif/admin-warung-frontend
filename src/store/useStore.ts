import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from '../api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      const { user, token } = response.data;
      
      if (user.role !== 'admin') {
        set({ error: 'Akses ditolak. Akun bukan admin.', isLoading: false });
        return false;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ user, token, isLoading: false });
      return true;
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || 'Email atau password salah', 
        isLoading: false 
      });
      return false;
    }
  },

  logout: async () => {
    try {
      const token = get().token;
      if (token) {
        await axios.post(`${API_URL}/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {}
    delete axios.defaults.headers.common['Authorization'];
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) return;
    
    try {
      const response = await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = response.data;
      if (user.role !== 'admin') {
        get().logout();
        return;
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ user });
    } catch (err) {
      set({ user: null, token: null });
    }
  }
}));
