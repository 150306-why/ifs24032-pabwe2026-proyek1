<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { fetchAdminBookings } from '@/features/admin/api/adminApi';
import { cancelBooking } from '@/features/bookings/api/bookingApi';
import { useAsync } from '@/hooks/useAsync';
import { getErrorMessage } from '@/helpers/errorHelper';
import { formatDateTime, formatRupiah } from '@/helpers/formatHelper';
import { useToastStore } from '@/features/common/states/toastStore';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader.vue';
import AppIcon from '@/features/common/components/AppIcon.vue';
import AsyncState from '@/features/common/components/AsyncState.vue';
import PaginationBar from '@/features/common/components/PaginationBar.vue';
import StatusBadge from '@/features/bookings/components/StatusBadge.vue';

const PAGE_SIZE = 10;
const FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'paid', label: 'Lunas' },
  { value: 'pending', label: 'Menunggu bayar' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

const toast = useToastStore();
const filters = reactive({ status: '', q: '', page: 1 });
const loader = useAsync(() => fetchAdminBookings({
  status: filters.status || undefined,
  q: filters.q.trim() || undefined,
  page: filters.page,
  limit: PAGE_SIZE,
}));
const items = computed(() => loader.data.value?.items || []);
const pagination = computed(() => loader.data.value?.pagination);
const actionError = ref('');
const busyCode = ref('');

function reload(resetPage = true) {
  if (resetPage) filters.page = 1;
  return loader.run();
}
const setStatus = (value) => { filters.status = value; reload(); };
const goToPage = (page) => { filters.page = page; reload(false); };

async function cancel(booking) {
  if (!window.confirm(`Batalkan booking ${booking.code}? Kursi akan dikembalikan.`)) return;
  actionError.value = '';
  busyCode.value = booking.code;
  try {
    await cancelBooking(booking.code);
    toast.success(`Booking ${booking.code} dibatalkan`);
    await reload(false);
  } catch (err) {
    actionError.value = getErrorMessage(err);
  } finally {
    busyCode.value = '';
  }
}

onMounted(loader.run);
</script>

<template>
  <section>
    <AdminPageHeader title="Booking" lead="Semua pesanan dari seluruh pelanggan." />

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Filter status">
        <button v-for="f in FILTERS" :key="f.value" class="chip" :aria-pressed="filters.status === f.value" @click="setStatus(f.value)">{{ f.label }}</button>
      </div>
      <form class="relative ml-auto w-full sm:w-72" role="search" @submit.prevent="reload()">
        <AppIcon name="search" :size="18" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input v-model="filters.q" type="search" class="input !pl-10" placeholder="Kode, nama, atau email" aria-label="Cari booking" />
      </form>
    </div>

    <p v-if="actionError" class="mb-3 rounded-xl bg-ulos-50 px-4 py-3 font-medium text-ulos-700" role="alert">{{ actionError }}</p>

    <AsyncState
      :loading="loader.loading.value && !loader.data.value"
      :error="loader.error.value"
      :empty="items.length === 0"
      empty-text="Tidak ada booking yang cocok."
      @retry="loader.run"
    >
      <div class="table-wrap">
        <table class="table-base">
          <caption class="sr-only">Daftar booking</caption>
          <thead>
            <tr>
              <th scope="col">Kode</th><th scope="col">Pelanggan</th><th scope="col">Perjalanan</th>
              <th scope="col">Total</th><th scope="col">Status</th><th scope="col" class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in items" :key="b.code">
              <td class="whitespace-nowrap font-mono text-xs font-semibold text-lake-900">{{ b.code }}</td>
              <td><p class="font-medium">{{ b.customer.name }}</p><p class="text-xs text-slate-500">{{ b.customer.email }}</p></td>
              <td>
                <p class="font-medium">{{ b.schedule.origin }} → {{ b.schedule.destination }}</p>
                <p class="text-xs text-slate-500">{{ formatDateTime(b.schedule.departure_at) }} · {{ b.passenger_count }} penumpang</p>
              </td>
              <td class="whitespace-nowrap font-semibold">{{ formatRupiah(b.total) }}</td>
              <td><StatusBadge :status="b.status" /></td>
              <td class="whitespace-nowrap text-right">
                <RouterLink :to="{ name: 'booking-detail', params: { code: b.code } }" class="mr-1 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold text-lake-700 hover:bg-lake-100">
                  <AppIcon name="eye" :size="15" /> Detail
                </RouterLink>
                <button
                  v-if="b.status !== 'cancelled'"
                  class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold text-ulos-700 hover:bg-ulos-50 disabled:opacity-50"
                  :disabled="busyCode === b.code"
                  @click="cancel(b)"
                >
                  <AppIcon name="x" :size="15" /> Batalkan
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaginationBar v-if="pagination" :page="pagination.page" :limit="pagination.limit" :total="pagination.total" @change="goToPage" />
    </AsyncState>
  </section>
</template>
