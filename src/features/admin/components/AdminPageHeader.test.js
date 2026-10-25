import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AdminPageHeader from './AdminPageHeader.vue';

describe('AdminPageHeader', () => {
  it('menampilkan judul, keterangan, dan slot aksi', () => {
    const wrapper = mount(AdminPageHeader, {
      props: { title: 'Booking', lead: 'Semua pesanan' },
      slots: { actions: '<button>Aksi</button>' },
    });
    expect(wrapper.find('h1').text()).toBe('Booking');
    expect(wrapper.text()).toContain('Semua pesanan');
    expect(wrapper.find('button').text()).toBe('Aksi');
  });

  it('tanpa lead tidak menampilkan paragraf', () => {
    expect(mount(AdminPageHeader, { props: { title: 'X' } }).find('p').exists()).toBe(false);
  });
});
