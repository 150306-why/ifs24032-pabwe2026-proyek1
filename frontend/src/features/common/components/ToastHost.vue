<script setup>
import { useToastStore } from '@/features/common/states/toastStore';
import AppIcon from '@/features/common/components/AppIcon.vue';

const toasts = useToastStore();
</script>

<template>
  <div class="no-print pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
    <div
      v-for="t in toasts.items"
      :key="t.id"
      class="pointer-events-auto flex max-w-md animate-toast items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-pass"
      :class="t.type === 'error' ? 'bg-ulos-700' : 'bg-lake-900'"
      :role="t.type === 'error' ? 'alert' : 'status'"
    >
      <AppIcon :name="t.type === 'error' ? 'alert' : 'check'" :size="18" class="mt-0.5" />
      <span class="flex-1">{{ t.message }}</span>
      <button class="-mr-1 rounded p-0.5 opacity-70 hover:opacity-100" aria-label="Tutup notifikasi" @click="toasts.dismiss(t.id)">
        <AppIcon name="x" :size="16" />
      </button>
    </div>
  </div>
</template>
