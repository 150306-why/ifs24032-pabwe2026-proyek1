import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/api/bookings', () => ({
  createBooking: vi.fn(),
  fetchBookings: vi.fn(),
  fetchBooking: vi.fn(),
  payBooking: vi.fn(),
  cancelBooking: vi.fn(),
}));

import * as api from '@/api/bookings';
import { useBookingStore } from './bookings';

describe('bookings store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  it('state awal kosong', () => {
    const store = useBookingStore();
    expect(store.list).toEqual([]);
    expect(store.current).toBeNull();
  });

  it('create mengirim schedule_id dan penumpang, lalu menyimpan current', async () => {
    api.createBooking.mockResolvedValue({ code: 'TT-1' });
    const store = useBookingStore();
    const passengers = [{ name: 'Budi', category: 'dewasa' }];
    await expect(store.create(5, passengers)).resolves.toEqual({ code: 'TT-1' });
    expect(api.createBooking).toHaveBeenCalledWith({ schedule_id: 5, passengers });
    expect(store.current).toEqual({ code: 'TT-1' });
  });

  it('loadList mengisi daftar', async () => {
    api.fetchBookings.mockResolvedValue([{ code: 'A' }, { code: 'B' }]);
    const store = useBookingStore();
    await store.loadList();
    expect(store.list).toHaveLength(2);
  });

  it('load, pay, dan cancel memperbarui current', async () => {
    const store = useBookingStore();

    api.fetchBooking.mockResolvedValue({ code: 'TT-1', status: 'pending' });
    await expect(store.load('TT-1')).resolves.toMatchObject({ status: 'pending' });
    expect(api.fetchBooking).toHaveBeenCalledWith('TT-1');

    api.payBooking.mockResolvedValue({ code: 'TT-1', status: 'paid' });
    await store.pay('TT-1');
    expect(api.payBooking).toHaveBeenCalledWith('TT-1');
    expect(store.current.status).toBe('paid');

    api.cancelBooking.mockResolvedValue({ code: 'TT-1', status: 'cancelled' });
    await store.cancel('TT-1');
    expect(api.cancelBooking).toHaveBeenCalledWith('TT-1');
    expect(store.current.status).toBe('cancelled');
  });

  it('error dari API diteruskan ke pemanggil', async () => {
    api.payBooking.mockRejectedValue(new Error('gagal'));
    const store = useBookingStore();
    await expect(store.pay('TT-1')).rejects.toThrow('gagal');
  });
});
