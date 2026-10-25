import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import {
  apiError, findByText, mountWithApp, SAMPLE_SCHEDULE, squash,
} from '@/test-utils';

vi.mock('@/features/schedules/api/catalogApi', () => ({
  fetchPorts: vi.fn(),
  fetchSchedules: vi.fn(),
  fetchSchedule: vi.fn(),
}));
vi.mock('@/features/bookings/api/bookingApi', () => ({
  createBooking: vi.fn(),
  fetchBookings: vi.fn(),
  fetchBooking: vi.fn(),
  payBooking: vi.fn(),
  cancelBooking: vi.fn(),
}));

import { fetchSchedule } from '@/features/schedules/api/catalogApi';
import { createBooking } from '@/features/bookings/api/bookingApi';
import ScheduleDetailPage from './ScheduleDetailPage.vue';

const CUSTOMER = { token: 't', user: { id: 1, name: 'Budi', role: 'customer' } };

async function render({ schedule = SAMPLE_SCHEDULE, auth } = {}) {
  fetchSchedule.mockResolvedValue(schedule);
  const app = await mountWithApp(ScheduleDetailPage, { route: '/jadwal/5', auth });
  await flushPromises();
  return app;
}

const submit = async (wrapper) => {
  await wrapper.find('form').trigger('submit');
  await flushPromises();
};

describe('ScheduleDetailPage', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('memuat jadwal berdasarkan id di URL dan menampilkan ringkasannya', async () => {
    const { wrapper } = await render();
    expect(fetchSchedule).toHaveBeenCalledWith('5');
    const text = wrapper.text();
    expect(text).toContain('Ajibata → Tomok');
    expect(text).toContain('KMP Toba Sejahtera');
    expect(text).toContain('Sisa 5 kursi');
    expect(squash(text)).toContain('DewasaRp20.000');
    expect(squash(text)).toContain('AnakRp12.000');
  });

  it('total estimasi mengikuti jumlah dan kategori penumpang', async () => {
    const { wrapper } = await render();
    expect(squash(wrapper.text())).toContain('Rp20.000');

    await findByText(wrapper, 'button', '+ Tambah penumpang').trigger('click');
    expect(wrapper.findAll('fieldset')).toHaveLength(2);
    expect(squash(wrapper.text())).toContain('Rp40.000');

    await wrapper.find('#passenger-category-1').setValue('anak');
    expect(squash(wrapper.text())).toContain('Rp32.000');
  });

  it('penumpang bisa dihapus sampai tersisa satu', async () => {
    const { wrapper } = await render();
    expect(wrapper.find('button[aria-label^="Hapus penumpang"]').exists()).toBe(false);

    await findByText(wrapper, 'button', '+ Tambah penumpang').trigger('click');
    await wrapper.find('button[aria-label="Hapus penumpang 1"]').trigger('click');
    expect(wrapper.findAll('fieldset')).toHaveLength(1);
  });

  it('batas penumpang mengikuti sisa kursi', async () => {
    const { wrapper } = await render({ schedule: { ...SAMPLE_SCHEDULE, seats_left: 1 } });
    const add = findByText(wrapper, 'button', '+ Tambah penumpang');
    expect(add.attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('Batas maksimal 1 penumpang.');
  });

  it.each([
    ['ditutup', { status: 'closed' }],
    ['penuh', { seats_left: 0 }],
  ])('jadwal %s tidak bisa dipesan', async (_label, override) => {
    const { wrapper } = await render({ schedule: { ...SAMPLE_SCHEDULE, ...override } });
    expect(wrapper.text()).toContain('Jadwal ini sudah tidak bisa dipesan.');
    expect(wrapper.find('form').exists()).toBe(false);
  });

  it('tamu diarahkan ke login dengan parameter redirect', async () => {
    const { wrapper, router } = await render();
    expect(wrapper.text()).toContain('Masuk untuk memesan');
    await submit(wrapper);
    expect(router.currentRoute.value.name).toBe('login');
    expect(router.currentRoute.value.query.redirect).toBe('/jadwal/5');
    expect(createBooking).not.toHaveBeenCalled();
  });

  it('nama penumpang kosong ditolak', async () => {
    const { wrapper } = await render({ auth: CUSTOMER });
    expect(wrapper.text()).toContain('Pesan sekarang');
    await submit(wrapper);
    expect(wrapper.text()).toContain('Nama setiap penumpang minimal 2 karakter.');
    expect(createBooking).not.toHaveBeenCalled();
  });

  it('pemesanan sukses menuju halaman pembayaran', async () => {
    createBooking.mockResolvedValue({ code: 'TT-NEW' });
    const { wrapper, router } = await render({ auth: CUSTOMER });
    await wrapper.find('#passenger-name-0').setValue('  Budi Santoso ');
    await submit(wrapper);
    expect(createBooking).toHaveBeenCalledWith({
      schedule_id: 5,
      passengers: [{ name: 'Budi Santoso', category: 'dewasa' }],
    });
    expect(router.currentRoute.value.name).toBe('payment');
    expect(router.currentRoute.value.params.code).toBe('TT-NEW');
  });

  it('pemesanan gagal menampilkan pesan server dan tetap di halaman', async () => {
    createBooking.mockRejectedValue(apiError('Kursi tidak cukup', undefined, 409));
    const { wrapper, router } = await render({ auth: CUSTOMER });
    await wrapper.find('#passenger-name-0').setValue('Budi');
    await submit(wrapper);
    expect(wrapper.find('[role="alert"]').text()).toBe('Kursi tidak cukup');
    expect(router.currentRoute.value.name).toBe('schedule-detail');
  });

  it('gagal memuat jadwal menampilkan error dan bisa dicoba lagi', async () => {
    fetchSchedule.mockRejectedValueOnce(apiError('Jadwal tidak ditemukan', undefined, 404));
    fetchSchedule.mockResolvedValue(SAMPLE_SCHEDULE);
    const { wrapper } = await mountWithApp(ScheduleDetailPage, { route: '/jadwal/5' });
    await flushPromises();
    expect(wrapper.text()).toContain('Jadwal tidak ditemukan');

    await findByText(wrapper, 'button', 'Coba lagi').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Ajibata → Tomok');
  });
});
