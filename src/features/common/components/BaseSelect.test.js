import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseSelect from './BaseSelect.vue';

const options = [
  { value: 'dewasa', label: 'Dewasa' },
  { value: 'anak', label: 'Anak' },
];
const render = (props = {}) => mount(BaseSelect, { props: { id: 'kategori', label: 'Kategori', options, ...props } });

describe('BaseSelect', () => {
  it('menampilkan label, placeholder bawaan, dan semua opsi', () => {
    const wrapper = render();
    expect(wrapper.find('label').attributes('for')).toBe('kategori');
    const texts = wrapper.findAll('option').map((o) => o.text());
    expect(texts).toEqual(['Pilih…', 'Dewasa', 'Anak']);
    expect(wrapper.find('option').attributes('disabled')).toBeDefined();
  });

  it('placeholder dapat diganti', () => {
    expect(render({ placeholder: 'Pilih kategori' }).find('option').text()).toBe('Pilih kategori');
  });

  it('memilih opsi mengirim update:modelValue', async () => {
    const wrapper = render({ modelValue: '' });
    await wrapper.find('select').setValue('anak');
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['anak']);
  });

  it('menampilkan nilai terpilih dari modelValue', () => {
    expect(render({ modelValue: 'anak' }).find('select').element.value).toBe('anak');
  });

  it('error ditampilkan dan ditandai aksesibel', () => {
    const wrapper = render({ error: 'Wajib dipilih' });
    expect(wrapper.find('[role="alert"]').text()).toBe('Wajib dipilih');
    expect(wrapper.find('select').attributes('aria-invalid')).toBe('true');
    expect(wrapper.find('select').attributes('aria-describedby')).toBe('kategori-error');
  });

  it('tanpa error tidak ada alert', () => {
    const wrapper = render();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.find('select').attributes('aria-describedby')).toBeUndefined();
  });
});
