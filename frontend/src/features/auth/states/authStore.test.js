import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/features/auth/api/authApi', () => ({
  login: vi.fn(),
  register: vi.fn(),
  fetchMe: vi.fn(),
}));

import * as authApi from '@/features/auth/api/authApi';
import { useAuthStore } from './authStore';

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  it('login menyimpan token dan user', async () => {
    authApi.login.mockResolvedValue({ token: 'abc', user: { id: 1, role: 'customer' } });
    const auth = useAuthStore();
    await auth.login({ email: 'a@b.c', password: 'x' });
    expect(authApi.login).toHaveBeenCalledWith({ email: 'a@b.c', password: 'x' });
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.isAdmin).toBe(false);
    expect(localStorage.getItem('tobatix_token')).toBe('abc');
  });

  it('register menyimpan sesi seperti login', async () => {
    authApi.register.mockResolvedValue({ token: 'reg', user: { id: 3, role: 'customer', name: 'Baru' } });
    const auth = useAuthStore();
    await auth.register({ name: 'Baru' });
    expect(authApi.register).toHaveBeenCalledWith({ name: 'Baru' });
    expect(auth.token).toBe('reg');
    expect(auth.user.name).toBe('Baru');
    expect(localStorage.getItem('tobatix_token')).toBe('reg');
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
    expect(localStorage.getItem('tobatix_token')).toBeNull();
  });

  it('state awal membaca token dari localStorage', () => {
    localStorage.setItem('tobatix_token', 'tersimpan');
    setActivePinia(createPinia());
    const auth = useAuthStore();
    expect(auth.token).toBe('tersimpan');
    expect(auth.user).toBeNull();
    expect(auth.isAuthenticated).toBe(true);
  });

  it('fetchMe sukses mengisi user', async () => {
    authApi.fetchMe.mockResolvedValue({ id: 9, name: 'Budi', role: 'customer' });
    const auth = useAuthStore();
    await auth.fetchMe();
    expect(auth.user).toEqual({ id: 9, name: 'Budi', role: 'customer' });
  });

  it('fetchMe gagal (token tidak valid) -> logout otomatis', async () => {
    localStorage.setItem('tobatix_token', 'basi');
    setActivePinia(createPinia());
    authApi.fetchMe.mockRejectedValue(new Error('401'));
    const auth = useAuthStore();
    await auth.fetchMe();
    expect(auth.isAuthenticated).toBe(false);
    expect(localStorage.getItem('tobatix_token')).toBeNull();
  });
});