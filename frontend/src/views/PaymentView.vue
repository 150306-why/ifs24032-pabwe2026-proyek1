<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBookingStore } from '@/stores/bookings';
import { useAsync } from '@/composables/useAsync';
import { useCountdown } from '@/composables/useCountdown';
import { getErrorMessage } from '@/utils/errors';
import { formatDateTime, formatRupiah } from '@/utils/format';
import AsyncState from '@/components/AsyncState.vue';
import BaseButton from '@/components/BaseButton.vue';
import StatusBadge from '@/components/StatusBadge.vue';

const route = useRoute();
const router = useRouter();
const store = useBookingStore();
const code = route.params.code;

const loader = useAsync(() => store.load(code));
const booking = computed(() => store.current);
const countdown = useCountdown(computed(() => booking.value?.expires_at ?? null));

const paying = ref(false);
const payError = ref('');

async function pay() {
  paying.value = true;
  payError.value = '';
  try {
    await store.pay(code);
    router.replace({ name: 'booking-detail', params: { code } });
  } catch (err) {
    payError.value = getErrorMessage(err);
  } finally {
    paying.value = false;
  }
}

// Saat waktu habis, muat ulang agar status "dibatalkan" dari server tampil.
watch(() => countdown.expired.value, (expired) => { if (expired) loader.run(); });

onMounted(async () => {
  await loader.run();
  if (booking.value?.status === 'paid') router.replace({ name: 'booking-detail', params: { code } });
});
</script>

<template>
  <AsyncState :loading="loader.loading.value && !booking" :error="loader.error.value" @retry="loader.run">
    <section v-if="booking" class="card mx-auto max-w-lg space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold text-lake-900">Pembayaran</h1>
        <StatusBadge :status="booking.status" />
      </div>
      <dl class="space-y-1 text-slate-700">
        <div class="flex justify-between"><dt>Kode booking</dt><dd class="font-mono font-semibold">{{ booking.code }}</dd></div>
        <div class="flex justify-between"><dt>Rute</dt><dd>{{ booking.schedule.origin }} → {{ booking.schedule.destination }}</dd></div>
        <div class="flex justify-between"><dt>Berangkat</dt><dd>{{ formatDateTime(booking.schedule.departure_at) }}</dd></div>
        <div class="flex justify-between"><dt>Penumpang</dt><dd>{{ booking.passenger_count }}</dd></div>
        <div class="flex justify-between border-t pt-2 text-lg font-bold"><dt>Total</dt><dd class="text-pine-700">{{ formatRupiah(booking.total) }}</dd></div>
      </dl>

      <template v-if="booking.status === 'pending'">
        <p class="rounded-lg bg-amber-50 p-3 text-amber-900">
          Selesaikan dalam <strong class="font-mono text-lg" aria-live="off">{{ countdown.label.value }}</strong>
          atau booking dibatalkan otomatis.
        </p>
        <BaseButton class="w-full" :loading="paying" @click="pay">Bayar sekarang (simulasi)</BaseButton>
        <p v-if="payError" class="text-red-700" role="alert">{{ payError }}</p>
      </template>
      <p v-else-if="booking.status === 'cancelled'" class="rounded-lg bg-slate-100 p-3" role="alert">
        Booking ini dibatalkan atau sudah kadaluarsa.
        <RouterLink to="/jadwal" class="text-lake-700 underline">Cari jadwal lain</RouterLink>
      </p>
    </section>
  </AsyncState>
</template>
