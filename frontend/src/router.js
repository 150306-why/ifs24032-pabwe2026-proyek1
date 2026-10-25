import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/features/auth/states/authStore';
import HomePage from '@/features/common/pages/HomePage.vue';

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/jadwal', name: 'schedules', component: () => import('@/features/schedules/pages/SchedulesPage.vue') },
  { path: '/jadwal/:id', name: 'schedule-detail', component: () => import('@/features/schedules/pages/ScheduleDetailPage.vue') },
  { path: '/masuk', alias: '/auth/login', name: 'login', component: () => import('@/features/auth/pages/LoginPage.vue'), meta: { guestOnly: true } },
  { path: '/daftar', name: 'register', component: () => import('@/features/auth/pages/RegisterPage.vue'), meta: { guestOnly: true } },
  { path: '/tiket-saya', name: 'my-bookings', component: () => import('@/features/bookings/pages/MyBookingsPage.vue'), meta: { requiresAuth: true } },
  { path: '/booking/:code', name: 'booking-detail', component: () => import('@/features/bookings/pages/BookingDetailPage.vue'), meta: { requiresAuth: true } },
  { path: '/booking/:code/bayar', name: 'payment', component: () => import('@/features/bookings/pages/PaymentPage.vue'), meta: { requiresAuth: true } },
  { path: '/admin', redirect: { name: 'admin-resource', params: { resource: 'schedules' } } },
  {
    path: '/admin/checkin',
    name: 'admin-checkin',
    component: () => import('@/features/admin/pages/AdminCheckinPage.vue'),
    meta: { requiresAuth: true, role: 'admin' },
  },
  {
    path: '/admin/:resource(ports|boats|routes|schedules)',
    name: 'admin-resource',
    component: () => import('@/features/admin/pages/AdminResourcePage.vue'),
    meta: { requiresAuth: true, role: 'admin' },
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/features/common/pages/NotFoundPage.vue') },
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