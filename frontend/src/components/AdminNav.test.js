import { describe, expect, it } from 'vitest';
import { mountWithApp } from '@/test/helpers';
import AdminNav from './AdminNav.vue';

describe('AdminNav', () => {
  it('menampilkan semua tab admin dengan tautan yang benar', async () => {
    const { wrapper } = await mountWithApp(AdminNav);
    const links = wrapper.findAll('a').map((a) => [a.text(), a.attributes('href')]);
    expect(links).toEqual([
      ['Jadwal', '/admin/schedules'],
      ['Rute', '/admin/routes'],
      ['Kapal', '/admin/boats'],
      ['Pelabuhan', '/admin/ports'],
      ['Check-in', '/admin/checkin'],
    ]);
    expect(wrapper.find('nav').attributes('aria-label')).toBe('Menu admin');
  });
});
