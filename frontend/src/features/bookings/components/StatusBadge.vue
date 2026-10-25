<script setup>
import { computed } from 'vue';

const props = defineProps({ status: { type: String, required: true } });

const MAP = {
  pending: { label: 'Menunggu pembayaran', cls: 'bg-gold-100 text-gold-600' },
  paid: { label: 'Lunas', cls: 'bg-pine-100 text-pine-800' },
  cancelled: { label: 'Dibatalkan', cls: 'bg-slate-200 text-slate-700' },
};
const view = computed(() => MAP[props.status] || { label: props.status, cls: 'bg-slate-100 text-slate-800' });
</script>

<template>
  <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" :class="view.cls">
    <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"></span>{{ view.label }}
  </span>
</template>
