import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { apiError, mountWithApp } from '@/test-utils';

vi.mock('@/features/tickets/api/ticketApi', () => ({ verifyTicket: vi.fn() }));

import { verifyTicket } from '@/features/tickets/api/ticketApi';
import VerifyTicketPage from './VerifyTicketPage.vue';

const VALID = {
  code: 'TK-ABC',
  passenger_name: 'B*** S******',
  category: 'dewasa',
  valid: true,
  booking_status: 'paid',
  checked_in: false,
  departure_at: '2030-01-01T01:00:00.000Z',
  origin: 'Ajibata',
  destination: 'Tomok',
  boat_name: 'KMP Toba Sejahtera',
};

async function check(wrapper, code) {
  await wrapper.find('#verify-code').setValue(code);
  await wrapper.find('form').trigger('submit');
  await flushPromises();
}

describe('VerifyTicketPage', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('kode kosong ditolak tanpa memanggil API', async () => {
    const { wrapper } = await mountWithApp(VerifyTicketPage, { route: '/verifikasi' });
    await check(wrapper, '  ');
    expect(wrapper.text()).toContain('Masukkan kode tiket');
    expect(verifyTicket).not.toHaveBeenCalled();
  });

  it('tiket sah menampilkan detail dan mengubah URL', async () => {
    verifyTicket.mockResolvedValue(VALID);
    const { wrapper, router } = await mountWithApp(VerifyTicketPage, { route: '/verifikasi' });
    await check(wrapper, ' tk-abc ');
    expect(verifyTicket).toHaveBeenCalledWith('TK-ABC');
    expect(wrapper.text()).toContain('Tiket sah dan belum dipakai');
    expect(wrapper.text()).toContain('Ajibata → Tomok');
    expect(wrapper.text()).toContain('B*** S******');
    expect(router.currentRoute.value.params.code).toBe('TK-ABC');
  });

  it('tiket yang sudah check-in diberi keterangan', async () => {
    verifyTicket.mockResolvedValue({ ...VALID, checked_in: true });
    const { wrapper } = await mountWithApp(VerifyTicketPage, { route: '/verifikasi' });
    await check(wrapper, 'TK-ABC');
    expect(wrapper.text()).toContain('sudah check-in');
  });

  it.each([
    ['cancelled', 'dibatalkan'],
    ['pending', 'belum dibayar'],
  ])('tiket dengan booking %s tidak berlaku', async (status, text) => {
    verifyTicket.mockResolvedValue({ ...VALID, valid: false, booking_status: status });
    const { wrapper } = await mountWithApp(VerifyTicketPage, { route: '/verifikasi' });
    await check(wrapper, 'TK-ABC');
    expect(wrapper.text()).toContain('Tiket tidak berlaku');
    expect(wrapper.text()).toContain(text);
  });

  it('kode tidak ditemukan menampilkan pesan server', async () => {
    verifyTicket.mockRejectedValue(apiError('Tiket tidak ditemukan', undefined, 404));
    const { wrapper } = await mountWithApp(VerifyTicketPage, { route: '/verifikasi' });
    await check(wrapper, 'TK-X');
    expect(wrapper.find('[role="alert"]').text()).toBe('Tiket tidak ditemukan');
  });

  it('kode di URL langsung diperiksa saat halaman dibuka', async () => {
    verifyTicket.mockResolvedValue(VALID);
    const { wrapper } = await mountWithApp(VerifyTicketPage, { route: '/verifikasi/TK-ABC' });
    await flushPromises();
    expect(verifyTicket).toHaveBeenCalledWith('TK-ABC');
    expect(wrapper.text()).toContain('Tiket sah');
  });
});
