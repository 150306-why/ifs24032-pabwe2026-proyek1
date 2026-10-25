<script setup>
import { formatDuration, formatRupiah, formatTime } from '@/helpers/formatHelper';

defineProps({ schedule: { type: Object, required: true } });
</script>

<template>
  <article class="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p class="text-sm text-slate-600">{{ schedule.boat.name }}</p>
      <h3 class="text-lg font-semibold text-lake-900">
        {{ schedule.route.origin.name }} → {{ schedule.route.destination.name }}
      </h3>
      <p class="text-slate-700">
        Berangkat <strong>{{ formatTime(schedule.departure_at) }} WIB</strong>
        · {{ formatDuration(schedule.duration_min) }}
      </p>
    </div>
    <div class="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
      <div class="sm:text-right">
        <p class="text-lg font-bold text-pine-700">{{ formatRupiah(schedule.fares.dewasa) }}</p>
        <p class="text-sm" :class="schedule.seats_left <= 5 ? 'text-red-700' : 'text-slate-600'">
          Sisa {{ schedule.seats_left }} kursi
        </p>
      </div>
      <RouterLink
        :to="{ name: 'schedule-detail', params: { id: schedule.id } }"
        class="rounded-lg bg-lake-700 px-4 py-2 font-medium text-white hover:bg-lake-800 focus:outline-none focus:ring-2 focus:ring-lake-500 focus:ring-offset-2"
        :aria-label="`Pilih jadwal ${schedule.route.origin.name} ke ${schedule.route.destination.name} pukul ${formatTime(schedule.departure_at)}`"
      >
        Pilih
      </RouterLink>
    </div>
  </article>
</template>
