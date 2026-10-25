import { defineStore } from 'pinia';
import * as authApi from '@/features/auth/api/authApi';

const TOKEN_KEY = 'tobatix_token';

/**
 * Token disimpan di localStorage agar sesi bertahan antar tab/halaman (mis. membuka
 * halaman terproteksi lewat URL langsung atau tab baru). Konsekuensinya token terbaca
 * oleh JavaScript jika terjadi XSS; mitigasinya validasi/escape input dan CSP. Cookie
 * httpOnly lebih aman dari XSS tetapi butuh CSRF protection dan konfigurasi lintas domain.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({ token: localStorage.getItem(TOKEN_KEY), user: null }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isAdmin: (state) => state.user?.role === 'admin',
  },
  actions: {
    setSession({ token, user }) {
      this.token = token;
      this.user = user;
      localStorage.setItem(TOKEN_KEY, token);
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
      localStorage.removeItem(TOKEN_KEY);
    },
  },
});