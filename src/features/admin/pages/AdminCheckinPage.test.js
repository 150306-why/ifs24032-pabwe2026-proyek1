import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { apiError, findByText, mountWithApp } from '@/test/helpers';

vi.mock('@/features/admin/api/adminApi', () => ({
  checkInTicket: vi.fn(),
  resourceApi: vi.fn(() => ({})),
}));

import { checkInTicket } from '@/features/admin/api/adminApi';
import AdminCheckinPage from './AdminCheckinPage.vue';

const RESULT = {
  passenger_name: 'B*** S******',
  category: 'dewasa',
  origin: 'Ajibata',
  destination: 'Tomok',
  departure_at: '2030-01-01T01:00:00.000Z',
};

async function submit(wrapper, code) {
  await wrapper.find('#ticket-code').setValue(code);
  await wrapper.find('form').trigger('submit');
  await flushPromises();
}

describe('AdminCheckinPage', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('menampilkan judul dan formulir check-in', async () => {
    const { wrapper } = await mountWithApp(AdminCheckinPage, { route: '/admin/checkin' });
    expect(wrapper.find('h1').text()).toBe('Check-in tiket');
    expect(wrapper.text()).toContain('Belum ada check-in');
    expect(findByText(wrapper, 'button', 'Check-in')).toBeDefined();
  });

  it('kode kosong ditolak tanpa memanggil API', async () => {
    const { wrapper } = await mountWithApp(AdminCheckinPage, { route: '/admin/checkin' });
    await submit(wrapper, '   ');
    expect(wrapper.find('[role="alert"]').text()).toBe('Masukkan atau scan kode tiket');
    expect(checkInTicket).not.toHaveBeenCalled();
  });

  it('check-in sukses: kode dirapikan, hasil tampil, kolom dikosongkan', async () => {
    checkInTicket.mockResolvedValue(RESULT);
    const { wrapper } = await mountWithApp(AdminCheckinPage, { route: '/admin/checkin' });
    await submit(wrapper, '  tk-abc123 ');
    expect(checkInTicket).toHaveBeenCalledWith('TK-ABC123');
    const status = wrapper.find('[role="status"]');
    expect(status.text()).toContain('Check-in berhasil');
    expect(status.text()).toContain('B*** S******');
    expect(status.text()).toContain('Ajibata → Tomok');
    expect(wrapper.find('#ticket-code').element.value).toBe('');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('check-in gagal menampilkan pesan server dan menyembunyikan hasil lama', async () => {
    checkInTicket.mockResolvedValueOnce(RESULT);
    checkInTicket.mockRejectedValueOnce(apiError('Tiket sudah check-in', undefined, 409));
    const { wrapper } = await mountWithApp(AdminCheckinPage, { route: '/admin/checkin' });
    await submit(wrapper, 'TK-1');
    expect(wrapper.find('[role="status"]').exists()).toBe(true);

    await submit(wrapper, 'TK-1');
    expect(wrapper.find('[role="alert"]').text()).toBe('Tiket sudah check-in');
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });
});
