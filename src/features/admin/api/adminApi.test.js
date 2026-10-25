import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/helpers/apiHelper', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

import http from '@/helpers/apiHelper';
import {
  checkInTicket, fetchAdminBookings, fetchAdminUsers, fetchStats, resourceApi,
} from './adminApi';

describe('adminApi resourceApi', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('list: respons berupa array', async () => {
    http.get.mockResolvedValue({ data: { data: [{ id: 1 }] } });
    await expect(resourceApi('/ports').list()).resolves.toEqual([{ id: 1 }]);
    expect(http.get).toHaveBeenCalledWith('/ports', { params: { limit: 50 } });
  });

  it('list: respons berupa { items } dan listPath khusus', async () => {
    http.get.mockResolvedValue({ data: { data: { items: [{ id: 2 }] } } });
    const api = resourceApi('/schedules', '/schedules/admin/list');
    await expect(api.list()).resolves.toEqual([{ id: 2 }]);
    expect(http.get).toHaveBeenCalledWith('/schedules/admin/list', { params: { limit: 50 } });
  });

  it('create, update, remove', async () => {
    const api = resourceApi('/boats');
    http.post.mockResolvedValue({ data: { data: 'dibuat' } });
    http.put.mockResolvedValue({ data: { data: 'diubah' } });
    http.delete.mockResolvedValue({ data: { data: null, message: 'dihapus' } });

    await expect(api.create({ name: 'A' })).resolves.toBe('dibuat');
    expect(http.post).toHaveBeenCalledWith('/boats', { name: 'A' });

    await expect(api.update(3, { name: 'B' })).resolves.toBe('diubah');
    expect(http.put).toHaveBeenCalledWith('/boats/3', { name: 'B' });

    await expect(api.remove(3)).resolves.toEqual({ data: null, message: 'dihapus' });
    expect(http.delete).toHaveBeenCalledWith('/boats/3');
  });
});

describe('adminApi checkInTicket', () => {
  it('meng-encode kode pada URL', async () => {
    http.post.mockResolvedValue({ data: { data: { checked_in: true } } });
    await expect(checkInTicket('TK-A/B')).resolves.toEqual({ checked_in: true });
    expect(http.post).toHaveBeenCalledWith('/tickets/TK-A%2FB/checkin');
  });
});

describe('adminApi dasbor dan daftar', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('listPaged mengembalikan data apa adanya dengan params', async () => {
    http.get.mockResolvedValue({ data: { data: { items: [], pagination: { total: 0 } } } });
    const api = resourceApi('/schedules', '/schedules/admin/list');
    await expect(api.listPaged({ page: 2, limit: 10 })).resolves.toEqual({ items: [], pagination: { total: 0 } });
    expect(http.get).toHaveBeenCalledWith('/schedules/admin/list', { params: { page: 2, limit: 10 } });
  });

  it('fetchStats, fetchAdminBookings, fetchAdminUsers', async () => {
    http.get.mockResolvedValue({ data: { data: 'x' } });
    await expect(fetchStats()).resolves.toBe('x');
    expect(http.get).toHaveBeenCalledWith('/admin/stats');
    await fetchAdminBookings({ status: 'paid' });
    expect(http.get).toHaveBeenCalledWith('/admin/bookings', { params: { status: 'paid' } });
    await fetchAdminUsers({ q: 'a' });
    expect(http.get).toHaveBeenCalledWith('/admin/users', { params: { q: 'a' } });
  });
});
