import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./http', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

import http from './http';
import { fetchPorts, fetchSchedule, fetchSchedules } from './catalog';

describe('api/catalog', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    http.get.mockResolvedValue({ data: { data: 'DATA' } });
  });

  it('fetchPorts', async () => {
    await expect(fetchPorts()).resolves.toBe('DATA');
    expect(http.get).toHaveBeenCalledWith('/ports');
  });

  it('fetchSchedules meneruskan parameter query', async () => {
    await expect(fetchSchedules({ origin: 1, limit: 10 })).resolves.toBe('DATA');
    expect(http.get).toHaveBeenCalledWith('/schedules', { params: { origin: 1, limit: 10 } });
  });

  it('fetchSchedule', async () => {
    await expect(fetchSchedule(7)).resolves.toBe('DATA');
    expect(http.get).toHaveBeenCalledWith('/schedules/7');
  });
});
