import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import http, { configureHttp } from './apiHelper';

const originalAdapter = http.defaults.adapter;
let lastConfig;

/** Adapter tiruan: mencatat config dan membalas sesuai skenario. */
function useAdapter(behavior) {
  http.defaults.adapter = async (config) => {
    lastConfig = config;
    return behavior(config);
  };
}
const ok = (config) => ({ data: { data: 'ok' }, status: 200, statusText: 'OK', headers: {}, config });
const fail = (status) => (config) => {
  throw Object.assign(new Error(`HTTP ${status}`), { config, response: { status, data: {}, headers: {} } });
};

describe('helpers/apiHelper', () => {
  let onUnauthorized;

  beforeEach(() => {
    lastConfig = undefined;
    onUnauthorized = vi.fn();
    configureHttp({ getToken: () => null, onUnauthorized });
  });

  afterEach(() => {
    http.defaults.adapter = originalAdapter;
  });

  it('memakai baseURL dari env (atau default) dan timeout 15 detik', () => {
    expect(http.defaults.baseURL).toBe(import.meta.env.VITE_API_URL || 'http://localhost:3000/api');
    expect(http.defaults.timeout).toBe(15000);
  });

  it('menambahkan header Authorization bila ada token', async () => {
    configureHttp({ getToken: () => 'token-rahasia', onUnauthorized });
    useAdapter(ok);
    await http.get('/ports');
    expect(lastConfig.headers.Authorization).toBe('Bearer token-rahasia');
  });

  it('tidak menambahkan Authorization bila tidak ada token', async () => {
    useAdapter(ok);
    await http.get('/ports');
    expect(lastConfig.headers.Authorization).toBeUndefined();
  });

  it('401 memicu onUnauthorized dan error tetap diteruskan', async () => {
    useAdapter(fail(401));
    await expect(http.get('/bookings')).rejects.toThrow('HTTP 401');
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('401 dengan skipAuthRedirect tidak memicu onUnauthorized', async () => {
    useAdapter(fail(401));
    await expect(http.post('/auth/login', {}, { skipAuthRedirect: true })).rejects.toThrow();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('error non-401 dan error jaringan tidak memicu onUnauthorized', async () => {
    useAdapter(fail(500));
    await expect(http.get('/x')).rejects.toThrow('HTTP 500');
    useAdapter(() => { throw new Error('Network Error'); });
    await expect(http.get('/x')).rejects.toThrow('Network Error');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
