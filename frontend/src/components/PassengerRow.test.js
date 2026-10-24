import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PassengerRow from './PassengerRow.vue';

const render = (props = {}) => mount(PassengerRow, {
  props: { index: 0, name: '', category: 'dewasa', ...props },
});

describe('PassengerRow', () => {
  it('menampilkan nomor penumpang dan id field sesuai indeks', () => {
    const wrapper = render({ index: 2 });
    expect(wrapper.find('legend').text()).toBe('Penumpang 3');
    expect(wrapper.find('#passenger-name-2').exists()).toBe(true);
    expect(wrapper.find('#passenger-category-2').exists()).toBe(true);
  });

  it('menampilkan nilai nama dan kategori', () => {
    const wrapper = render({ name: 'Budi', category: 'anak' });
    expect(wrapper.find('input').element.value).toBe('Budi');
    expect(wrapper.find('select').element.value).toBe('anak');
  });

  it('mengirim update:name dan update:category', async () => {
    const wrapper = render();
    await wrapper.find('input').setValue('Siti');
    await wrapper.find('select').setValue('anak');
    expect(wrapper.emitted('update:name').at(-1)).toEqual(['Siti']);
    expect(wrapper.emitted('update:category').at(-1)).toEqual(['anak']);
  });

  it('tombol hapus hanya muncul bila canRemove dan mengirim event remove', async () => {
    expect(render().find('button').exists()).toBe(false);

    const wrapper = render({ canRemove: true, index: 1 });
    const button = wrapper.find('button');
    expect(button.attributes('aria-label')).toBe('Hapus penumpang 2');
    await button.trigger('click');
    expect(wrapper.emitted('remove')).toHaveLength(1);
  });
});
