import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TonePill from './TonePill.vue';

describe('TonePill', () => {
  it.each([
    ['green', 'bg-pine-100'], ['amber', 'bg-gold-100'], ['red', 'bg-ulos-100'], ['blue', 'bg-lake-100'], ['gray', 'bg-slate-200'],
  ])('nada %s', (tone, cls) => {
    const wrapper = mount(TonePill, { props: { tone }, slots: { default: 'Teks' } });
    expect(wrapper.text()).toBe('Teks');
    expect(wrapper.classes()).toContain(cls);
  });

  it('nada tak dikenal memakai abu-abu', () => {
    expect(mount(TonePill, { props: { tone: 'ungu' } }).classes()).toContain('bg-slate-200');
  });
});
