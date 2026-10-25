<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { verifyTicket } from '@/features/tickets/api/ticketApi';
import { useAsync } from '@/hooks/useAsync';
import { formatDateTime } from '@/helpers/formatHelper';
import AppIcon from '@/features/common/components/AppIcon.vue';
import BaseButton from '@/features/common/components/BaseButton.vue';
import BaseInput from '@/features/common/components/BaseInput.vue';

const route = useRoute();
const router = useRouter();
const code = ref(String(route.params.code || ''));
const error = ref('');
const loader = useAsync(verifyTicket);

async function check() {
  error.value = '';
  const value = code.value.trim().toUpperCase();
  if (!value) {
    error.value = 'Masukkan kode tiket, contoh TK-1A2B3C4D5E6F';
    return;
  }
  const result = await loader.run(value);
  if (result && String(route.params.code || '') !== value) router.replace({ name: 'verify-ticket', params: { code: value } });
}

onMounted(() => { if (code.value) check(); });
</script>

<template>
  <section class="mx-auto max-w-xl">
    <h1 class="page-title">Cek keaslian tiket</h1>
    <p class="page-lead">Masukkan kode di bawah QR tiket untuk memastikan tiket masih berlaku. Nama penumpang disamarkan demi privasi.</p>

    <form class="card flex flex-col gap-3 sm:flex-row sm:items-end" novalidate @submit.prevent="check">
      <div class="flex-1">
        <BaseInput id="verify-code" v-model="code" label="Kode tiket" autocomplete="off" placeholder="TK-XXXXXXXXXXXX" :error="error" />
      </div>
      <BaseButton type="submit" :loading="loader.loading.value">
        <AppIcon name="search" :size="18" /> Periksa
      </BaseButton>
    </form>

    <p v-if="loader.error.value" class="mt-4 rounded-xl bg-ulos-50 px-4 py-3 font-medium text-ulos-700" role="alert">
      {{ loader.error.value }}
    </p>

    <article v-if="loader.data.value && !loader.loading.value" class="pass mt-6 overflow-hidden" aria-live="polite">
      <div class="px-6 py-5" :class="loader.data.value.valid ? 'bg-pine-50' : 'bg-ulos-50'">
        <p class="flex items-center gap-2 text-lg font-bold" :class="loader.data.value.valid ? 'text-pine-800' : 'text-ulos-700'">
          <AppIcon :name="loader.data.value.valid ? 'shield' : 'alert'" :size="22" />
          {{ loader.data.value.valid ? (loader.data.value.checked_in ? 'Tiket sah, sudah check-in' : 'Tiket sah dan belum dipakai') : 'Tiket tidak berlaku' }}
        </p>
        <p v-if="!loader.data.value.valid" class="mt-1 text-sm text-ulos-700">
          Status booking: {{ loader.data.value.booking_status === 'cancelled' ? 'dibatalkan' : 'belum dibayar' }}.
        </p>
      </div>
      <dl class="grid gap-4 px-6 py-5 sm:grid-cols-2">
        <div><dt class="text-xs text-slate-500">Rute</dt><dd class="font-semibold text-lake-900">{{ loader.data.value.origin }} → {{ loader.data.value.destination }}</dd></div>
        <div><dt class="text-xs text-slate-500">Berangkat</dt><dd class="font-semibold text-lake-900">{{ formatDateTime(loader.data.value.departure_at) }}</dd></div>
        <div><dt class="text-xs text-slate-500">Kapal</dt><dd class="font-semibold text-lake-900">{{ loader.data.value.boat_name }}</dd></div>
        <div><dt class="text-xs text-slate-500">Penumpang</dt><dd class="font-semibold capitalize text-lake-900">{{ loader.data.value.passenger_name }} ({{ loader.data.value.category }})</dd></div>
      </dl>
    </article>
  </section>
</template>
