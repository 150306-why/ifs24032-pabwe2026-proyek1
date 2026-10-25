import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';

// api/http dipalsukan agar tidak ada permintaan jaringan; configureHttp dipantau.
vi.mock('./helpers/apiHelper', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  configureHttp: vi.fn(),
}));
vi.mock('@/features/schedules/api/catalogApi', () => ({
  fetchPorts: vi.fn().mockResolvedValue([]),
  fetchSchedules: vi.fn(),
  fetchSchedule: vi.fn(),
}));

describe('main.js', () => {
  it('memasang aplikasi ke #app dan menghubungkan token serta penanganan 401', async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const { configureHttp } = await import('./helpers/apiHelper');
    const { useAuthStore } = await import('@/features/auth/states/authStore');
    const { default: router } = await import('@/router');

    await import('./main');
    await flushPromises();

    // Aplikasi ter-render di #app (header + footer dari App.vue).
    const root = document.querySelector('#app');
    expect(root.querySelector('header')).not.toBeNull();
    expect(root.textContent).toContain('Toba Tix');

    // configureHttp dipanggil sekali dengan getToken dan onUnauthorized.
    expect(configureHttp).toHaveBeenCalledTimes(1);
    const options = configureHttp.mock.calls[0][0];

    const auth = useAuthStore();
    expect(options.getToken()).toBeNull();
    auth.token = 'token-uji';
    auth.user = { id: 1, name: 'Uji', role: 'customer' };
    expect(options.getToken()).toBe('token-uji');

    // 401: sesi dibersihkan dan pengguna diarahkan ke login membawa halaman semula.
    options.onUnauthorized();
    expect(auth.isAuthenticated).toBe(false);
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'));
    expect(router.currentRoute.value.query).toHaveProperty('redirect');
  });
});
