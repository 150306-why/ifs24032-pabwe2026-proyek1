<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | danger
  type: { type: String, default: 'button' },
  loading: Boolean,
  disabled: Boolean,
});

const classes = computed(() => ({
  primary: 'bg-lake-700 text-white hover:bg-lake-800',
  secondary: 'bg-white text-lake-800 border border-lake-700 hover:bg-lake-50',
  danger: 'bg-red-700 text-white hover:bg-red-800',
}[props.variant]));
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
    class="inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium transition focus:outline-none focus:ring-2 focus:ring-lake-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    :class="classes"
  >
    <slot />
    <span v-if="loading" class="sr-only"> Memproses…</span>
  </button>
</template>
