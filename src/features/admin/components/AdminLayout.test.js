import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { mountWithApp } from '@/test/helpers';
import { useAuthStore } from '@/features/auth/states/authStore';
import AdminLayout from './AdminLayout.vue';

const AUTH = { token: 't', user: { id: 1, name: 'Admin Toba Tix', email: 'admin@tobatix.test', role: 'admin' } };

describe('AdminLayout', () => {
  it('menampilkan menu admin, identitas admin, dan isi halaman', async () => {
    const { wrapper } = await mountWithApp(AdminLayout, { auth: AUTH });
    expect(wrapper.find('nav[aria-label="Menu admin"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Admin Toba Tix');
    expect(wrapper.text()).toContain('admin@tobatix.test');
  });

  it('slot dirender di area konten', async () => {
    const { pinia, router } = await mountWithApp(AdminLayout, { auth: AUTH });
    const wrapper = mount(AdminLayout, { slots: { default: '<p>Isi halaman</p>' }, global: { plugins: [pinia, router] } });
    expect(wrapper.text()).toContain('Isi halaman');
  });

  it('Keluar menghapus sesi dan menuju login admin', async () => {
    const { wrapper, router, pinia } = await mountWithApp(AdminLayout, { auth: AUTH, route: '/admin' });
    await wrapper.findAll('button').find((b) => b.text().includes('Keluar')).trigger('click');
    await flushPromises();
    expect(useAuthStore(pinia).isAuthenticated).toBe(false);
    expect(router.currentRoute.value.name).toBe('admin-login');
  });

  it('tautan Situs menuju beranda publik', async () => {
    const { wrapper } = await mountWithApp(AdminLayout, { auth: AUTH });
    expect(wrapper.findAll('a').find((a) => a.text().includes('Situs')).attributes('href')).toBe('/');
  });
});
