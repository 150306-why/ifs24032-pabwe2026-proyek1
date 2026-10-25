import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { apiError, mountWithApp } from '@/test/helpers';
import { useAuthStore } from '@/features/auth/states/authStore';

vi.mock('@/features/auth/api/authApi', () => ({
  login: vi.fn(),
  register: vi.fn(),
  fetchMe: vi.fn(),
}));

import * as authApi from '@/features/auth/api/authApi';
import AdminLoginPage from './AdminLoginPage.vue';

const ADMIN = { token: 'tok', user: { id: 1, name: 'Admin', role: 'admin' } };
const CUSTOMER = { token: 'tok2', user: { id: 2, name: 'Budi', role: 'customer' } };

async function fillAndSubmit(wrapper, email = 'admin@tobatix.test', password = 'rahasia123') {
  await wrapper.find('#username').setValue(email);
  await wrapper.find('#password').setValue(password);
  await wrapper.find('form').trigger('submit');
  await flushPromises();
}

describe('AdminLoginPage', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('menampilkan judul khusus admin dan tautan ke login pelanggan', async () => {
    const { wrapper } = await mountWithApp(AdminLoginPage, { route: '/admin/login' });
    expect(wrapper.find('h1').text()).toBe('Masuk admin');
    expect(wrapper.find('a[href="/masuk"]').exists()).toBe(true);
    expect(wrapper.find('#btn-submit').text()).toContain('panel admin');
  });

  it('validasi sisi klien', async () => {
    const { wrapper } = await mountWithApp(AdminLoginPage, { route: '/admin/login' });
    await fillAndSubmit(wrapper, 'x', '');
    expect(wrapper.text()).toContain('Email tidak valid');
    expect(wrapper.text()).toContain('Password wajib diisi');
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('admin berhasil masuk dan menuju dasbor', async () => {
    authApi.login.mockResolvedValue(ADMIN);
    const { wrapper, router, pinia } = await mountWithApp(AdminLoginPage, { route: '/admin/login' });
    await fillAndSubmit(wrapper);
    expect(useAuthStore(pinia).isAdmin).toBe(true);
    expect(router.currentRoute.value.name).toBe('admin-dashboard');
  });

  it('mengikuti redirect ke halaman admin, mengabaikan tujuan non-admin dan eksternal', async () => {
    authApi.login.mockResolvedValue(ADMIN);
    const ok = await mountWithApp(AdminLoginPage, { route: '/admin/login?redirect=/admin/bookings' });
    await fillAndSubmit(ok.wrapper);
    expect(ok.router.currentRoute.value.fullPath).toBe('/admin/bookings');

    const other = await mountWithApp(AdminLoginPage, { route: '/admin/login?redirect=/tiket-saya' });
    await fillAndSubmit(other.wrapper);
    expect(other.router.currentRoute.value.name).toBe('admin-dashboard');

    const evil = await mountWithApp(AdminLoginPage, { route: `/admin/login?redirect=${encodeURIComponent('//evil.example')}` });
    await fillAndSubmit(evil.wrapper);
    expect(evil.router.currentRoute.value.name).toBe('admin-dashboard');
  });

  it('akun pelanggan ditolak, sesi dibersihkan, dan tetap di halaman', async () => {
    authApi.login.mockResolvedValue(CUSTOMER);
    const { wrapper, router, pinia } = await mountWithApp(AdminLoginPage, { route: '/admin/login' });
    await fillAndSubmit(wrapper, 'budi@test.com', 'password123');
    expect(wrapper.find('[role="alert"]').text()).toContain('bukan akun admin');
    expect(useAuthStore(pinia).isAuthenticated).toBe(false);
    expect(localStorage.getItem('tobatix_token')).toBeNull();
    expect(router.currentRoute.value.name).toBe('admin-login');
  });

  it('kredensial salah menampilkan pesan server', async () => {
    authApi.login.mockRejectedValue(apiError('Email atau password salah', undefined, 401));
    const { wrapper } = await mountWithApp(AdminLoginPage, { route: '/admin/login' });
    await fillAndSubmit(wrapper);
    expect(wrapper.find('[role="alert"]').text()).toBe('Email atau password salah');
  });
});
