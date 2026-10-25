import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { apiError, findByText, mountWithApp, SAMPLE_BOOKING, squash } from '@/test/helpers';

vi.mock('@/features/bookings/api/bookingApi', () => ({
  createBooking: vi.fn(),
  fetchBookings: vi.fn(),
  fetchBooking: vi.fn(),
  payBooking: vi.fn(),
  cancelBooking: vi.fn(),
}));

import { fetchBookings } from '@/features/bookings/api/bookingApi';
import MyBookingsPage from './MyBookingsPage.vue';

const PENDING = { ...SAMPLE_BOOKING, code: 'TT-PENDING', status: 'pending' };
const PAID = { ...SAMPLE_BOOKING, code: 'TT-PAID', status: 'paid', passenger_count: 1, total: 20000 };

async function render() {
  const app = await mountWithApp(MyBookingsPage, { route: '/tiket-saya' });
  await flushPromises();
  return app;
}

describe('MyBookingsPage', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('menampilkan daftar booking beserta status, rute, jumlah penumpang, dan total', async () => {
    fetchBookings.mockResolvedValue([PENDING, PAID]);
    const { wrapper } = await render();
    const text = wrapper.text();
    expect(text).toContain('TT-PENDING');
    expect(text).toContain('TT-PAID');
    expect(text).toContain('Ajibata → Tomok');
    expect(text).toContain('Menunggu pembayaran');
    expect(text).toContain('Lunas');
    expect(text).toContain('2 penumpang');
    expect(squash(text)).toContain('Rp32.000');
  });

  it('booking pending menuju halaman bayar, selain itu ke detail tiket', async () => {
    fetchBookings.mockResolvedValue([PENDING, PAID]);
    const { wrapper } = await render();
    expect(findByText(wrapper, 'a', 'Bayar').attributes('href')).toBe('/booking/TT-PENDING/bayar');
    expect(findByText(wrapper, 'a', 'Lihat tiket').attributes('href')).toBe('/booking/TT-PAID');
  });

  it('daftar kosong menampilkan teks bantuan', async () => {
    fetchBookings.mockResolvedValue([]);
    const { wrapper } = await render();
    expect(wrapper.text()).toContain('Belum ada pesanan');
  });

  it('gagal memuat menampilkan error dan bisa dicoba lagi', async () => {
    fetchBookings.mockRejectedValueOnce(apiError('Gagal memuat pesanan', undefined, 500));
    fetchBookings.mockResolvedValue([PAID]);
    const { wrapper } = await render();
    expect(wrapper.text()).toContain('Gagal memuat pesanan');

    await findByText(wrapper, 'button', 'Coba lagi').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('TT-PAID');
  });
});
