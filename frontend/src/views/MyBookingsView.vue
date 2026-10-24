<script setup>
import { computed, onMounted } from 'vue';
import { useBookingStore } from '@/stores/bookings';
import { useAsync } from '@/composables/useAsync';
import { formatDateTime, formatRupiah } from '@/utils/format';
import AsyncState from '@/components/AsyncState.vue';
import StatusBadge from '@/components/StatusBadge.vue';

const store = useBookingStore();
const loader = useAsync(() => store.loadList());
const list = computed(() => store.list);

onMounted(loader.run);
</script>

<template>
  <section>
    <h1 class="page-title">Tiket saya</h1>
    <AsyncState
      :loading="loader.loading.value"
      :error="loader.error.value"
      :empty="list.length === 0"
      empty-text="Belum ada pesanan. Cari jadwal untuk mulai memesan."
      @retry="loader.run"
    >
      <ul class="space-y-3">
        <li v-for="b in list" :key="b.code" class="card flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="font-mono text-sm text-slate-600">{{ b.code }}</p>
            <p class="font-semibold text-lake-900">{{ b.schedule.origin }} → {{ b.schedule.destination }}</p>
            <p class="text-sm text-slate-700">{{ formatDateTime(b.schedule.departure_at) }} · {{ b.passenger_count }} penumpang · {{ formatRupiah(b.total) }}</p>
          </div>
          <div class="flex items-center gap-3">
            <StatusBadge :status="b.status" />
            <RouterLink
              :to="b.status === 'pending' ? { name: 'payment', params: { code: b.code } } : { name: 'booking-detail', params: { code: b.code } }"
              class="rounded-lg border border-lake-700 px-3 py-1 text-lake-800 hover:bg-lake-50 focus:outline-none focus:ring-2 focus:ring-lake-500"
            >
              {{ b.status === 'pending' ? 'Bayar' : 'Lihat tiket' }}
            </RouterLink>
          </div>
        </li>
      </ul>
    </AsyncState>
  </section>
</template>
