import { describe, expect, it } from 'vitest';
import { mountWithApp } from '@/test/helpers';
import AppFooter from './AppFooter.vue';

describe('AppFooter', () => {
  it('menampilkan catatan data contoh dan tautan penting termasuk masuk petugas', async () => {
    const { wrapper } = await mountWithApp(AppFooter);
    expect(wrapper.text()).toContain('Data jadwal dan harga hanyalah contoh');
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/jadwal', '/verifikasi', '/tiket-saya', '/admin/login']));
  });
});
