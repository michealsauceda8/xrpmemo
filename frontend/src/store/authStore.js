import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      register: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.detail || 'Registration failed');
          }

          set({
            user: data.user,
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false,
          });

          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.detail || 'Login failed');
          }

          set({
            user: data.user,
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false,
          });

          return data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        // Clear wallet data too
        localStorage.removeItem('xrp-wallet-storage');
      },

      updateProfile: async (data) => {
        const { token } = get();
        const response = await fetch(`${API}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Update failed');
        }

        if (data.name) {
          set((state) => ({
            user: { ...state.user, name: data.name },
          }));
        }
      },

      updatePassword: async (currentPassword, newPassword) => {
        const { token } = get();
        const response = await fetch(`${API}/auth/password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Password update failed');
        }
      },

      getAuthHeader: () => {
        const { token } = get();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
      },
    }),
    {
      name: 'xrp-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
