<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useBookingStore } from '@/features/bookings/states/bookingsStore';
import { useToastStore } from '@/features/common/states/toastStore';
import { useAsync } from '@/hooks/useAsync';
import { getErrorMessage } from '@/helpers/errorHelper';
import { formatDateTime, formatRupiah } from '@/helpers/formatHelper';
import AppIcon from '@/features/common/components/AppIcon.vue';
import AsyncState from '@/features/common/components/AsyncState.vue';
import BaseButton from '@/features/common/components/BaseButton.vue';
import BoardingPass from '@/features/bookings/components/BoardingPass.vue';
import StatusBadge from '@/features/bookings/components/StatusBadge.vue';

const route = useRoute();
const store = useBookingStore();
const toast = useToastStore();
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
    toast.success('Booking dibatalkan');
  } catch (err) {
    cancelError.value = getErrorMessage(err);
  } finally {
    cancelling.value = false;
  }
}

const print = () => window.print();

onMounted(loader.run);
</script>

<template>
  <AsyncState :loading="loader.loading.value && !booking" :error="loader.error.value" @retry="loader.run">
    <section v-if="booking" class="space-y-6">
      <div class="card">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="font-mono text-xs text-slate-500">Kode booking {{ booking.code }}</p>
            <h1 class="text-2xl font-extrabold text-lake-900">{{ booking.schedule.origin }} → {{ booking.schedule.destination }}</h1>
            <p class="mt-1 text-slate-600">{{ formatDateTime(booking.schedule.departure_at) }} · {{ booking.schedule.boat_name }}</p>
          </div>
          <div class="text-right">
            <StatusBadge :status="booking.status" />
            <p class="mt-2 font-display text-2xl font-extrabold text-pine-700">{{ formatRupiah(booking.total) }}</p>
            <p class="text-xs text-slate-500">{{ booking.passenger_count }} penumpang</p>
          </div>
        </div>

        <div class="no-print mt-5 flex flex-wrap gap-2 border-t border-lake-100 pt-4">
          <RouterLink v-if="booking.status === 'pending'" :to="{ name: 'payment', params: { code } }" class="inline-flex items-center rounded-xl bg-ulos-600 px-4 py-2.5 font-semibold text-white hover:bg-ulos-700">
            Lanjut bayar
          </RouterLink>
          <BaseButton v-if="booking.status === 'paid'" variant="primary" @click="print"><AppIcon name="printer" :size="18" /> Cetak tiket</BaseButton>
          <BaseButton v-if="booking.status !== 'cancelled'" variant="danger" :loading="cancelling" @click="cancel">Batalkan</BaseButton>
          <RouterLink to="/tiket-saya" class="inline-flex items-center rounded-xl px-4 py-2.5 font-semibold text-lake-800 hover:bg-lake-100">Semua tiket</RouterLink>
        </div>
        <p v-if="cancelError" class="mt-3 text-sm font-medium text-ulos-700" role="alert">{{ cancelError }}</p>
      </div>

      <p v-if="booking.status !== 'paid'" class="card flex items-start gap-3 text-slate-700">
        <AppIcon name="qr" :size="22" class="mt-0.5 text-lake-700" />
        Kode QR tiket tersedia setelah pembayaran berhasil.
      </p>

      <ul v-else class="space-y-5">
        <li v-for="t in booking.tickets" :key="t.code">
          <BoardingPass :ticket="t" :schedule="booking.schedule" />
        </li>
      </ul>
    </section>
  </AsyncState>
</template>
