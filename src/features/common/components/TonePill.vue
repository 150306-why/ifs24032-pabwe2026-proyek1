<script setup>
defineProps({ tone: { type: String, default: 'gray' } }); // green | amber | red | blue | gray

const TONES = {
  green: 'bg-pine-100 text-pine-800',
  amber: 'bg-gold-100 text-gold-600',
  red: 'bg-ulos-100 text-ulos-700',
  blue: 'bg-lake-100 text-lake-800',
  gray: 'bg-slate-200 text-slate-700',
};
</script>

<template>
  <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" :class="TONES[tone] || TONES.gray"><slot /></span>
</template>
