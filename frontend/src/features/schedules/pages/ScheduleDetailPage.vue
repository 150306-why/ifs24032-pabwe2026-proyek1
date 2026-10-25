<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchSchedule } from '@/features/schedules/api/catalogApi';
import { useAsync } from '@/hooks/useAsync';
import { usePassengerForm } from '@/hooks/usePassengerForm';
import { useAuthStore } from '@/features/auth/states/authStore';
import { useBookingStore } from '@/features/bookings/states/bookingsStore';
import { getErrorMessage } from '@/helpers/errorHelper';
import { formatDateTime, formatDuration, formatRupiah } from '@/helpers/formatHelper';
import AsyncState from '@/features/common/components/AsyncState.vue';
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
    <section v-if="schedule.data.value" class="space-y-4">
      <div class="card">
        <p class="text-sm text-slate-600">{{ schedule.data.value.boat.name }}</p>
        <h1 class="text-2xl font-bold text-lake-900">
          {{ schedule.data.value.route.origin.name }} → {{ schedule.data.value.route.destination.name }}
        </h1>
        <p class="text-slate-700">
          {{ formatDateTime(schedule.data.value.departure_at) }} · {{ formatDuration(schedule.data.value.duration_min) }}
        </p>
        <p class="mt-2 text-sm text-slate-700">
          Dewasa {{ formatRupiah(fares.dewasa) }} · Anak {{ formatRupiah(fares.anak) }} · Sisa {{ seatsLeft }} kursi
        </p>
      </div>

      <p v-if="!bookable" class="card border-amber-300 text-amber-900" role="alert">Jadwal ini sudah tidak bisa dipesan.</p>

      <form v-else class="card space-y-4" novalidate @submit.prevent="submit">
        <h2 class="text-lg font-semibold text-lake-900">Data penumpang</h2>
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

        <div class="flex items-center justify-between border-t pt-4">
          <div>
            <p class="text-sm text-slate-600">Total (estimasi)</p>
            <p class="text-2xl font-bold text-pine-700" aria-live="polite">{{ formatRupiah(form.total.value) }}</p>
          </div>
          <BaseButton type="submit" :loading="submitting">
            {{ auth.isAuthenticated ? 'Pesan sekarang' : 'Masuk untuk memesan' }}
          </BaseButton>
        </div>
        <p v-if="submitError" class="text-red-700" role="alert">{{ submitError }}</p>
      </form>
    </section>
  </AsyncState>
</template>
