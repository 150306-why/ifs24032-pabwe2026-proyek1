<script setup>
import { computed, onMounted, ref } from 'vue';
import { useBookingStore } from '@/features/bookings/states/bookingsStore';
import { useAsync } from '@/hooks/useAsync';
import { formatDateTime, formatRupiah } from '@/helpers/formatHelper';
import AppIcon from '@/features/common/components/AppIcon.vue';
import AsyncState from '@/features/common/components/AsyncState.vue';
import StatusBadge from '@/features/bookings/components/StatusBadge.vue';

const store = useBookingStore();
const loader = useAsync(() => store.loadList());
const list = computed(() => store.list);

const FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'pending', label: 'Menunggu bayar' },
  { value: 'paid', label: 'Lunas' },
  { value: 'cancelled', label: 'Dibatalkan' },
];
const filter = ref('');
const countOf = (value) => (value ? list.value.filter((b) => b.status === value).length : list.value.length);
const visible = computed(() => (filter.value ? list.value.filter((b) => b.status === filter.value) : list.value));

onMounted(loader.run);
</script>

<template>
  <section>
    <h1 class="page-title">Tiket saya</h1>
    <p class="page-lead">Semua pesanan Anda. Buka pesanan yang sudah lunas untuk menampilkan kode QR.</p>

    <AsyncState
      :loading="loader.loading.value"
      :error="loader.error.value"
      :empty="list.length === 0"
      empty-text="Belum ada pesanan. Cari jadwal untuk mulai memesan."
      @retry="loader.run"
    >
      <template #empty-action>
        <RouterLink to="/jadwal" class="mt-4 inline-flex rounded-xl bg-ulos-600 px-5 py-2.5 font-semibold text-white hover:bg-ulos-700">Cari jadwal</RouterLink>
      </template>

      <fieldset class="m-0 mb-4 flex min-w-0 flex-wrap gap-2 border-0 p-0" aria-label="Filter status">
        <button v-for="f in FILTERS" :key="f.value" class="chip" :aria-pressed="filter === f.value" @click="filter = f.value">
          {{ f.label }} <span class="opacity-70">{{ countOf(f.value) }}</span>
        </button>
      </fieldset>

      <p v-if="visible.length === 0" class="card-flat px-6 py-10 text-center text-slate-600">Tidak ada pesanan dengan status ini.</p>
      <ul v-else class="space-y-3">
        <li v-for="b in visible" :key="b.code" class="card-flat flex flex-wrap items-center justify-between gap-4 p-5 transition hover:border-lake-300 hover:shadow-lift">
          <div class="flex items-center gap-4">
            <span class="hidden h-12 w-12 items-center justify-center rounded-xl bg-lake-900 text-gold-300 sm:flex"><AppIcon name="ticket" :size="22" /></span>
            <div>
              <p class="font-mono text-xs text-slate-500">{{ b.code }}</p>
              <p class="text-lg font-bold text-lake-900">{{ b.schedule.origin }} → {{ b.schedule.destination }}</p>
              <p class="text-sm text-slate-600">{{ formatDateTime(b.schedule.departure_at) }} · {{ b.passenger_count }} penumpang · {{ formatRupiah(b.total) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <StatusBadge :status="b.status" />
            <RouterLink
              :to="b.status === 'pending' ? { name: 'payment', params: { code: b.code } } : { name: 'booking-detail', params: { code: b.code } }"
              class="rounded-xl px-4 py-2 font-semibold transition"
              :class="b.status === 'pending' ? 'bg-ulos-600 text-white hover:bg-ulos-700' : 'border border-lake-200 text-lake-800 hover:border-lake-600 hover:bg-lake-50'"
            >
              {{ b.status === 'pending' ? 'Bayar' : 'Lihat tiket' }}
            </RouterLink>
          </div>
        </li>
      </ul>
    </AsyncState>
  </section>
</template>
