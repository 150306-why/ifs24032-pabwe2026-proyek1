import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AppIcon from './AppIcon.vue';

describe('AppIcon', () => {
  it('menggambar path, lingkaran, dan persegi sesuai nama ikon, tersembunyi dari pembaca layar', () => {
    const calendar = mount(AppIcon, { props: { name: 'calendar', size: 32 } });
    expect(calendar.attributes('aria-hidden')).toBe('true');
    expect(calendar.attributes('width')).toBe('32');
    expect(calendar.find('rect').exists()).toBe(true);
    expect(calendar.find('path').exists()).toBe(true);
    expect(mount(AppIcon, { props: { name: 'search' } }).find('circle').exists()).toBe(true);
  });

  it('nama tidak dikenal memakai ikon peringatan', () => {
    const wrapper = mount(AppIcon, { props: { name: 'tidak-ada' } });
    expect(wrapper.find('circle').exists()).toBe(true);
    expect(wrapper.findAll('path')).toHaveLength(2);
  });
});
