import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { apiError, findByText, mountWithApp } from '@/test-utils';
import { useToastStore } from '@/features/common/states/toastStore';

vi.mock('@/features/admin/api/adminApi', () => ({ fetchAdminBookings: vi.fn(), resourceApi: vi.fn(() => ({})) }));
vi.mock('@/features/bookings/api/bookingApi', () => ({ cancelBooking: vi.fn() }));

import { fetchAdminBookings } from '@/features/admin/api/adminApi';
import { cancelBooking } from '@/features/bookings/api/bookingApi';
import AdminBookingsPage from './AdminBookingsPage.vue';

const item = (code, status) => ({
  code,
  status,
  total: 32000,
  created_at: '2030-01-01T00:00:00.000Z',
  passenger_count: 2,
  customer: { name: 'Budi', email: 'budi@test.com' },
  schedule: {
    departure_at: '2030-01-02T01:00:00.000Z', origin: 'Ajibata', destination: 'Tomok', boat_name: 'KMP',
  },
});
const PAGE = (items, total = items.length) => ({ items, pagination: { page: 1, limit: 10, total } });

const render = async () => {
  const app = await mountWithApp(AdminBookingsPage, { route: '/admin/bookings' });
  await flushPromises();
  return app;
};

describe('AdminBookingsPage', () => {
  let confirm;
  beforeEach(() => {
    vi.resetAllMocks();
    fetchAdminBookings.mockResolvedValue(PAGE([item('TT-1', 'paid'), item('TT-2', 'cancelled')]));
    confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
  });
  afterEach(() => { confirm.mockRestore(); });

  it('memuat booking halaman pertama dengan limit 10', async () => {
    const { wrapper } = await render();
    expect(fetchAdminBookings).toHaveBeenCalledWith({
      status: undefined, q: undefined, page: 1, limit: 10,
    });
    expect(wrapper.findAll('tbody tr')).toHaveLength(2);
    expect(wrapper.text()).toContain('budi@test.com');
    expect(wrapper.text()).toContain('Ajibata → Tomok');
  });

  it('filter status memuat ulang dari halaman 1', async () => {
    const { wrapper } = await render();
    await findByText(wrapper, 'button', 'Lunas').trigger('click');
    await flushPromises();
    expect(fetchAdminBookings).toHaveBeenLastCalledWith({
      status: 'paid', q: undefined, page: 1, limit: 10,
    });
  });

  it('pencarian mengirim kata kunci yang dirapikan', async () => {
    const { wrapper } = await render();
    await wrapper.find('input[type="search"]').setValue('  budi ');
    await wrapper.find('form[role="search"]').trigger('submit');
    await flushPromises();
    expect(fetchAdminBookings).toHaveBeenLastCalledWith({
      status: undefined, q: 'budi', page: 1, limit: 10,
    });
  });

  it('paginasi berpindah ke halaman berikutnya', async () => {
    fetchAdminBookings.mockResolvedValue(PAGE([item('TT-1', 'paid')], 25));
    const { wrapper } = await render();
    await findByText(wrapper, 'button', 'Berikutnya').trigger('click');
    await flushPromises();
    expect(fetchAdminBookings).toHaveBeenLastCalledWith({
      status: undefined, q: undefined, page: 2, limit: 10,
    });
  });

  it('batalkan: hanya untuk booking yang belum dibatalkan, memanggil API dan memuat ulang', async () => {
    cancelBooking.mockResolvedValue({});
    const { wrapper, pinia } = await render();
    const buttons = wrapper.findAll('tbody button').filter((b) => b.text().includes('Batalkan'));
    expect(buttons).toHaveLength(1); // TT-2 sudah dibatalkan
    await buttons[0].trigger('click');
    await flushPromises();
    expect(cancelBooking).toHaveBeenCalledWith('TT-1');
    expect(fetchAdminBookings).toHaveBeenCalledTimes(2);
    expect(useToastStore(pinia).items[0].message).toContain('TT-1');
  });

  it('batalkan ditolak di konfirmasi tidak memanggil API', async () => {
    confirm.mockReturnValue(false);
    const { wrapper } = await render();
    await wrapper.findAll('tbody button').find((b) => b.text().includes('Batalkan')).trigger('click');
    expect(cancelBooking).not.toHaveBeenCalled();
  });

  it('batalkan gagal menampilkan pesan error', async () => {
    cancelBooking.mockRejectedValue(apiError('Jadwal sudah berangkat', undefined, 409));
    const { wrapper } = await render();
    await wrapper.findAll('tbody button').find((b) => b.text().includes('Batalkan')).trigger('click');
    await flushPromises();
    expect(wrapper.find('[role="alert"]').text()).toBe('Jadwal sudah berangkat');
  });

  it('tanpa hasil menampilkan teks kosong', async () => {
    fetchAdminBookings.mockResolvedValue(PAGE([]));
    const { wrapper } = await render();
    expect(wrapper.text()).toContain('Tidak ada booking yang cocok');
  });
});
