import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AsyncState from './AsyncState.vue';

const render = (props = {}) => mount(AsyncState, { props, slots: { default: '<p>ISI</p>' } });

describe('AsyncState', () => {
  it('menampilkan konten bila tidak loading, error, atau kosong', () => {
    const wrapper = render();
    expect(wrapper.text()).toBe('ISI');
  });

  it('loading menampilkan indikator dan menyembunyikan konten', () => {
    const wrapper = render({ loading: true });
    expect(wrapper.element.tagName).toBe('OUTPUT');
    expect(wrapper.text()).toContain('Memuat');
    expect(wrapper.text()).not.toContain('ISI');
  });

  it('error menampilkan pesan dan tombol coba lagi yang mengirim event retry', async () => {
    const wrapper = render({ error: 'Gagal memuat data' });
    expect(wrapper.attributes('role')).toBe('alert');
    expect(wrapper.text()).toContain('Gagal memuat data');
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
  });

  it('kosong menampilkan teks bawaan atau kustom', () => {
    expect(render({ empty: true }).text()).toBe('Tidak ada data.');
    expect(render({ empty: true, emptyText: 'Belum ada pesanan' }).text()).toBe('Belum ada pesanan');
  });

  it('prioritas: loading > error > empty', () => {
    const wrapper = render({ loading: true, error: 'x', empty: true });
    expect(wrapper.text()).toContain('Memuat');
    expect(render({ error: 'x', empty: true }).text()).toContain('x');
  });
});
