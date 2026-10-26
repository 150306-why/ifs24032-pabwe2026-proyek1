<script setup>
import { computed, onMounted, reactive } from 'vue';
import { fetchAdminUsers } from '@/features/admin/api/adminApi';
import { useAsync } from '@/hooks/useAsync';
import { formatRupiah } from '@/helpers/formatHelper';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader.vue';
import AppIcon from '@/features/common/components/AppIcon.vue';
import AsyncState from '@/features/common/components/AsyncState.vue';
import PaginationBar from '@/features/common/components/PaginationBar.vue';
import TonePill from '@/features/common/components/TonePill.vue';

const PAGE_SIZE = 10;
const ROLES = [
  { value: '', label: 'Semua' },
  { value: 'customer', label: 'Pelanggan' },
  { value: 'admin', label: 'Admin' },
];

const filters = reactive({ role: '', q: '', page: 1 });
const loader = useAsync(() => fetchAdminUsers({
  role: filters.role || undefined,
  q: filters.q.trim() || undefined,
  page: filters.page,
  limit: PAGE_SIZE,
}));
const items = computed(() => loader.data.value?.items || []);
const pagination = computed(() => loader.data.value?.pagination);

function reload(resetPage = true) {
  if (resetPage) filters.page = 1;
  return loader.run();
}
const setRole = (value) => { filters.role = value; reload(); };
const goToPage = (page) => { filters.page = page; reload(false); };

onMounted(loader.run);
</script>

<template>
  <section>
    <AdminPageHeader title="Pengguna" lead="Akun pelanggan dan admin beserta aktivitas pemesanannya." />

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <fieldset class="m-0 flex min-w-0 gap-2 border-0 p-0" aria-label="Filter peran">
        <button v-for="r in ROLES" :key="r.value" class="chip" :aria-pressed="filters.role === r.value" @click="setRole(r.value)">{{ r.label }}</button>
      </fieldset>
      <form class="relative ml-auto w-full sm:w-72" role="search" @submit.prevent="reload()">
        <AppIcon name="search" :size="18" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input v-model="filters.q" type="search" class="input !pl-10" placeholder="Nama atau email" aria-label="Cari pengguna" />
      </form>
    </div>

    <AsyncState
      :loading="loader.loading.value && !loader.data.value"
      :error="loader.error.value"
      :empty="items.length === 0"
      empty-text="Tidak ada pengguna yang cocok."
      @retry="loader.run"
    >
      <div class="table-wrap">
        <table class="table-base">
          <caption class="sr-only">Daftar pengguna</caption>
          <thead>
            <tr><th scope="col">Nama</th><th scope="col">Email</th><th scope="col">Peran</th><th scope="col" class="text-right">Booking</th><th scope="col" class="text-right">Total belanja</th></tr>
          </thead>
          <tbody>
            <tr v-for="u in items" :key="u.id">
              <td class="font-medium">{{ u.name }}</td>
              <td class="text-slate-600">{{ u.email }}</td>
              <td><TonePill :tone="u.role === 'admin' ? 'red' : 'blue'">{{ u.role === 'admin' ? 'Admin' : 'Pelanggan' }}</TonePill></td>
              <td class="text-right">{{ u.bookings }}</td>
              <td class="whitespace-nowrap text-right font-semibold">{{ formatRupiah(u.spent) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaginationBar v-if="pagination" :page="pagination.page" :limit="pagination.limit" :total="pagination.total" @change="goToPage" />
    </AsyncState>
  </section>
</template>
