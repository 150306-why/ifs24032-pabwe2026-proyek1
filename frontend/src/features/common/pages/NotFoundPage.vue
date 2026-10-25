<script setup>
import AppIcon from '@/features/common/components/AppIcon.vue';
</script>

<template>
  <div class="card mx-auto max-w-lg py-12 text-center">
    <AppIcon name="anchor" :size="40" class="mx-auto mb-3 text-lake-300" />
    <h1 class="page-title">Halaman tidak ditemukan</h1>
    <p class="mb-5 text-slate-600">Alamat yang Anda buka tidak ada atau sudah dipindahkan.</p>
    <RouterLink to="/" class="inline-flex rounded-xl bg-lake-800 px-5 py-2.5 font-semibold text-white hover:bg-lake-900">Kembali ke beranda</RouterLink>
  </div>
</template>
