import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/features/auth/states/authStore';
import HomePage from '@/features/common/pages/HomePage.vue';

const admin = { requiresAuth: true, role: 'admin', layout: 'admin' };

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/jadwal', name: 'schedules', component: () => import('@/features/schedules/pages/SchedulesPage.vue') },
  { path: '/jadwal/:id', name: 'schedule-detail', component: () => import('@/features/schedules/pages/ScheduleDetailPage.vue') },
  { path: '/verifikasi/:code?', name: 'verify-ticket', component: () => import('@/features/tickets/pages/VerifyTicketPage.vue') },

  // Masuk pelanggan (alias /auth/login) dan masuk admin dipisah agar jelas peruntukannya.
  { path: '/masuk', alias: '/auth/login', name: 'login', component: () => import('@/features/auth/pages/LoginPage.vue'), meta: { guestOnly: true, layout: 'bare' } },
  { path: '/admin/login', name: 'admin-login', component: () => import('@/features/auth/pages/AdminLoginPage.vue'), meta: { guestOnly: true, layout: 'bare' } },
  { path: '/daftar', name: 'register', component: () => import('@/features/auth/pages/RegisterPage.vue'), meta: { guestOnly: true, layout: 'bare' } },

  { path: '/profil', name: 'profile', component: () => import('@/features/auth/pages/ProfilePage.vue'), meta: { requiresAuth: true } },
  { path: '/tiket-saya', name: 'my-bookings', component: () => import('@/features/bookings/pages/MyBookingsPage.vue'), meta: { requiresAuth: true } },
  { path: '/booking/:code', name: 'booking-detail', component: () => import('@/features/bookings/pages/BookingDetailPage.vue'), meta: { requiresAuth: true } },
  { path: '/booking/:code/bayar', name: 'payment', component: () => import('@/features/bookings/pages/PaymentPage.vue'), meta: { requiresAuth: true } },

  { path: '/admin', name: 'admin-dashboard', component: () => import('@/features/admin/pages/AdminDashboardPage.vue'), meta: admin },
  { path: '/admin/checkin', name: 'admin-checkin', component: () => import('@/features/admin/pages/AdminCheckinPage.vue'), meta: admin },
  { path: '/admin/bookings', name: 'admin-bookings', component: () => import('@/features/admin/pages/AdminBookingsPage.vue'), meta: admin },
  { path: '/admin/users', name: 'admin-users', component: () => import('@/features/admin/pages/AdminUsersPage.vue'), meta: admin },
  {
    path: '/admin/:resource(ports|boats|routes|schedules)',
    name: 'admin-resource',
    component: () => import('@/features/admin/pages/AdminResourcePage.vue'),
    meta: admin,
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/features/common/pages/NotFoundPage.vue') },
];

const router = createRouter({ history: createWebHistory(), routes, scrollBehavior: () => ({ top: 0 }) });

/** Guard: pulihkan profil dari token, lalu cek login dan role. */
export async function authGuard(to) {
  const auth = useAuthStore();
  if (auth.token && !auth.user) await auth.fetchMe();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    // Halaman admin punya pintu masuk sendiri.
    const name = to.meta.role === 'admin' ? 'admin-login' : 'login';
    return { name, query: { redirect: to.fullPath } };
  }
  if (to.meta.role && auth.user?.role !== to.meta.role) return { name: 'home' };
  if (to.meta.guestOnly && auth.isAuthenticated) return { name: auth.isAdmin ? 'admin-dashboard' : 'home' };
  return true;
}

router.beforeEach(authGuard);

export default router;
