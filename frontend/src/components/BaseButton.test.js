import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseButton from './BaseButton.vue';

describe('BaseButton', () => {
  it('menampilkan slot dengan tipe button dan varian primary secara bawaan', () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Simpan' } });
    expect(wrapper.text()).toBe('Simpan');
    expect(wrapper.attributes('type')).toBe('button');
    expect(wrapper.classes()).toContain('bg-lake-700');
  });

  it.each([
    ['secondary', 'border-lake-700'],
    ['danger', 'bg-red-700'],
    ['primary', 'bg-lake-700'],
  ])('varian %s', (variant, cls) => {
    expect(mount(BaseButton, { props: { variant } }).classes()).toContain(cls);
  });

  it('type submit dapat diatur', () => {
    expect(mount(BaseButton, { props: { type: 'submit' } }).attributes('type')).toBe('submit');
  });

  it('loading menonaktifkan tombol, menandai aria-busy, dan menambah teks untuk pembaca layar', () => {
    const wrapper = mount(BaseButton, { props: { loading: true }, slots: { default: 'Kirim' } });
    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.attributes('aria-busy')).toBe('true');
    expect(wrapper.text()).toContain('Memproses');
  });

  it('disabled menonaktifkan tombol', () => {
    expect(mount(BaseButton, { props: { disabled: true } }).attributes('disabled')).toBeDefined();
  });

  it('klik diteruskan ke handler induk saat aktif, tidak saat disabled', async () => {
    const onClick = vi.fn();
    await mount(BaseButton, { attrs: { onClick } }).trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);

    const blocked = vi.fn();
    await mount(BaseButton, { props: { disabled: true }, attrs: { onClick: blocked } }).trigger('click');
    expect(blocked).not.toHaveBeenCalled();
  });
});
