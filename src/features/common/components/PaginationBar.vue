<script setup>
import { computed } from 'vue';

const props = defineProps({
  page: { type: Number, required: true },
  limit: { type: Number, required: true },
  total: { type: Number, required: true },
});
const emit = defineEmits(['change']);

const lastPage = computed(() => Math.max(1, Math.ceil(props.total / props.limit)));
const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.limit + 1));
const to = computed(() => Math.min(props.page * props.limit, props.total));
</script>

<template>
  <div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
    <p class="text-slate-600">Menampilkan {{ from }}–{{ to }} dari {{ props.total }}</p>
    <div class="flex items-center gap-2">
      <button class="chip disabled:cursor-not-allowed disabled:opacity-50" :disabled="page <= 1" @click="emit('change', page - 1)">Sebelumnya</button>
      <span class="px-1 font-medium text-lake-900">Halaman {{ page }} / {{ lastPage }}</span>
      <button class="chip disabled:cursor-not-allowed disabled:opacity-50" :disabled="page >= lastPage" @click="emit('change', page + 1)">Berikutnya</button>
    </div>
  </div>
</template>
