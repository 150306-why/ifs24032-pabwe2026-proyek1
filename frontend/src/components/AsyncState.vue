<script setup>
defineProps({
  loading: Boolean,
  error: { type: String, default: '' },
  empty: Boolean,
  emptyText: { type: String, default: 'Tidak ada data.' },
});
defineEmits(['retry']);
</script>

<template>
  <div v-if="loading" class="py-10 text-center text-slate-600" role="status" aria-live="polite">
    <div class="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-lake-200 border-t-lake-700"></div>
    Memuat…
  </div>
  <div v-else-if="error" class="card border-red-200 text-center" role="alert">
    <p class="mb-3 text-red-700">{{ error }}</p>
    <button class="rounded-lg border border-red-700 px-3 py-1 text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500" @click="$emit('retry')">
      Coba lagi
    </button>
  </div>
  <p v-else-if="empty" class="card text-center text-slate-600">{{ emptyText }}</p>
  <slot v-else />
</template>
