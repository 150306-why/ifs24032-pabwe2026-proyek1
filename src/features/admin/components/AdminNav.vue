<script setup>
import AppIcon from '@/features/common/components/AppIcon.vue';

/** Daftar menu admin; dipakai AdminLayout (sidebar di desktop, deretan tab di ponsel). */
const GROUPS = [
  {
    title: 'Ringkasan',
    items: [{ to: '/admin', label: 'Dasbor', icon: 'dashboard', exact: true }],
  },
  {
    title: 'Operasional',
    items: [
      { to: '/admin/schedules', label: 'Jadwal', icon: 'calendar' },
      { to: '/admin/bookings', label: 'Booking', icon: 'ticket' },
      { to: '/admin/checkin', label: 'Check-in', icon: 'scan' },
    ],
  },
  {
    title: 'Data master',
    items: [
      { to: '/admin/routes', label: 'Rute', icon: 'route' },
      { to: '/admin/boats', label: 'Kapal', icon: 'ship' },
      { to: '/admin/ports', label: 'Pelabuhan', icon: 'anchor' },
      { to: '/admin/users', label: 'Pengguna', icon: 'users' },
    ],
  },
];
</script>

<template>
  <nav aria-label="Menu admin" class="flex gap-4 overflow-x-auto lg:flex-col lg:gap-6 lg:overflow-visible">
    <div v-for="g in GROUPS" :key="g.title" class="flex items-center gap-1 lg:block">
      <p class="mb-1.5 hidden px-3 text-xs font-semibold text-lake-400 lg:block">{{ g.title }}</p>
      <ul class="flex gap-1 lg:flex-col">
        <li v-for="item in g.items" :key="item.to">
          <RouterLink
            :to="item.to"
            :exact-active-class="item.exact ? '!bg-white !text-lake-900 shadow-sm' : ''"
            :active-class="item.exact ? '' : '!bg-white !text-lake-900 shadow-sm'"
            class="flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-lake-100 transition hover:bg-white/10"
          >
            <AppIcon :name="item.icon" :size="18" />
            {{ item.label }}
          </RouterLink>
        </li>
      </ul>
    </div>
  </nav>
</template>
