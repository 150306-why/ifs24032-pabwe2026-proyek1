import { describe, expect, it } from 'vitest';
import { mountWithApp } from '@/test-utils';
import NotFoundPage from './NotFoundPage.vue';

describe('NotFoundPage', () => {
  it('menampilkan pesan dan tautan kembali ke beranda', async () => {
    const { wrapper } = await mountWithApp(NotFoundPage);
    expect(wrapper.find('h1').text()).toBe('Halaman tidak ditemukan');
    expect(wrapper.find('a').attributes('href')).toBe('/');
  });
});
