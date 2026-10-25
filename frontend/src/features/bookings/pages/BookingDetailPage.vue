<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useBookingStore } from '@/features/bookings/states/bookingsStore';
import { useAsync } from '@/hooks/useAsync';
import { getErrorMessage } from '@/helpers/errorHelper';
import { formatDateTime, formatRupiah } from '@/helpers/formatHelper';
import AsyncState from '@/features/common/components/AsyncState.vue';
import BaseButton from '@/features/common/components/BaseButton.vue';
import QrCode from '@/features/bookings/components/QrCode.vue';
import StatusBadge from '@/features/bookings/components/StatusBadge.vue';

const route = useRoute();
const store = useBookingStore();
const code = route.params.code;
const loader = useAsync(() => store.load(code));
const booking = computed(() => store.current);

const cancelling = ref(false);
const cancelError = ref('');

async function cancel() {
  if (!window.confirm('Batalkan booking ini?')) return;
  cancelling.value = true;
  cancelError.value = '';
  try {
    await store.cancel(code);
  } catch (err) {
    cancelError.value = getErrorMessage(err);
  } finally {
    cancelling.value = false;
  }
}

onMounted(loader.run);
</script>

<template>
  <AsyncState :loading="loader.loading.value && !booking" :error="loader.error.value" @retry="loader.run">
    <section v-if="booking" class="space-y-4">
      <div class="card">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h1 class="text-xl font-bold text-lake-900">{{ booking.schedule.origin }} → {{ booking.schedule.destination }}</h1>
          <StatusBadge :status="booking.status" />
        </div>
        <p class="text-slate-700">{{ formatDateTime(booking.schedule.departure_at) }} · {{ booking.schedule.boat_name }}</p>
        <p class="font-mono text-sm text-slate-600">Kode booking {{ booking.code }} · Total {{ formatRupiah(booking.total) }}</p>

        <div class="mt-3 flex flex-wrap gap-2">
          <RouterLink v-if="booking.status === 'pending'" :to="{ name: 'payment', params: { code } }" class="rounded-lg bg-lake-700 px-4 py-2 text-white hover:bg-lake-800">
            Lanjut bayar
          </RouterLink>
          <BaseButton v-if="booking.status !== 'cancelled'" variant="danger" :loading="cancelling" @click="cancel">Batalkan</BaseButton>
        </div>
        <p v-if="cancelError" class="mt-2 text-red-700" role="alert">{{ cancelError }}</p>
      </div>

      <p v-if="booking.status !== 'paid'" class="card text-slate-700">
        Kode QR tiket tersedia setelah pembayaran berhasil.
      </p>

      <ul v-else class="grid gap-4 sm:grid-cols-2">
        <li v-for="t in booking.tickets" :key="t.code" class="card flex items-center gap-4">
          <QrCode :value="t.code" :size="120" />
          <div>
            <p class="font-semibold text-lake-900">{{ t.passenger_name }}</p>
            <p class="text-sm capitalize text-slate-700">{{ t.category }} · {{ formatRupiah(t.price) }}</p>
            <p class="font-mono text-xs text-slate-600">{{ t.code }}</p>
            <p v-if="t.checked_in_at" class="text-sm font-medium text-pine-700">Sudah check-in</p>
          </div>
        </li>
      </ul>
    </section>
  </AsyncState>
</template>
