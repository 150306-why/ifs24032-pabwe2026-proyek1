import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./http', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

import http from './http';
import { fetchMe, login, register } from './auth';

describe('api/auth', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('login mengirim kredensial dengan skipAuthRedirect dan mengembalikan data', async () => {
    http.post.mockResolvedValue({ data: { data: { token: 't' } } });
    await expect(login({ email: 'a@b.co', password: 'x' })).resolves.toEqual({ token: 't' });
    expect(http.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.co', password: 'x' }, { skipAuthRedirect: true });
  });

  it('register mengirim payload dengan skipAuthRedirect', async () => {
    http.post.mockResolvedValue({ data: { data: { token: 'r' } } });
    await expect(register({ name: 'Budi' })).resolves.toEqual({ token: 'r' });
    expect(http.post).toHaveBeenCalledWith('/auth/register', { name: 'Budi' }, { skipAuthRedirect: true });
  });

  it('fetchMe memanggil /auth/me', async () => {
    http.get.mockResolvedValue({ data: { data: { id: 1 } } });
    await expect(fetchMe()).resolves.toEqual({ id: 1 });
    expect(http.get).toHaveBeenCalledWith('/auth/me');
  });
});
