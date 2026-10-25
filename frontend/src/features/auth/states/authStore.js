import { defineStore } from 'pinia';
import * as authApi from '@/features/auth/api/authApi';

const TOKEN_KEY = 'tobatix_token';

/**
 * Token disimpan di sessionStorage: hilang saat tab ditutup dan tidak dibagi antar tab,
 * sehingga paparan jika terjadi XSS lebih sempit dibanding localStorage. Cookie httpOnly
 * lebih aman dari XSS tetapi butuh CSRF protection dan konfigurasi cookie lintas domain.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({ token: sessionStorage.getItem(TOKEN_KEY), user: null }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isAdmin: (state) => state.user?.role === 'admin',
  },
  actions: {
    setSession({ token, user }) {
      this.token = token;
      this.user = user;
      sessionStorage.setItem(TOKEN_KEY, token);
    },
    async login(credentials) {
      this.setSession(await authApi.login(credentials));
    },
    async register(payload) {
      this.setSession(await authApi.register(payload));
    },
    async fetchMe() {
      try {
        this.user = await authApi.fetchMe();
      } catch {
        this.logout();
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      sessionStorage.removeItem(TOKEN_KEY);
    },
  },
});
