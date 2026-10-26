<script setup>
import { ref } from 'vue';
import { checkInTicket } from '@/features/admin/api/adminApi';
import { getErrorMessage } from '@/helpers/errorHelper';
import { formatDateTime, formatTime } from '@/helpers/formatHelper';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader.vue';
import AppIcon from '@/features/common/components/AppIcon.vue';
import BaseButton from '@/features/common/components/BaseButton.vue';
import BaseInput from '@/features/common/components/BaseInput.vue';

const code = ref('');
const loading = ref(false);
const error = ref('');
const result = ref(null);
const history = ref([]); // riwayat check-in pada sesi ini, terbaru di atas

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
    history.value = [{ ...result.value, at: new Date().toISOString() }, ...history.value].slice(0, 10);
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
    <AdminPageHeader title="Check-in tiket" lead="Scan kode QR penumpang di pelabuhan atau ketik kodenya." />

    <div class="grid gap-6 lg:grid-cols-5">
      <div class="space-y-4 lg:col-span-3">
        <form class="card space-y-4" novalidate @submit.prevent="submit">
          <BaseInput id="ticket-code" v-model="code" label="Kode tiket (contoh: TK-1A2B3C4D5E6F)" autocomplete="off" autofocus placeholder="Scan atau ketik kode…" />
          <BaseButton type="submit" size="lg" :loading="loading"><AppIcon name="scan" :size="20" /> Check-in</BaseButton>
        </form>

        <p v-if="error" class="flex items-start gap-3 rounded-2xl border border-ulos-200 bg-ulos-50 p-4 font-medium text-ulos-700" role="alert">
          <AppIcon name="alert" :size="22" class="mt-0.5" /> {{ error }}
        </p>
        <output v-if="result" class="block rounded-2xl border border-pine-100 bg-pine-50 p-5 text-pine-800">
          <p class="flex items-center gap-2 text-lg font-bold"><AppIcon name="check" :size="22" /> Check-in berhasil</p>
          <p class="mt-2 text-lg font-semibold text-lake-900">{{ result.passenger_name }} <span class="text-sm font-medium capitalize text-slate-600">({{ result.category }})</span></p>
          <p>{{ result.origin }} → {{ result.destination }}</p>
          <p class="text-sm">{{ formatDateTime(result.departure_at) }}</p>
        </output>
      </div>

      <div class="card lg:col-span-2">
        <h2 class="mb-3 text-lg font-bold text-lake-900">Riwayat sesi ini</h2>
        <p v-if="history.length === 0" class="rounded-xl bg-lake-50 px-4 py-6 text-center text-sm text-slate-600">Belum ada check-in. Tiket yang berhasil akan muncul di sini.</p>
        <ul v-else class="divide-y divide-lake-50">
          <li v-for="h in history" :key="h.code + h.at" class="flex items-center justify-between gap-3 py-2.5 text-sm">
            <div class="min-w-0">
              <p class="truncate font-semibold text-lake-900">{{ h.passenger_name }}</p>
              <p class="truncate text-xs text-slate-500">{{ h.origin }} → {{ h.destination }}</p>
            </div>
            <span class="shrink-0 font-mono text-xs text-slate-500">{{ formatTime(h.at) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
