<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBookingStore } from '@/features/bookings/states/bookingsStore';
import { useToastStore } from '@/features/common/states/toastStore';
import { useAsync } from '@/hooks/useAsync';
import { useCountdown } from '@/hooks/useCountdown';
import { getErrorMessage } from '@/helpers/errorHelper';
import { formatDateTime, formatRupiah } from '@/helpers/formatHelper';
import AppIcon from '@/features/common/components/AppIcon.vue';
import AsyncState from '@/features/common/components/AsyncState.vue';
import BaseButton from '@/features/common/components/BaseButton.vue';
import StatusBadge from '@/features/bookings/components/StatusBadge.vue';

const route = useRoute();
const router = useRouter();
const store = useBookingStore();
const toast = useToastStore();
const code = route.params.code;

const loader = useAsync(() => store.load(code));
const booking = computed(() => store.current);
const countdown = useCountdown(computed(() => booking.value?.expires_at ?? null));

const METHODS = [
  { value: 'qris', label: 'QRIS', hint: 'Scan dari aplikasi e-wallet atau mobile banking' },
  { value: 'va', label: 'Virtual account', hint: 'Transfer dari bank mana pun' },
  { value: 'ewallet', label: 'E-wallet', hint: 'Bayar lewat saldo e-wallet' },
];
const method = ref('qris');

const paying = ref(false);
const payError = ref('');

async function pay() {
  paying.value = true;
  payError.value = '';
  try {
    await store.pay(code);
    toast.success('Pembayaran berhasil. Tiket Anda sudah terbit.');
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
    <section v-if="booking" class="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1fr_20rem] md:items-start">
      <div class="card space-y-5">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-extrabold text-lake-900">Pembayaran</h1>
          <StatusBadge :status="booking.status" />
        </div>

        <template v-if="booking.status === 'pending'">
          <div class="flex items-center gap-4 rounded-2xl bg-gold-100 p-4 text-gold-600">
            <AppIcon name="clock" :size="28" />
            <p class="text-sm">
              Selesaikan dalam <strong class="font-mono text-2xl text-lake-950" aria-live="off">{{ countdown.label.value }}</strong>
              atau booking dibatalkan otomatis.
            </p>
          </div>

          <fieldset>
            <legend class="mb-2 text-sm font-semibold text-lake-900">Metode pembayaran (simulasi)</legend>
            <div class="space-y-2">
              <label
                v-for="m in METHODS"
                :key="m.value"
                class="flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition"
                :class="method === m.value ? 'border-lake-700 bg-lake-50' : 'border-lake-100 hover:border-lake-300'"
              >
                <input v-model="method" type="radio" name="method" :value="m.value" class="h-4 w-4 text-lake-800" />
                <span><span class="block font-semibold text-lake-900">{{ m.label }}</span><span class="block text-xs text-slate-500">{{ m.hint }}</span></span>
              </label>
            </div>
          </fieldset>

          <BaseButton variant="accent" size="lg" class="w-full" :loading="paying" @click="pay">Bayar sekarang (simulasi)</BaseButton>
          <p v-if="payError" class="text-sm font-medium text-ulos-700" role="alert">{{ payError }}</p>
        </template>
        <p v-else-if="booking.status === 'cancelled'" class="rounded-2xl bg-slate-100 p-4" role="alert">
          Booking ini dibatalkan atau sudah kadaluarsa.
          <RouterLink to="/jadwal" class="link">Cari jadwal lain</RouterLink>
        </p>
      </div>

      <aside class="pass overflow-hidden md:sticky md:top-24">
        <div class="ulos-band ulos-band-thin" aria-hidden="true"></div>
        <dl class="space-y-2 p-5 text-sm text-slate-600">
          <div class="flex justify-between"><dt>Kode booking</dt><dd class="font-mono font-semibold text-lake-900">{{ booking.code }}</dd></div>
          <div class="flex justify-between gap-3"><dt>Rute</dt><dd class="text-right font-semibold text-lake-900">{{ booking.schedule.origin }} → {{ booking.schedule.destination }}</dd></div>
          <div class="flex justify-between gap-3"><dt>Berangkat</dt><dd class="text-right font-semibold text-lake-900">{{ formatDateTime(booking.schedule.departure_at) }}</dd></div>
          <div class="flex justify-between"><dt>Penumpang</dt><dd class="font-semibold text-lake-900">{{ booking.passenger_count }}</dd></div>
        </dl>
        <div class="pass-divider mx-5"></div>
        <div class="flex items-baseline justify-between p-5">
          <p class="font-semibold text-lake-900">Total</p>
          <p class="font-display text-3xl font-extrabold text-pine-700">{{ formatRupiah(booking.total) }}</p>
        </div>
      </aside>
    </section>
  </AsyncState>
</template>
