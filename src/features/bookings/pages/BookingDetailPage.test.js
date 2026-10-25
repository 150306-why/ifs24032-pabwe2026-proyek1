import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import {
  apiError, findByText, mountWithApp, SAMPLE_BOOKING, squash,
} from '@/test/helpers';

vi.mock('@/features/bookings/api/bookingApi', () => ({
  createBooking: vi.fn(),
  fetchBookings: vi.fn(),
  fetchBooking: vi.fn(),
  payBooking: vi.fn(),
  cancelBooking: vi.fn(),
}));
vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,AAAA') },
}));

import { cancelBooking, fetchBooking } from '@/features/bookings/api/bookingApi';
import BookingDetailPage from './BookingDetailPage.vue';

const PAID = { ...SAMPLE_BOOKING, status: 'paid' };

async function render(booking) {
  fetchBooking.mockResolvedValue(booking);
  const app = await mountWithApp(BookingDetailPage, { route: '/booking/TT-ABC123' });
  await flushPromises();
  return app;
}

describe('BookingDetailPage', () => {
  let confirm;
  beforeEach(() => {
    vi.clearAllMocks();
    confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
  });
  afterEach(() => { confirm.mockRestore(); });

  it('booking lunas menampilkan ringkasan, QR, dan data tiap penumpang', async () => {
    const { wrapper } = await render(PAID);
    expect(fetchBooking).toHaveBeenCalledWith('TT-ABC123');
    const text = wrapper.text();
    expect(text).toContain('Ajibata → Tomok');
    expect(text).toContain('Lunas');
    expect(text).toContain('Kode booking TT-ABC123');
    expect(squash(text)).toContain('Rp32.000');
    expect(text).toContain('Budi');
    expect(text).toContain('TK-AAA');
    expect(wrapper.findAll('img')).toHaveLength(2);
    expect(wrapper.find('img').attributes('alt')).toBe('Kode QR tiket TK-AAA');
  });

  it('menandai tiket yang sudah check-in', async () => {
    const { wrapper } = await render(PAID);
    expect(wrapper.text().match(/Sudah check-in/g)).toHaveLength(1);
  });

  it('booking pending: tombol lanjut bayar dan QR belum tersedia', async () => {
    const { wrapper } = await render({ ...SAMPLE_BOOKING, status: 'pending' });
    expect(findByText(wrapper, 'a', 'Lanjut bayar').attributes('href')).toBe('/booking/TT-ABC123/bayar');
    expect(wrapper.text()).toContain('Kode QR tiket tersedia setelah pembayaran berhasil.');
    expect(wrapper.find('img').exists()).toBe(false);
  });

  it('booking dibatalkan: tidak ada tombol batalkan maupun bayar', async () => {
    const { wrapper } = await render({ ...SAMPLE_BOOKING, status: 'cancelled' });
    expect(findByText(wrapper, 'button', 'Batalkan')).toBeUndefined();
    expect(findByText(wrapper, 'a', 'Lanjut bayar')).toBeUndefined();
    expect(wrapper.text()).toContain('Dibatalkan');
  });

  it('batalkan: konfirmasi diterima -> API dipanggil dan status berubah', async () => {
    cancelBooking.mockResolvedValue({ ...PAID, status: 'cancelled' });
    const { wrapper } = await render(PAID);
    await findByText(wrapper, 'button', 'Batalkan').trigger('click');
    await flushPromises();
    expect(confirm).toHaveBeenCalled();
    expect(cancelBooking).toHaveBeenCalledWith('TT-ABC123');
    expect(wrapper.text()).toContain('Dibatalkan');
    expect(findByText(wrapper, 'button', 'Batalkan')).toBeUndefined();
  });

  it('batalkan: konfirmasi ditolak -> API tidak dipanggil', async () => {
    confirm.mockReturnValue(false);
    const { wrapper } = await render(PAID);
    await findByText(wrapper, 'button', 'Batalkan').trigger('click');
    await flushPromises();
    expect(cancelBooking).not.toHaveBeenCalled();
  });

  it('batalkan gagal menampilkan pesan error', async () => {
    cancelBooking.mockRejectedValue(apiError('Jadwal sudah berangkat', undefined, 409));
    const { wrapper } = await render(PAID);
    await findByText(wrapper, 'button', 'Batalkan').trigger('click');
    await flushPromises();
    expect(wrapper.find('[role="alert"]').text()).toBe('Jadwal sudah berangkat');
  });

  it('gagal memuat booking menampilkan error', async () => {
    fetchBooking.mockRejectedValue(apiError('Booking tidak ditemukan', undefined, 404));
    const { wrapper } = await mountWithApp(BookingDetailPage, { route: '/booking/TT-ABC123' });
    await flushPromises();
    expect(wrapper.text()).toContain('Booking tidak ditemukan');
  });
});
