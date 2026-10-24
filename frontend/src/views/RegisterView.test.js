import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { apiError, mountWithApp } from '@/test/helpers';
import { useAuthStore } from '@/stores/auth';

vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  fetchMe: vi.fn(),
}));

import * as authApi from '@/api/auth';
import RegisterView from './RegisterView.vue';

async function fill(wrapper, { name = 'Budi Santoso', email = 'budi@test.com', password = 'password123', confirm = 'password123' } = {}) {
  await wrapper.find('#name').setValue(name);
  await wrapper.find('#email').setValue(email);
  await wrapper.find('#password').setValue(password);
  await wrapper.find('#confirm').setValue(confirm);
  await wrapper.find('form').trigger('submit');
  await flushPromises();
}

describe('RegisterView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authApi.register.mockResolvedValue({ token: 'tok', user: { id: 2, name: 'Budi Santoso', role: 'customer' } });
  });

  it('validasi sisi klien untuk semua field', async () => {
    const { wrapper } = await mountWithApp(RegisterView, { route: '/daftar' });
    await fill(wrapper, { name: 'B', email: 'salah', password: '1234', confirm: '9999' });
    const text = wrapper.text();
    expect(text).toContain('Nama minimal 2 karakter');
    expect(text).toContain('Email tidak valid');
    expect(text).toContain('Password minimal 8 karakter');
    expect(text).toContain('Konfirmasi password tidak sama');
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('konfirmasi password harus sama', async () => {
    const { wrapper } = await mountWithApp(RegisterView, { route: '/daftar' });
    await fill(wrapper, { confirm: 'password999' });
    expect(wrapper.text()).toContain('Konfirmasi password tidak sama');
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('registrasi sukses mengirim data bersih, menyimpan sesi, dan menuju beranda', async () => {
    const { wrapper, router, pinia } = await mountWithApp(RegisterView, { route: '/daftar' });
    await fill(wrapper, { name: '  Budi Santoso ' });
    expect(authApi.register).toHaveBeenCalledWith({
      name: 'Budi Santoso', email: 'budi@test.com', password: 'password123',
    });
    expect(useAuthStore(pinia).isAuthenticated).toBe(true);
    expect(router.currentRoute.value.fullPath).toBe('/');
  });

  it('registrasi gagal menampilkan pesan server dan error field', async () => {
    authApi.register.mockRejectedValue(apiError('Email sudah terdaftar', { email: 'Email sudah dipakai' }, 409));
    const { wrapper, router } = await mountWithApp(RegisterView, { route: '/daftar' });
    await fill(wrapper);
    expect(wrapper.text()).toContain('Email sudah terdaftar');
    expect(wrapper.text()).toContain('Email sudah dipakai');
    expect(router.currentRoute.value.name).toBe('register');
  });

  it('menyediakan tautan ke halaman masuk', async () => {
    const { wrapper } = await mountWithApp(RegisterView, { route: '/daftar' });
    expect(wrapper.find('a[href="/masuk"]').exists()).toBe(true);
  });
});
