<script setup>
import AppHeader from '@/components/AppHeader.vue';
</script>

<template>
  <div class="flex min-h-screen flex-col bg-lake-50 text-slate-800">
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">
      Lewati ke konten
    </a>
    <AppHeader />
    <main id="main" class="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <RouterView />
    </main>
    <footer class="bg-lake-900 py-4 text-center text-sm text-lake-100">
      Toba Tix, proyek PABWE. Data jadwal dan harga hanyalah contoh.
    </footer>
  </div>
</template>
