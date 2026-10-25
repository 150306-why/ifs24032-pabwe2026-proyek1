<script setup>
import { computed } from 'vue';

const props = defineProps({ status: { type: String, required: true } });

const MAP = {
  pending: { label: 'Menunggu pembayaran', cls: 'bg-amber-100 text-amber-900' },
  paid: { label: 'Lunas', cls: 'bg-pine-100 text-pine-800' },
  cancelled: { label: 'Dibatalkan', cls: 'bg-slate-200 text-slate-800' },
};
const view = computed(() => MAP[props.status] || { label: props.status, cls: 'bg-slate-100 text-slate-800' });
</script>

<template>
  <span class="inline-block rounded-full px-3 py-1 text-xs font-semibold" :class="view.cls">{{ view.label }}</span>
</template>
