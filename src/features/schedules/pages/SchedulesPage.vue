<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchPorts, fetchSchedules } from '@/features/schedules/api/catalogApi';
import { useAsync } from '@/hooks/useAsync';
import { dateInputFromToday, formatDateInput } from '@/helpers/formatHelper';
import AsyncState from '@/features/common/components/AsyncState.vue';
import PaginationBar from '@/features/common/components/PaginationBar.vue';
import RouteSearchForm from '@/features/schedules/components/RouteSearchForm.vue';
import ScheduleCard from '@/features/schedules/components/ScheduleCard.vue';

const route = useRoute();
const router = useRouter();
const schedules = useAsync(fetchSchedules);
const ports = useAsync(fetchPorts);

const items = computed(() => schedules.data.value?.items || []);
const pagination = computed(() => schedules.data.value?.pagination);
const dayChips = computed(() => Array.from({ length: 7 }, (_, i) => {
  const value = dateInputFromToday(i);
  return { value, label: i === 0 ? 'Hari ini' : formatDateInput(value) };
}));
const portName = (id) => (ports.data.value || []).find((p) => String(p.id) === String(id))?.name;
const heading = computed(() => {
  const { origin, destination } = route.query;
  const from = portName(origin);
  const to = portName(destination);
  return from && to ? `${from} → ${to}` : 'Jadwal tersedia';
});

const load = () => schedules.run({ ...route.query, limit: 10 });
watch(() => route.query, load, { immediate: true });
onMounted(ports.run);

const search = (query) => router.push({ query });
const pickDate = (date) => router.push({ query: { ...route.query, date, page: undefined } });
const goToPage = (page) => router.push({ query: { ...route.query, page } });
</script>

<template>
  <section>
    <h1 class="page-title">{{ heading }}</h1>
    <p class="page-lead !mb-5">Pilih keberangkatan, lalu isi data penumpang di langkah berikutnya.</p>

    <div class="card mb-5 !p-4 sm:!p-5">
      <RouteSearchForm :ports="ports.data.value || []" :initial="route.query" submit-label="Ubah pencarian" @search="search" />
    </div>

    <fieldset v-if="route.query.date" class="m-0 mb-5 flex min-w-0 gap-2 overflow-x-auto border-0 p-0 pb-1" aria-label="Pilih tanggal cepat">
      <button v-for="d in dayChips" :key="d.value" class="chip shrink-0" :aria-pressed="route.query.date === d.value" @click="pickDate(d.value)">{{ d.label }}</button>
    </fieldset>

    <AsyncState
      :loading="schedules.loading.value"
      :error="schedules.error.value"
      :empty="items.length === 0"
      empty-text="Belum ada jadwal untuk pencarian ini. Coba tanggal atau rute lain."
      @retry="load"
    >
      <ul class="space-y-3">
        <li v-for="s in items" :key="s.id"><ScheduleCard :schedule="s" /></li>
      </ul>
      <PaginationBar v-if="pagination" :page="pagination.page" :limit="pagination.limit" :total="pagination.total" @change="goToPage" />
    </AsyncState>
  </section>
</template>
