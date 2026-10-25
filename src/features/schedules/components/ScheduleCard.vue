<script setup>
import { addMinutes, formatDuration, formatRupiah, formatTime } from '@/helpers/formatHelper';
import AppIcon from '@/features/common/components/AppIcon.vue';

defineProps({ schedule: { type: Object, required: true } });

const TYPE_LABEL = { ferry: 'Ferry', speedboat: 'Speedboat', wisata: 'Kapal wisata' };
</script>

<template>
  <article class="card-flat flex flex-col gap-4 p-5 transition hover:border-lake-300 hover:shadow-lift sm:flex-row sm:items-center">
    <div class="flex flex-1 items-center gap-4 sm:gap-6">
      <div class="text-center">
        <p class="font-display text-2xl font-extrabold text-lake-900">{{ formatTime(schedule.departure_at) }}</p>
        <p class="text-xs text-slate-500">{{ schedule.route.origin.name }}</p>
      </div>
      <div class="flex flex-1 flex-col items-center gap-1 text-xs text-slate-500" aria-hidden="true">
        <span>{{ formatDuration(schedule.duration_min) }}</span>
        <span class="relative block h-px w-full bg-lake-300">
          <span class="absolute -left-0.5 -top-[3px] h-1.5 w-1.5 rounded-full bg-lake-700"></span>
          <AppIcon name="ship" :size="16" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-0.5 text-lake-700" />
          <span class="absolute -right-0.5 -top-[3px] h-1.5 w-1.5 rounded-full bg-ulos-600"></span>
        </span>
        <span>{{ TYPE_LABEL[schedule.boat.type] || schedule.boat.type }}</span>
      </div>
      <div class="text-center">
        <p class="font-display text-2xl font-extrabold text-lake-900">{{ formatTime(addMinutes(schedule.departure_at, schedule.duration_min)) }}</p>
        <p class="text-xs text-slate-500">{{ schedule.route.destination.name }}</p>
      </div>
    </div>

    <div class="flex items-center justify-between gap-4 border-t border-dashed border-lake-200 pt-4 sm:w-52 sm:flex-col sm:items-end sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
      <div class="sm:text-right">
        <p class="sr-only">{{ schedule.route.origin.name }} → {{ schedule.route.destination.name }}, {{ schedule.boat.name }}, berangkat {{ formatTime(schedule.departure_at) }} WIB</p>
        <p class="text-xs text-slate-500">{{ schedule.boat.name }}</p>
        <p class="font-display text-xl font-extrabold text-pine-700">{{ formatRupiah(schedule.fares.dewasa) }}</p>
        <p class="text-xs font-medium" :class="schedule.seats_left <= 5 ? 'text-ulos-700' : 'text-slate-500'">
          Sisa {{ schedule.seats_left }} kursi
        </p>
      </div>
      <RouterLink
        :to="{ name: 'schedule-detail', params: { id: schedule.id } }"
        class="rounded-xl bg-ulos-600 px-5 py-2.5 font-semibold text-white transition hover:bg-ulos-700"
        :aria-label="`Pilih jadwal ${schedule.route.origin.name} ke ${schedule.route.destination.name} pukul ${formatTime(schedule.departure_at)}`"
      >
        Pilih
      </RouterLink>
    </div>
  </article>
</template>
