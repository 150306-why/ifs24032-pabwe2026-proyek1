import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseInput from './BaseInput.vue';

const render = (props = {}, attrs = {}) => mount(BaseInput, { props: { id: 'email', label: 'Email', ...props }, attrs });

describe('BaseInput', () => {
  it('menghubungkan label dengan input lewat id dan memakai tipe text bawaan', () => {
    const wrapper = render();
    expect(wrapper.find('label').attributes('for')).toBe('email');
    expect(wrapper.find('label').text()).toBe('Email');
    expect(wrapper.find('input').attributes('id')).toBe('email');
    expect(wrapper.find('input').attributes('type')).toBe('text');
  });

  it('tipe dan atribut tambahan diteruskan ke input', () => {
    const wrapper = render({ type: 'password' }, { placeholder: 'rahasia', maxlength: '8' });
    const input = wrapper.find('input');
    expect(input.attributes('type')).toBe('password');
    expect(input.attributes('placeholder')).toBe('rahasia');
    expect(input.attributes('maxlength')).toBe('8');
  });

  it('v-model: menampilkan nilai dan mengirim update:modelValue', async () => {
    const wrapper = render({ modelValue: 'awal' });
    expect(wrapper.find('input').element.value).toBe('awal');
    await wrapper.find('input').setValue('baru');
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['baru']);
  });

  it('error ditampilkan sebagai alert dan ditandai aksesibel', () => {
    const wrapper = render({ error: 'Email tidak valid' });
    const input = wrapper.find('input');
    expect(wrapper.find('[role="alert"]').text()).toBe('Email tidak valid');
    expect(wrapper.find('[role="alert"]').attributes('id')).toBe('email-error');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-describedby')).toBe('email-error');
  });

  it('tanpa error tidak ada alert dan aria-describedby', () => {
    const wrapper = render();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.find('input').attributes('aria-describedby')).toBeUndefined();
    expect(wrapper.find('input').attributes('aria-invalid')).not.toBe('true');
  });
});
