import { describe, expect, it } from 'vitest';
import { mountWithApp } from '@/test/helpers';
import AuthShell from './AuthShell.vue';

const render = (props) => mountWithApp(AuthShell, { props: { title: 'Masuk', lead: 'Keterangan', ...props } });

describe('AuthShell', () => {
  it('menampilkan judul, lead, isi, dan footer', async () => {
    const { wrapper } = await mountWithApp(AuthShell, { props: { title: 'Masuk', lead: 'Keterangan' } });
    expect(wrapper.find('h1').text()).toBe('Masuk');
    expect(wrapper.text()).toContain('Keterangan');
    expect(wrapper.text()).toContain('Menyeberang Danau Toba tanpa antre');
    expect(wrapper.text()).not.toContain('Khusus petugas');
  });

  it('varian admin memakai teks dan lencana petugas', async () => {
    const { wrapper } = await render({ admin: true });
    expect(wrapper.text()).toContain('Khusus petugas');
    expect(wrapper.text()).toContain('Pantau jadwal');
  });
});
