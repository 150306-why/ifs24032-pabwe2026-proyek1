import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./http', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

import http from './http';
import {
  cancelBooking, createBooking, fetchBooking, fetchBookings, payBooking,
} from './bookings';

describe('api/bookings', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    http.get.mockResolvedValue({ data: { data: 'GET' } });
    http.post.mockResolvedValue({ data: { data: 'POST' } });
  });

  it('createBooking', async () => {
    await expect(createBooking({ schedule_id: 1 })).resolves.toBe('POST');
    expect(http.post).toHaveBeenCalledWith('/bookings', { schedule_id: 1 });
  });

  it('fetchBookings', async () => {
    await expect(fetchBookings()).resolves.toBe('GET');
    expect(http.get).toHaveBeenCalledWith('/bookings');
  });

  it('fetchBooking', async () => {
    await expect(fetchBooking('TT-1')).resolves.toBe('GET');
    expect(http.get).toHaveBeenCalledWith('/bookings/TT-1');
  });

  it('payBooking', async () => {
    await expect(payBooking('TT-1')).resolves.toBe('POST');
    expect(http.post).toHaveBeenCalledWith('/bookings/TT-1/pay');
  });

  it('cancelBooking', async () => {
    await expect(cancelBooking('TT-1')).resolves.toBe('POST');
    expect(http.post).toHaveBeenCalledWith('/bookings/TT-1/cancel');
  });
});
