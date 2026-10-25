import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { findByText, mountWithApp } from '@/test-utils';
import { useAuthStore } from '@/features/auth/states/authStore';
import AppHeader from './AppHeader.vue';

const customer = { token: 't', user: { id: 1, name: 'Budi', role: 'customer' } };
const admin = { token: 't', user: { id: 2, name: 'Admin', role: 'admin' } };

describe('AppHeader', () => {
  it('tamu melihat Masuk dan Daftar, bukan menu pengguna', async () => {
    const { wrapper } = await mountWithApp(AppHeader);
    const text = wrapper.text();
    expect(text).toContain('Toba Tix');
    expect(text).toContain('Jadwal');
    expect(text).toContain('Masuk');
    expect(text).toContain('Daftar');
    expect(text).not.toContain('Tiket saya');
    expect(text).not.toContain('Keluar');
  });

  it('customer melihat Tiket saya, nama, dan Keluar, tanpa menu Admin', async () => {
    const { wrapper } = await mountWithApp(AppHeader, { auth: customer });
    const text = wrapper.text();
    expect(text).toContain('Tiket saya');
    expect(text).toContain('Profil');
    expect(text).toContain('Cek tiket');
    expect(text).toContain('Budi');
    expect(text).toContain('Keluar');
    expect(text).not.toContain('Masuk');
    expect(findByText(wrapper, 'a', 'Admin')).toBeUndefined();
  });

  it('admin melihat menu Admin dan tidak melihat menu pelanggan', async () => {
    const { wrapper } = await mountWithApp(AppHeader, { auth: admin });
    expect(findByText(wrapper, 'a', 'Admin').attributes('href')).toBe('/admin');
    expect(wrapper.text()).not.toContain('Tiket saya');
  });

  it('tombol menu membuka dan menutup navigasi di layar kecil', async () => {
    const { wrapper } = await mountWithApp(AppHeader);
    const toggle = wrapper.find('button[aria-controls="menu-utama"]');
    expect(toggle.attributes('aria-expanded')).toBe('false');
    await toggle.trigger('click');
    expect(toggle.attributes('aria-expanded')).toBe('true');
    expect(wrapper.find('#menu-utama').classes()).toContain('flex');
    await wrapper.find('#menu-utama').trigger('click');
    expect(toggle.attributes('aria-expanded')).toBe('false');
  });

  it('Keluar menghapus sesi dan kembali ke beranda', async () => {
    const { wrapper, router, pinia } = await mountWithApp(AppHeader, { auth: customer, route: '/jadwal' });
    await findByText(wrapper, 'button', 'Keluar').trigger('click');
    await flushPromises();
    expect(useAuthStore(pinia).isAuthenticated).toBe(false);
    expect(router.currentRoute.value.name).toBe('home');
    expect(wrapper.text()).toContain('Masuk');
  });
});
