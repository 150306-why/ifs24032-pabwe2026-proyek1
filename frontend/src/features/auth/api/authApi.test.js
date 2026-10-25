import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/helpers/apiHelper', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

import http from '@/helpers/apiHelper';
import {
  changePassword, fetchMe, login, register, updateProfile,
} from './authApi';

describe('authApi', () => {
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

  it('updateProfile dan changePassword memakai PUT', async () => {
    http.put.mockResolvedValue({ data: { data: { name: 'Baru' }, message: 'ok' } });
    await expect(updateProfile({ name: 'Baru' })).resolves.toEqual({ name: 'Baru' });
    expect(http.put).toHaveBeenCalledWith('/auth/profile', { name: 'Baru' });
    await expect(changePassword({ current_password: 'a', new_password: 'b' })).resolves.toEqual({ data: { name: 'Baru' }, message: 'ok' });
    expect(http.put).toHaveBeenLastCalledWith('/auth/password', { current_password: 'a', new_password: 'b' });
  });
});
