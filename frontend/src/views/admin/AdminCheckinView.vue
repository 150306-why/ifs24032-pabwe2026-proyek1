<script setup>
import { ref } from 'vue';
import { checkInTicket } from '@/api/admin';
import { getErrorMessage } from '@/utils/errors';
import { formatDateTime } from '@/utils/format';
import AdminNav from '@/components/AdminNav.vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseInput from '@/components/BaseInput.vue';

const code = ref('');
const loading = ref(false);
const error = ref('');
const result = ref(null);

/** Alat scanner barcode/QR USB bekerja sebagai keyboard, jadi cukup fokus ke kolom ini lalu scan. */
async function submit() {
  error.value = '';
  result.value = null;
  if (!code.value.trim()) {
    error.value = 'Masukkan atau scan kode tiket';
    return;
  }
  loading.value = true;
  try {
    result.value = await checkInTicket(code.value.trim().toUpperCase());
    code.value = '';
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section>
    <AdminNav />
    <h1 class="page-title">Check-in tiket</h1>
    <form class="card max-w-lg space-y-4" novalidate @submit.prevent="submit">
      <BaseInput id="ticket-code" v-model="code" label="Kode tiket (contoh: TK-1A2B3C4D5E6F)" autocomplete="off" autofocus />
      <BaseButton type="submit" :loading="loading">Check-in</BaseButton>
      <p v-if="error" class="rounded-lg bg-red-50 p-3 text-red-800" role="alert">{{ error }}</p>
      <div v-if="result" class="rounded-lg bg-pine-50 p-3 text-pine-800" role="status">
        <p class="font-semibold">Check-in berhasil</p>
        <p>{{ result.passenger_name }} ({{ result.category }}) · {{ result.origin }} → {{ result.destination }}</p>
        <p class="text-sm">{{ formatDateTime(result.departure_at) }}</p>
      </div>
    </form>
  </section>
</template>
