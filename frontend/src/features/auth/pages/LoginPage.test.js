import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { apiError, mountWithApp } from '@/test-utils';
import { useAuthStore } from '@/features/auth/states/authStore';

vi.mock('@/features/auth/api/authApi', () => ({
  login: vi.fn(),
  register: vi.fn(),
  fetchMe: vi.fn(),
}));

import * as authApi from '@/features/auth/api/authApi';
import LoginPage from './LoginPage.vue';

async function fillAndSubmit(wrapper, email, password) {
  await wrapper.find('#email').setValue(email);
  await wrapper.find('#password').setValue(password);
  await wrapper.find('form').trigger('submit');
  await flushPromises();
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authApi.login.mockResolvedValue({ token: 'tok', user: { id: 1, name: 'Budi', role: 'customer' } });
  });

  it('validasi sisi klien: email tidak valid dan password kosong', async () => {
    const { wrapper } = await mountWithApp(LoginPage, { route: '/masuk' });
    await fillAndSubmit(wrapper, 'bukan-email', '');
    expect(wrapper.text()).toContain('Email tidak valid');
    expect(wrapper.text()).toContain('Password wajib diisi');
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('login sukses menyimpan sesi dan menuju beranda', async () => {
    const { wrapper, router, pinia } = await mountWithApp(LoginPage, { route: '/masuk' });
    await fillAndSubmit(wrapper, 'budi@test.com', 'password123');
    expect(authApi.login).toHaveBeenCalledWith({ email: 'budi@test.com', password: 'password123' });
    expect(useAuthStore(pinia).isAuthenticated).toBe(true);
    expect(router.currentRoute.value.fullPath).toBe('/');
  });

  it('mengikuti parameter redirect internal', async () => {
    const { wrapper, router } = await mountWithApp(LoginPage, { route: '/masuk?redirect=/tiket-saya' });
    await fillAndSubmit(wrapper, 'budi@test.com', 'password123');
    expect(router.currentRoute.value.fullPath).toBe('/tiket-saya');
  });

  it.each(['https://evil.example/curi', '//evil.example'])('menolak redirect eksternal %s', async (target) => {
    const { wrapper, router } = await mountWithApp(LoginPage, { route: `/masuk?redirect=${encodeURIComponent(target)}` });
    await fillAndSubmit(wrapper, 'budi@test.com', 'password123');
    expect(router.currentRoute.value.fullPath).toBe('/');
  });

  it('login gagal menampilkan pesan dan error per field, tetap di halaman login', async () => {
    authApi.login.mockRejectedValue(apiError('Email atau password salah', { password: 'Password salah' }, 401));
    const { wrapper, router, pinia } = await mountWithApp(LoginPage, { route: '/masuk' });
    await fillAndSubmit(wrapper, 'budi@test.com', 'salah');
    expect(wrapper.text()).toContain('Email atau password salah');
    expect(wrapper.text()).toContain('Password salah');
    expect(useAuthStore(pinia).isAuthenticated).toBe(false);
    expect(router.currentRoute.value.name).toBe('login');
  });

  it('error jaringan memakai pesan bawaan', async () => {
    authApi.login.mockRejectedValue(new Error('Network Error'));
    const { wrapper } = await mountWithApp(LoginPage, { route: '/masuk' });
    await fillAndSubmit(wrapper, 'budi@test.com', 'password123');
    expect(wrapper.text()).toContain('Tidak dapat terhubung ke server');
  });

  it('menyediakan tautan ke halaman daftar', async () => {
    const { wrapper } = await mountWithApp(LoginPage, { route: '/masuk' });
    expect(wrapper.find('a[href="/daftar"]').exists()).toBe(true);
  });
});
