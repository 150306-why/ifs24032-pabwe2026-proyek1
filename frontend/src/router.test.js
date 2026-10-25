import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/features/auth/api/authApi', () => ({
  login: vi.fn(),
  register: vi.fn(),
  fetchMe: vi.fn(),
}));
// Halaman dimuat sungguhan (lazy import) tetapi tanpa permintaan jaringan.
vi.mock('@/features/schedules/api/catalogApi', () => ({ fetchPorts: vi.fn(), fetchSchedules: vi.fn(), fetchSchedule: vi.fn() }));
vi.mock('@/features/bookings/api/bookingApi', () => ({
  createBooking: vi.fn(), fetchBookings: vi.fn(), fetchBooking: vi.fn(), payBooking: vi.fn(), cancelBooking: vi.fn(),
}));
vi.mock('@/features/admin/api/adminApi', () => ({
  resourceApi: () => ({
    list: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), remove: vi.fn(),
  }),
  checkInTicket: vi.fn(),
}));

import * as authApi from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/states/authStore';
import router, { authGuard } from './router';

const route = (meta = {}, fullPath = '/tujuan') => ({ meta, fullPath });

function loginAs(role) {
  const auth = useAuthStore();
  auth.token = 'tok';
  auth.user = { id: 1, name: 'Uji', role };
  return auth;
}

describe('authGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  it('halaman publik selalu boleh', async () => {
    await expect(authGuard(route())).resolves.toBe(true);
  });

  it('halaman yang butuh login mengarahkan tamu ke login dengan redirect', async () => {
    await expect(authGuard(route({ requiresAuth: true }, '/tiket-saya'))).resolves.toEqual({
      name: 'login',
      query: { redirect: '/tiket-saya' },
    });
  });

  it('pengguna login boleh membuka halaman yang butuh login', async () => {
    loginAs('customer');
    await expect(authGuard(route({ requiresAuth: true }))).resolves.toBe(true);
  });

  it('halaman admin: customer dialihkan ke beranda, admin boleh', async () => {
    loginAs('customer');
    await expect(authGuard(route({ requiresAuth: true, role: 'admin' }))).resolves.toEqual({ name: 'home' });

    setActivePinia(createPinia());
    loginAs('admin');
    await expect(authGuard(route({ requiresAuth: true, role: 'admin' }))).resolves.toBe(true);
  });

  it('halaman khusus tamu (login/daftar) mengalihkan pengguna yang sudah login', async () => {
    loginAs('customer');
    await expect(authGuard(route({ guestOnly: true }))).resolves.toEqual({ name: 'home' });
  });

  it('halaman khusus tamu boleh dibuka tamu', async () => {
    await expect(authGuard(route({ guestOnly: true }))).resolves.toBe(true);
  });

  it('token ada tetapi profil belum dimuat: profil diambil dari server', async () => {
    sessionStorage.setItem('tobatix_token', 'tok');
    setActivePinia(createPinia());
    authApi.fetchMe.mockResolvedValue({ id: 1, name: 'Admin', role: 'admin' });
    await expect(authGuard(route({ requiresAuth: true, role: 'admin' }))).resolves.toBe(true);
    expect(authApi.fetchMe).toHaveBeenCalledTimes(1);
  });

  it('token tidak valid: sesi dibersihkan dan pengguna diarahkan ke login', async () => {
    sessionStorage.setItem('tobatix_token', 'basi');
    setActivePinia(createPinia());
    authApi.fetchMe.mockRejectedValue(new Error('401'));
    await expect(authGuard(route({ requiresAuth: true }, '/tiket-saya'))).resolves.toEqual({
      name: 'login',
      query: { redirect: '/tiket-saya' },
    });
    expect(sessionStorage.getItem('tobatix_token')).toBeNull();
  });
});

describe('definisi router', () => {
  beforeEach(() => {
    sessionStorage.clear();
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  it('memiliki semua route bernama yang dipakai aplikasi', () => {
    const names = router.getRoutes().map((r) => r.name).filter(Boolean);
    expect(names).toEqual(expect.arrayContaining([
      'home', 'schedules', 'schedule-detail', 'login', 'register', 'my-bookings',
      'booking-detail', 'payment', 'admin-checkin', 'admin-resource', 'not-found',
    ]));
  });

  it('meta route: butuh login, khusus tamu, dan khusus admin', () => {
    const meta = (name) => router.getRoutes().find((r) => r.name === name).meta;
    expect(meta('my-bookings')).toEqual({ requiresAuth: true });
    expect(meta('payment')).toEqual({ requiresAuth: true });
    expect(meta('login')).toEqual({ guestOnly: true });
    expect(meta('register')).toEqual({ guestOnly: true });
    expect(meta('admin-checkin')).toEqual({ requiresAuth: true, role: 'admin' });
    expect(meta('admin-resource')).toEqual({ requiresAuth: true, role: 'admin' });
    expect(meta('home')).toEqual({});
  });

  it('semua halaman lazy-load dapat dimuat', async () => {
    const loaders = router.getRoutes()
      .map((r) => r.components?.default)
      .filter((c) => typeof c === 'function');
    expect(loaders.length).toBeGreaterThanOrEqual(10);
    const modules = await Promise.all(loaders.map((load) => load()));
    modules.forEach((m) => expect(m.default).toBeDefined());
  }, 60000);

  it('URL tidak dikenal menuju halaman not-found', async () => {
    await router.push('/tidak-ada-halaman-ini');
    expect(router.currentRoute.value.name).toBe('not-found');
  });

  it('/admin dialihkan ke kelola jadwal untuk admin', async () => {
    loginAs('admin');
    await router.push('/admin');
    expect(router.currentRoute.value.fullPath).toBe('/admin/schedules');
    expect(router.currentRoute.value.name).toBe('admin-resource');
  });

  it('customer tidak bisa membuka halaman admin', async () => {
    loginAs('customer');
    await router.push('/admin/checkin');
    expect(router.currentRoute.value.name).toBe('home');
  });

  it('tamu yang membuka tiket saya diarahkan ke login membawa tujuan semula', async () => {
    await router.push('/tiket-saya');
    expect(router.currentRoute.value.name).toBe('login');
    expect(router.currentRoute.value.query.redirect).toBe('/tiket-saya');
  });

  it('pengguna login tidak bisa membuka halaman login lagi', async () => {
    loginAs('customer');
    await router.push('/masuk');
    expect(router.currentRoute.value.name).toBe('home');
  });
});
