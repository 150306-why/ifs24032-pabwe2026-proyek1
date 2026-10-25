import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import {
  apiError, findByText, mountWithApp, SAMPLE_BOOKING, squash,
} from '@/test-utils';

vi.mock('@/features/bookings/api/bookingApi', () => ({
  createBooking: vi.fn(),
  fetchBookings: vi.fn(),
  fetchBooking: vi.fn(),
  payBooking: vi.fn(),
  cancelBooking: vi.fn(),
}));

import { fetchBooking, payBooking } from '@/features/bookings/api/bookingApi';
import PaymentPage from './PaymentPage.vue';

const inMs = (ms) => new Date(Date.now() + ms).toISOString();
const pending = (ms = 10 * 60 * 1000) => ({ ...SAMPLE_BOOKING, status: 'pending', expires_at: inMs(ms) });

let mounted;
async function render(booking) {
  if (booking) fetchBooking.mockResolvedValue(booking);
  const app = await mountWithApp(PaymentPage, { route: '/booking/TT-ABC123/bayar' });
  await flushPromises();
  mounted = app.wrapper;
  return app;
}

describe('PaymentPage', () => {
  beforeEach(() => { vi.resetAllMocks(); });
  afterEach(() => { mounted?.unmount(); mounted = undefined; });

  it('booking pending menampilkan rincian, hitung mundur, dan tombol bayar', async () => {
    const { wrapper } = await render(pending());
    expect(fetchBooking).toHaveBeenCalledWith('TT-ABC123');
    const text = wrapper.text();
    expect(text).toContain('TT-ABC123');
    expect(text).toContain('Ajibata → Tomok');
    expect(squash(text)).toContain('Rp32.000');
    expect(text).toContain('Menunggu pembayaran');
    expect(text).toMatch(/Selesaikan dalam\s+\d{2}:\d{2}/);
    expect(findByText(wrapper, 'button', 'Bayar sekarang (simulasi)')).toBeDefined();
  });

  it('bayar sukses mengarahkan ke detail booking', async () => {
    payBooking.mockResolvedValue({ ...SAMPLE_BOOKING, status: 'paid' });
    const { wrapper, router } = await render(pending());
    await findByText(wrapper, 'button', 'Bayar sekarang (simulasi)').trigger('click');
    await flushPromises();
    expect(payBooking).toHaveBeenCalledWith('TT-ABC123');
    expect(router.currentRoute.value.name).toBe('booking-detail');
    expect(router.currentRoute.value.params.code).toBe('TT-ABC123');
  });

  it('bayar gagal menampilkan pesan error', async () => {
    payBooking.mockRejectedValue(apiError('Booking tidak dalam status menunggu pembayaran', undefined, 409));
    const { wrapper, router } = await render(pending());
    await findByText(wrapper, 'button', 'Bayar sekarang (simulasi)').trigger('click');
    await flushPromises();
    expect(wrapper.find('p[role="alert"]').text()).toBe('Booking tidak dalam status menunggu pembayaran');
    expect(router.currentRoute.value.name).toBe('payment');
  });

  it('booking yang sudah lunas langsung dialihkan ke detail', async () => {
    const { router } = await render({ ...SAMPLE_BOOKING, status: 'paid' });
    expect(router.currentRoute.value.name).toBe('booking-detail');
  });

  it('booking dibatalkan menampilkan pesan dan tautan cari jadwal', async () => {
    const { wrapper } = await render({ ...SAMPLE_BOOKING, status: 'cancelled', expires_at: null });
    expect(wrapper.text()).toContain('Booking ini dibatalkan atau sudah kadaluarsa.');
    expect(findByText(wrapper, 'a', 'Cari jadwal lain').attributes('href')).toBe('/jadwal');
    expect(findByText(wrapper, 'button', 'Bayar sekarang (simulasi)')).toBeUndefined();
  });

  it('saat waktu habis, status dimuat ulang dari server', async () => {
    fetchBooking
      .mockResolvedValueOnce(pending(-1000))
      .mockResolvedValue({ ...SAMPLE_BOOKING, status: 'cancelled', expires_at: null });
    const { wrapper } = await render();
    expect(fetchBooking).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('Booking ini dibatalkan atau sudah kadaluarsa.');
  });

  it('gagal memuat booking menampilkan error', async () => {
    fetchBooking.mockRejectedValue(apiError('Booking tidak ditemukan', undefined, 404));
    const { wrapper } = await render();
    expect(wrapper.text()).toContain('Booking tidak ditemukan');
  });
});
