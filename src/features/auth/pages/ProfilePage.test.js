import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { apiError, mountWithApp } from '@/test-utils';
import { useToastStore } from '@/features/common/states/toastStore';

vi.mock('@/features/auth/api/authApi', () => ({
  login: vi.fn(),
  register: vi.fn(),
  fetchMe: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
}));

import * as authApi from '@/features/auth/api/authApi';
import ProfilePage from './ProfilePage.vue';

const AUTH = { token: 't', user: { id: 1, name: 'Budi Santoso', email: 'budi@test.com', role: 'customer' } };

const render = () => mountWithApp(ProfilePage, { route: '/profil', auth: AUTH });
const forms = (wrapper) => wrapper.findAll('form');

describe('ProfilePage', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('menampilkan data akun saat ini; email tidak bisa diubah', async () => {
    const { wrapper } = await render();
    expect(wrapper.text()).toContain('budi@test.com');
    expect(wrapper.find('#profile-name').element.value).toBe('Budi Santoso');
    expect(wrapper.find('#profile-email').attributes('disabled')).toBeDefined();
  });

  it('nama terlalu pendek ditolak tanpa memanggil API', async () => {
    const { wrapper } = await render();
    await wrapper.find('#profile-name').setValue('B');
    await forms(wrapper)[0].trigger('submit');
    expect(wrapper.text()).toContain('Nama minimal 2 karakter');
    expect(authApi.updateProfile).not.toHaveBeenCalled();
  });

  it('simpan profil memperbarui nama dan menampilkan notifikasi', async () => {
    authApi.updateProfile.mockResolvedValue({ ...AUTH.user, name: 'Budi Baru' });
    const { wrapper, pinia } = await render();
    await wrapper.find('#profile-name').setValue('  Budi Baru ');
    await forms(wrapper)[0].trigger('submit');
    await flushPromises();
    expect(authApi.updateProfile).toHaveBeenCalledWith({ name: 'Budi Baru' });
    expect(useToastStore(pinia).items[0].message).toBe('Profil diperbarui');
    expect(wrapper.text()).toContain('Budi Baru');
  });

  it('simpan profil gagal menampilkan pesan', async () => {
    authApi.updateProfile.mockRejectedValue(apiError('Data tidak valid', { name: 'Nama tidak valid' }));
    const { wrapper } = await render();
    await forms(wrapper)[0].trigger('submit');
    await flushPromises();
    expect(wrapper.text()).toContain('Data tidak valid');
    expect(wrapper.text()).toContain('Nama tidak valid');
  });

  it('ganti password: validasi sisi klien', async () => {
    const { wrapper } = await render();
    await wrapper.find('#new-password').setValue('pendek');
    await wrapper.find('#confirm-password').setValue('beda');
    await forms(wrapper)[1].trigger('submit');
    expect(wrapper.text()).toContain('Password saat ini wajib diisi');
    expect(wrapper.text()).toContain('Password baru minimal 8 karakter');
    expect(wrapper.text()).toContain('Konfirmasi password tidak sama');
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  it('ganti password sukses mengosongkan form dan menampilkan notifikasi', async () => {
    authApi.changePassword.mockResolvedValue({});
    const { wrapper, pinia } = await render();
    await wrapper.find('#current-password').setValue('lama12345');
    await wrapper.find('#new-password').setValue('baru12345');
    await wrapper.find('#confirm-password').setValue('baru12345');
    await forms(wrapper)[1].trigger('submit');
    await flushPromises();
    expect(authApi.changePassword).toHaveBeenCalledWith({ current_password: 'lama12345', new_password: 'baru12345' });
    expect(wrapper.find('#current-password').element.value).toBe('');
    expect(useToastStore(pinia).items[0].message).toBe('Password berhasil diganti');
  });

  it('password saat ini salah menampilkan error pada field', async () => {
    authApi.changePassword.mockRejectedValue(
      apiError('Password saat ini salah', { current_password: 'Password saat ini salah' }),
    );
    const { wrapper } = await render();
    await wrapper.find('#current-password').setValue('salahsalah');
    await wrapper.find('#new-password').setValue('baru12345');
    await wrapper.find('#confirm-password').setValue('baru12345');
    await forms(wrapper)[1].trigger('submit');
    await flushPromises();
    expect(wrapper.findAll('[role="alert"]').map((a) => a.text())).toContain('Password saat ini salah');
  });
});
