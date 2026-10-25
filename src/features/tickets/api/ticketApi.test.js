import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/helpers/apiHelper', () => ({ default: { get: vi.fn() } }));

import http from '@/helpers/apiHelper';
import { verifyTicket } from './ticketApi';

describe('ticketApi', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('verifyTicket memanggil endpoint publik dengan kode ter-encode', async () => {
    http.get.mockResolvedValue({ data: { data: { valid: true } } });
    await expect(verifyTicket('TK-A/B')).resolves.toEqual({ valid: true });
    expect(http.get).toHaveBeenCalledWith('/tickets/TK-A%2FB');
  });
});
