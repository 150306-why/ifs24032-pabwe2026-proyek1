<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | accent | secondary | danger | ghost
  size: { type: String, default: 'md' }, // sm | md | lg
  type: { type: String, default: 'button' },
  loading: Boolean,
  disabled: Boolean,
});

const VARIANTS = {
  primary: 'bg-lake-800 text-white hover:bg-lake-900 shadow-sm',
  accent: 'bg-ulos-600 text-white hover:bg-ulos-700 shadow-sm',
  secondary: 'bg-white text-lake-800 border border-lake-200 hover:border-lake-600 hover:bg-lake-50',
  danger: 'bg-white text-ulos-700 border border-ulos-200 hover:bg-ulos-50 hover:border-ulos-500',
  ghost: 'text-lake-800 hover:bg-lake-100',
};
const SIZES = { sm: 'px-3 py-1.5 text-sm gap-1.5', md: 'px-4 py-2.5 gap-2', lg: 'px-6 py-3 text-base gap-2' };

const classes = computed(() => [VARIANTS[props.variant], SIZES[props.size]]);
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
    class="inline-flex items-center justify-center rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    :class="classes"
  >
    <span v-if="loading" class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"></span>
    <slot />
    <span v-if="loading" class="sr-only"> Memproses…</span>
  </button>
</template>
