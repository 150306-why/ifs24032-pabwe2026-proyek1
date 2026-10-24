<script setup>
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchSchedules } from '@/api/catalog';
import { useAsync } from '@/composables/useAsync';
import AsyncState from '@/components/AsyncState.vue';
import ScheduleCard from '@/components/ScheduleCard.vue';

const route = useRoute();
const router = useRouter();
const schedules = useAsync(fetchSchedules);

const items = computed(() => schedules.data.value?.items || []);
const pagination = computed(() => schedules.data.value?.pagination);
const hasNext = computed(() => pagination.value && pagination.value.page * pagination.value.limit < pagination.value.total);

const load = () => schedules.run({ ...route.query, limit: 10 });
watch(() => route.query, load, { immediate: true });

function goToPage(page) {
  router.push({ query: { ...route.query, page } });
}
</script>

<template>
  <section>
    <h1 class="page-title">Jadwal tersedia</h1>
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
      <div v-if="pagination" class="mt-4 flex items-center justify-between">
        <button class="rounded-lg border border-lake-700 px-3 py-1 text-lake-800 disabled:opacity-50" :disabled="pagination.page <= 1" @click="goToPage(pagination.page - 1)">
          Sebelumnya
        </button>
        <span class="text-sm text-slate-600">Halaman {{ pagination.page }}</span>
        <button class="rounded-lg border border-lake-700 px-3 py-1 text-lake-800 disabled:opacity-50" :disabled="!hasNext" @click="goToPage(pagination.page + 1)">
          Berikutnya
        </button>
      </div>
    </AsyncState>
  </section>
</template>
