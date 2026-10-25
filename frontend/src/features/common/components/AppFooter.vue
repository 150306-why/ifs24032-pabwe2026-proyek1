<script setup>
import BrandMark from '@/features/common/components/BrandMark.vue';
</script>

<template>
  <footer class="no-print mt-12 bg-lake-950 text-lake-200">
    <div class="ulos-band" aria-hidden="true"></div>
    <div class="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-start sm:justify-between">
      <div class="max-w-sm">
        <BrandMark light />
        <p class="mt-3 text-sm leading-relaxed text-lake-300">
          Pesan tiket kapal penyeberangan dan wisata di Danau Toba dari ponsel, tanpa antre di loket.
        </p>
      </div>
      <nav class="grid grid-cols-2 gap-x-10 gap-y-2 text-sm" aria-label="Tautan footer">
        <RouterLink to="/jadwal" class="hover:text-white">Cari jadwal</RouterLink>
        <RouterLink to="/verifikasi" class="hover:text-white">Cek keaslian tiket</RouterLink>
        <RouterLink to="/tiket-saya" class="hover:text-white">Tiket saya</RouterLink>
        <RouterLink to="/admin/login" class="hover:text-white">Masuk petugas</RouterLink>
      </nav>
    </div>
    <p class="border-t border-white/10 px-4 py-4 text-center text-xs text-lake-400">
      Toba Tix, proyek PABWE. Data jadwal dan harga hanyalah contoh.
    </p>
  </footer>
</template>
