<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchSchedule } from '@/features/schedules/api/catalogApi';
import { useAsync } from '@/hooks/useAsync';
import { usePassengerForm } from '@/hooks/usePassengerForm';
import { useAuthStore } from '@/features/auth/states/authStore';
import { useBookingStore } from '@/features/bookings/states/bookingsStore';
import { getErrorMessage } from '@/helpers/errorHelper';
import {
  addMinutes, formatDateTime, formatDuration, formatRupiah, formatTime,
} from '@/helpers/formatHelper';
import AsyncState from '@/features/common/components/AsyncState.vue';
import AppIcon from '@/features/common/components/AppIcon.vue';
import BaseButton from '@/features/common/components/BaseButton.vue';
import PassengerRow from '@/features/bookings/components/PassengerRow.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const bookings = useBookingStore();

const schedule = useAsync(() => fetchSchedule(route.params.id));
const fares = computed(() => schedule.data.value?.fares);
const seatsLeft = computed(() => schedule.data.value?.seats_left ?? 0);
const form = usePassengerForm(fares, seatsLeft);

const submitting = ref(false);
const submitError = ref('');
const bookable = computed(() => schedule.data.value?.status === 'open' && seatsLeft.value > 0);

async function submit() {
  submitError.value = '';
  if (!auth.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } });
    return;
  }
  if (!form.isValid.value) {
    submitError.value = 'Nama setiap penumpang minimal 2 karakter.';
    return;
  }
  submitting.value = true;
  try {
    const booking = await bookings.create(schedule.data.value.id, form.payload());
    router.push({ name: 'payment', params: { code: booking.code } });
  } catch (err) {
    submitError.value = getErrorMessage(err);
  } finally {
    submitting.value = false;
  }
}

onMounted(schedule.run);
</script>

<template>
  <AsyncState :loading="schedule.loading.value" :error="schedule.error.value" @retry="schedule.run">
    <section v-if="schedule.data.value" class="space-y-6">
      <div>
        <RouterLink to="/jadwal" class="link mb-3 inline-block text-sm">Kembali ke jadwal</RouterLink>
        <h1 class="page-title !mb-1">
          {{ schedule.data.value.route.origin.name }} → {{ schedule.data.value.route.destination.name }}
        </h1>
        <p class="text-slate-600">
          {{ formatDateTime(schedule.data.value.departure_at) }} · {{ schedule.data.value.boat.name }}
        </p>
      </div>

      <p v-if="!bookable" class="card border-gold-300 bg-gold-100 font-medium text-gold-600" role="alert">Jadwal ini sudah tidak bisa dipesan.</p>

      <form v-else class="grid gap-6 lg:grid-cols-[1fr_21rem] lg:items-start" novalidate @submit.prevent="submit">
        <div class="card space-y-4">
          <h2 class="text-lg font-bold text-lake-900">Data penumpang</h2>
          <PassengerRow
            v-for="(p, i) in form.passengers.value"
            :key="p.id"
            v-model:name="p.name"
            v-model:category="p.category"
            :index="i"
            :can-remove="form.passengers.value.length > 1"
            @remove="form.remove(p.id)"
          />
          <BaseButton variant="secondary" :disabled="!form.canAdd.value" @click="form.add">+ Tambah penumpang</BaseButton>
          <p v-if="!form.canAdd.value" class="text-sm text-slate-600">Batas maksimal {{ form.maxAllowed.value }} penumpang.</p>
        </div>

        <aside class="pass overflow-hidden lg:sticky lg:top-24">
          <div class="ulos-band ulos-band-thin" aria-hidden="true"></div>
          <div class="p-5">
            <div class="flex items-center justify-between gap-2">
              <div>
                <p class="font-display text-2xl font-extrabold text-lake-900">{{ formatTime(schedule.data.value.departure_at) }}</p>
                <p class="text-xs text-slate-500">{{ schedule.data.value.route.origin.name }}</p>
              </div>
              <div class="flex flex-1 flex-col items-center text-xs text-slate-500" aria-hidden="true">
                <AppIcon name="ship" :size="18" class="text-lake-700" />
                {{ formatDuration(schedule.data.value.duration_min) }}
              </div>
              <div class="text-right">
                <p class="font-display text-2xl font-extrabold text-lake-900">{{ formatTime(addMinutes(schedule.data.value.departure_at, schedule.data.value.duration_min)) }}</p>
                <p class="text-xs text-slate-500">{{ schedule.data.value.route.destination.name }}</p>
              </div>
            </div>
            <dl class="mt-4 space-y-1.5 text-sm text-slate-600">
              <div class="flex justify-between"><dt>Tarif dewasa</dt><dd class="font-semibold text-lake-900">Dewasa {{ formatRupiah(fares.dewasa) }}</dd></div>
              <div class="flex justify-between"><dt>Tarif anak</dt><dd class="font-semibold text-lake-900">Anak {{ formatRupiah(fares.anak) }}</dd></div>
              <div class="flex justify-between"><dt>Ketersediaan</dt><dd class="font-semibold" :class="seatsLeft <= 5 ? 'text-ulos-700' : 'text-lake-900'">Sisa {{ seatsLeft }} kursi</dd></div>
            </dl>
          </div>
          <div class="pass-divider mx-5"></div>
          <div class="p-5">
            <p class="text-sm text-slate-600">Total (estimasi)</p>
            <p class="font-display text-3xl font-extrabold text-pine-700" aria-live="polite">{{ formatRupiah(form.total.value) }}</p>
            <BaseButton type="submit" variant="accent" size="lg" class="mt-4 w-full" :loading="submitting">
              {{ auth.isAuthenticated ? 'Pesan sekarang' : 'Masuk untuk memesan' }}
            </BaseButton>
            <p v-if="submitError" class="mt-3 text-sm font-medium text-ulos-700" role="alert">{{ submitError }}</p>
            <p class="mt-3 text-xs text-slate-500">Harga final dihitung server. Booking ditahan 15 menit untuk pembayaran.</p>
          </div>
        </aside>
      </form>
    </section>
  </AsyncState>
</template>
