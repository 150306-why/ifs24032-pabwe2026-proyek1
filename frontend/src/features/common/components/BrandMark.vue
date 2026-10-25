<script setup>
defineProps({ light: Boolean });
</script>

<template>
  <span class="inline-flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight" :class="light ? 'text-white' : 'text-lake-900'">
    <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" :fill="light ? '#ffffff' : '#0c2f3b'" />
      <path d="M6 44c9-6 15-6 23 0s15 6 29 0v14H6z" fill="#2f7b8f" />
      <path d="M12 38 32 12l20 26z" :fill="light ? '#0c2f3b' : '#fff'" />
      <path d="M0 52h64v4H0z" fill="#b8271f" />
    </svg>
    Toba Tix
  </span>
</template>
