import { describe, expect, it } from 'vitest';
import { mountWithApp } from '@/test/helpers';
import NotFoundView from './NotFoundView.vue';

describe('NotFoundView', () => {
  it('menampilkan pesan dan tautan kembali ke beranda', async () => {
    const { wrapper } = await mountWithApp(NotFoundView);
    expect(wrapper.find('h1').text()).toBe('Halaman tidak ditemukan');
    expect(wrapper.find('a').attributes('href')).toBe('/');
  });
});
