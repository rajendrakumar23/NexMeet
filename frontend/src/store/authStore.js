import { create } from 'zustand';
import api from '../utils/api';
import { connectSocket, disconnectSocket } from '../socket/socket';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('nexmeet_token'),
  loading: false,
  isAuthenticated: !!localStorage.getItem('nexmeet_token'),

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('nexmeet_token', data.token);
      set({ user: data.user, token: data.token, isAuthenticated: true, loading: false });
      connectSocket(data.user._id);
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('nexmeet_token', data.token);
      set({ user: data.user, token: data.token, isAuthenticated: true, loading: false });
      connectSocket(data.user._id);
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('nexmeet_token');
    disconnectSocket();
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, isAuthenticated: true });
      connectSocket(data.user._id);
    } catch {
      set({ user: null, isAuthenticated: false });
      localStorage.removeItem('nexmeet_token');
    }
  },

  updateUser: (user) => set({ user }),
}));

export default useAuthStore;
