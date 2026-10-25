<script setup>
import AppIcon from '@/features/common/components/AppIcon.vue';

defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: String, default: 'ticket' },
  hint: { type: String, default: '' },
  tone: { type: String, default: 'lake' }, // lake | ulos | gold | pine
});

const TONES = {
  lake: 'bg-lake-100 text-lake-800',
  ulos: 'bg-ulos-100 text-ulos-700',
  gold: 'bg-gold-100 text-gold-600',
  pine: 'bg-pine-100 text-pine-700',
};
</script>

<template>
  <div class="card flex items-start gap-4 !p-5">
    <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" :class="TONES[tone]">
      <AppIcon :name="icon" :size="22" />
    </span>
    <div class="min-w-0">
      <p class="text-sm text-slate-600">{{ label }}</p>
      <p class="truncate font-display text-2xl font-extrabold text-lake-900">{{ value }}</p>
      <p v-if="hint" class="text-xs text-slate-500">{{ hint }}</p>
    </div>
  </div>
</template>
