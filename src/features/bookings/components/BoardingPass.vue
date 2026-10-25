<script setup>
import { addMinutes, formatDateTime, formatRupiah, formatTime } from '@/helpers/formatHelper';
import QrCode from '@/features/bookings/components/QrCode.vue';

defineProps({
  ticket: { type: Object, required: true },
  schedule: { type: Object, required: true },
  durationMin: { type: Number, default: 0 },
});
</script>

<template>
  <article class="pass overflow-hidden sm:flex" :aria-label="`Tiket ${ticket.passenger_name}`">
    <div class="flex-1">
      <div class="ulos-band" aria-hidden="true"></div>
      <div class="p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs text-slate-500">Penumpang</p>
            <p class="text-lg font-bold text-lake-900">{{ ticket.passenger_name }}</p>
          </div>
          <span class="rounded-full bg-lake-100 px-3 py-1 text-xs font-semibold capitalize text-lake-800">{{ ticket.category }}</span>
        </div>
        <div class="mt-4 flex items-center gap-3">
          <div>
            <p class="font-display text-2xl font-extrabold text-lake-900">{{ schedule.origin }}</p>
            <p class="text-xs text-slate-500">{{ formatTime(schedule.departure_at) }} WIB</p>
          </div>
          <span class="h-px flex-1 bg-lake-300" aria-hidden="true"></span>
          <div class="text-right">
            <p class="font-display text-2xl font-extrabold text-lake-900">{{ schedule.destination }}</p>
            <p v-if="durationMin" class="text-xs text-slate-500">tiba ±{{ formatTime(addMinutes(schedule.departure_at, durationMin)) }} WIB</p>
          </div>
        </div>
        <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div><dt class="text-xs text-slate-500">Berangkat</dt><dd class="font-semibold text-lake-900">{{ formatDateTime(schedule.departure_at) }}</dd></div>
          <div><dt class="text-xs text-slate-500">Kapal</dt><dd class="font-semibold text-lake-900">{{ schedule.boat_name }}</dd></div>
          <div><dt class="text-xs text-slate-500">Tarif</dt><dd class="font-semibold text-lake-900">{{ formatRupiah(ticket.price) }}</dd></div>
          <div><dt class="text-xs text-slate-500">Kode tiket</dt><dd class="font-mono text-xs font-semibold text-lake-900">{{ ticket.code }}</dd></div>
        </dl>
      </div>
    </div>
    <div class="flex flex-col items-center justify-center gap-2 border-t-2 border-dashed border-lake-200 p-5 sm:w-48 sm:border-l-2 sm:border-t-0">
      <QrCode :value="ticket.code" :size="132" />
      <p v-if="ticket.checked_in_at" class="rounded-full bg-pine-100 px-3 py-1 text-xs font-bold text-pine-800">Sudah check-in</p>
      <p v-else class="text-xs text-slate-500">Tunjukkan saat naik kapal</p>
    </div>
  </article>
</template>
