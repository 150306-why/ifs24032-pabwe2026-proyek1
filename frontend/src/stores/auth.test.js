import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  fetchMe: vi.fn(),
}));

import * as authApi from '@/api/auth';
import { useAuthStore } from './auth';

describe('auth store', () => {
  beforeEach(() => {
    sessionStorage.clear();
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  it('login menyimpan token dan user', async () => {
    authApi.login.mockResolvedValue({ token: 'abc', user: { id: 1, role: 'customer' } });
    const auth = useAuthStore();
    await auth.login({ email: 'a@b.c', password: 'x' });
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.isAdmin).toBe(false);
    expect(sessionStorage.getItem('tobatix_token')).toBe('abc');
  });

  it('isAdmin true untuk role admin', async () => {
    authApi.login.mockResolvedValue({ token: 't', user: { id: 2, role: 'admin' } });
    const auth = useAuthStore();
    await auth.login({});
    expect(auth.isAdmin).toBe(true);
  });

  it('logout membersihkan sesi', async () => {
    authApi.login.mockResolvedValue({ token: 't', user: { id: 1, role: 'customer' } });
    const auth = useAuthStore();
    await auth.login({});
    auth.logout();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.user).toBeNull();
    expect(sessionStorage.getItem('tobatix_token')).toBeNull();
  });

  it('fetchMe gagal (token tidak valid) -> logout otomatis', async () => {
    sessionStorage.setItem('tobatix_token', 'basi');
    setActivePinia(createPinia());
    authApi.fetchMe.mockRejectedValue(new Error('401'));
    const auth = useAuthStore();
    await auth.fetchMe();
    expect(auth.isAuthenticated).toBe(false);
  });
});
