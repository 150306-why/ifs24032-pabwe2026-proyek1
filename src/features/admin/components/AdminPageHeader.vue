<script setup>
defineProps({
  title: { type: String, required: true },
  lead: { type: String, default: '' },
});
</script>

<template>
  <header class="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="page-title !mb-0">{{ title }}</h1>
      <p v-if="lead" class="mt-1 text-slate-600">{{ lead }}</p>
    </div>
    <div class="flex items-center gap-2"><slot name="actions" /></div>
  </header>
</template>
