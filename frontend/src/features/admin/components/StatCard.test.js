import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import StatCard from './StatCard.vue';

describe('StatCard', () => {
  it('menampilkan label, nilai, dan petunjuk', () => {
    const wrapper = mount(StatCard, { props: { label: 'Pendapatan', value: 'Rp1.000', hint: '7 hari', tone: 'pine' } });
    expect(wrapper.text()).toContain('Pendapatan');
    expect(wrapper.text()).toContain('Rp1.000');
    expect(wrapper.text()).toContain('7 hari');
    expect(wrapper.find('span').classes()).toContain('bg-pine-100');
  });

  it('tanpa hint tidak menampilkan teks tambahan', () => {
    expect(mount(StatCard, { props: { label: 'A', value: 1 } }).findAll('p')).toHaveLength(2);
  });
});
