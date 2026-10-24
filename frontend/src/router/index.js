import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import HomeView from '@/views/HomeView.vue';

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/jadwal', name: 'schedules', component: () => import('@/views/SchedulesView.vue') },
  { path: '/jadwal/:id', name: 'schedule-detail', component: () => import('@/views/ScheduleDetailView.vue') },
  { path: '/masuk', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { guestOnly: true } },
  { path: '/daftar', name: 'register', component: () => import('@/views/RegisterView.vue'), meta: { guestOnly: true } },
  { path: '/tiket-saya', name: 'my-bookings', component: () => import('@/views/MyBookingsView.vue'), meta: { requiresAuth: true } },
  { path: '/booking/:code', name: 'booking-detail', component: () => import('@/views/BookingDetailView.vue'), meta: { requiresAuth: true } },
  { path: '/booking/:code/bayar', name: 'payment', component: () => import('@/views/PaymentView.vue'), meta: { requiresAuth: true } },
  { path: '/admin', redirect: { name: 'admin-resource', params: { resource: 'schedules' } } },
  {
    path: '/admin/checkin',
    name: 'admin-checkin',
    component: () => import('@/views/admin/AdminCheckinView.vue'),
    meta: { requiresAuth: true, role: 'admin' },
  },
  {
    path: '/admin/:resource(ports|boats|routes|schedules)',
    name: 'admin-resource',
    component: () => import('@/views/admin/AdminResourceView.vue'),
    meta: { requiresAuth: true, role: 'admin' },
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
];

const router = createRouter({ history: createWebHistory(), routes, scrollBehavior: () => ({ top: 0 }) });

/** Guard: pulihkan profil dari token, lalu cek login dan role. */
export async function authGuard(to) {
  const auth = useAuthStore();
  if (auth.token && !auth.user) await auth.fetchMe();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.role && auth.user?.role !== to.meta.role) return { name: 'home' };
  if (to.meta.guestOnly && auth.isAuthenticated) return { name: 'home' };
  return true;
}

router.beforeEach(authGuard);

export default router;
