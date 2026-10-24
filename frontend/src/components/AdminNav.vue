<script setup>
const TABS = [
  { to: '/admin/schedules', label: 'Jadwal' },
  { to: '/admin/routes', label: 'Rute' },
  { to: '/admin/boats', label: 'Kapal' },
  { to: '/admin/ports', label: 'Pelabuhan' },
  { to: '/admin/checkin', label: 'Check-in' },
];
</script>

<template>
  <nav class="mb-4 flex flex-wrap gap-2" aria-label="Menu admin">
    <RouterLink
      v-for="t in TABS"
      :key="t.to"
      :to="t.to"
      class="rounded-lg border border-lake-700 px-3 py-1 text-lake-800 hover:bg-lake-100 focus:outline-none focus:ring-2 focus:ring-lake-500"
      active-class="!bg-lake-700 !text-white"
    >
      {{ t.label }}
    </RouterLink>
  </nav>
</template>
