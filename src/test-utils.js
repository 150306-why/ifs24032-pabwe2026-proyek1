import { createMemoryHistory, createRouter } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { useAuthStore } from '@/features/auth/states/authStore';

/** Komponen kosong untuk route tiruan. */
export const Stub = { name: 'Stub', render: () => null };

/** Router memori dengan nama dan path yang sama seperti router aplikasi, tanpa guard. */
export function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: Stub },
      { path: '/jadwal', name: 'schedules', component: Stub },
      { path: '/jadwal/:id', name: 'schedule-detail', component: Stub },
      { path: '/verifikasi/:code?', name: 'verify-ticket', component: Stub },
      { path: '/masuk', name: 'login', component: Stub },
      { path: '/admin/login', name: 'admin-login', component: Stub },
      { path: '/profil', name: 'profile', component: Stub },
      { path: '/daftar', name: 'register', component: Stub },
      { path: '/tiket-saya', name: 'my-bookings', component: Stub },
      { path: '/booking/:code', name: 'booking-detail', component: Stub },
      { path: '/booking/:code/bayar', name: 'payment', component: Stub },
      { path: '/admin', name: 'admin-dashboard', component: Stub },
      { path: '/admin/bookings', name: 'admin-bookings', component: Stub },
      { path: '/admin/users', name: 'admin-users', component: Stub },
      { path: '/admin/checkin', name: 'admin-checkin', component: Stub },
      { path: '/admin/:resource(ports|boats|routes|schedules)', name: 'admin-resource', component: Stub },
      { path: '/:pathMatch(.*)*', name: 'not-found', component: Stub },
    ],
  });
}

/**
 * Memasang komponen dengan Pinia + router uji.
 * @param {object} component komponen yang diuji
 * @param {{ route?: string, props?: object, auth?: { token: string, user: object }, global?: object }} [options]
 */
export async function mountWithApp(component, { route = '/', props = {}, auth, global = {} } = {}) {
  localStorage.clear();
  const pinia = createPinia();
  setActivePinia(pinia);
  if (auth) {
    const store = useAuthStore(pinia);
    store.token = auth.token;
    store.user = auth.user;
  }
  const router = createTestRouter();
  router.push(route);
  await router.isReady();
  const wrapper = mount(component, { props, global: { plugins: [pinia, router], ...global } });
  return { wrapper, router, pinia };
}

/** Mencari tombol/tautan berdasarkan teks persis. */
export const findByText = (wrapper, selector, text) => wrapper.findAll(selector).find((el) => el.text() === text);

/** Menghilangkan semua spasi (termasuk NBSP dari Intl) agar perbandingan teks stabil. */
export const squash = (text) => text.replace(/\s/g, '');

export const SAMPLE_SCHEDULE = {
  id: 5,
  departure_at: '2030-01-01T01:00:00.000Z',
  status: 'open',
  capacity: 120,
  booked: 115,
  seats_left: 5,
  duration_min: 60,
  boat: { id: 1, name: 'KMP Toba Sejahtera', type: 'ferry' },
  route: { id: 1, origin: { id: 1, name: 'Ajibata' }, destination: { id: 2, name: 'Tomok' } },
  fares: { dewasa: 20000, anak: 12000 },
};

export const SAMPLE_BOOKING = {
  code: 'TT-ABC123',
  status: 'pending',
  total: 32000,
  created_at: '2030-01-01T00:00:00.000Z',
  expires_at: null,
  passenger_count: 2,
  schedule: {
    id: 5,
    departure_at: '2030-01-01T01:00:00.000Z',
    origin: 'Ajibata',
    destination: 'Tomok',
    boat_name: 'KMP Toba Sejahtera',
  },
  tickets: [
    { passenger_name: 'Budi', category: 'dewasa', price: 20000, code: 'TK-AAA', checked_in_at: null },
    { passenger_name: 'Ani', category: 'anak', price: 12000, code: 'TK-BBB', checked_in_at: '2030-01-01T01:30:00.000Z' },
  ],
};

/** Error bergaya axios. */
export const apiError = (message, errors, status = 422) => ({ response: { status, data: { message, errors } } });