import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { findByText, mountWithApp } from '@/test/helpers';
import { useAuthStore } from '@/stores/auth';
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
    expect(text).toContain('Budi');
    expect(text).toContain('Keluar');
    expect(text).not.toContain('Masuk');
    expect(findByText(wrapper, 'a', 'Admin')).toBeUndefined();
  });

  it('admin melihat menu Admin', async () => {
    const { wrapper } = await mountWithApp(AppHeader, { auth: admin });
    expect(findByText(wrapper, 'a', 'Admin').attributes('href')).toBe('/admin');
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
