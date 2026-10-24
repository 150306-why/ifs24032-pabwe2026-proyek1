import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import StatusBadge from './StatusBadge.vue';

describe('StatusBadge', () => {
  it.each([
    ['pending', 'Menunggu pembayaran', 'bg-amber-100'],
    ['paid', 'Lunas', 'bg-pine-100'],
    ['cancelled', 'Dibatalkan', 'bg-slate-200'],
  ])('menampilkan label dan warna untuk %s', (status, label, cls) => {
    const wrapper = mount(StatusBadge, { props: { status } });
    expect(wrapper.text()).toBe(label);
    expect(wrapper.classes()).toContain(cls);
  });

  it('status tak dikenal tampil apa adanya dengan gaya netral', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'refunded' } });
    expect(wrapper.text()).toBe('refunded');
    expect(wrapper.classes()).toContain('bg-slate-100');
  });
});
