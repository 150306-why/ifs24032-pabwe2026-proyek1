<script setup>
import AppIcon from '@/features/common/components/AppIcon.vue';

defineProps({
  loading: Boolean,
  error: { type: String, default: '' },
  empty: Boolean,
  emptyText: { type: String, default: 'Tidak ada data.' },
});
defineEmits(['retry']);
</script>

<template>
  <div v-if="loading" class="py-14 text-center text-slate-600" role="status" aria-live="polite">
    <div class="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-lake-100 border-t-lake-700"></div>
    Memuat…
  </div>
  <div v-else-if="error" class="card border-ulos-200 text-center" role="alert">
    <AppIcon name="alert" :size="28" class="mx-auto mb-2 text-ulos-600" />
    <p class="mb-3 font-medium text-ulos-700">{{ error }}</p>
    <button class="rounded-xl border border-ulos-500 px-4 py-1.5 font-semibold text-ulos-700 hover:bg-ulos-50" @click="$emit('retry')">
      Coba lagi
    </button>
  </div>
  <div v-else-if="empty" class="card-flat border-dashed px-6 py-12 text-center text-slate-600">
    <AppIcon name="anchor" :size="28" class="mx-auto mb-2 text-lake-300" />
    <p>{{ emptyText }}</p>
    <slot name="empty-action" />
  </div>
  <slot v-else />
</template>
