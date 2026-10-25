<script setup>
import LakeScene from '@/features/common/components/LakeScene.vue';
import BrandMark from '@/features/common/components/BrandMark.vue';

defineProps({
  title: { type: String, required: true },
  lead: { type: String, default: '' },
  admin: Boolean,
});
</script>

<template>
  <div class="grid min-h-screen md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
    <aside class="relative hidden overflow-hidden md:block" :class="admin ? 'bg-lake-950' : 'bg-lake-900'">
      <div class="absolute inset-0"><LakeScene :dark="admin" /></div>
      <div class="absolute inset-x-0 top-0 bg-gradient-to-b from-lake-950/80 to-transparent p-8">
        <RouterLink to="/" aria-label="Kembali ke beranda Toba Tix"><BrandMark light /></RouterLink>
      </div>
      <div class="absolute inset-x-0 bottom-0">
        <div class="bg-gradient-to-t from-lake-950 via-lake-950/80 to-transparent px-8 pb-8 pt-24 text-white">
          <p class="max-w-xs font-display text-3xl font-bold leading-tight">
            {{ admin ? 'Pantau jadwal, penumpang, dan pendapatan dalam satu layar.' : 'Menyeberang Danau Toba tanpa antre di loket.' }}
          </p>
        </div>
        <div class="ulos-band" aria-hidden="true"></div>
      </div>
    </aside>

    <section class="flex flex-col justify-center bg-white px-6 py-10 sm:px-12">
      <div class="mx-auto w-full max-w-md">
        <RouterLink to="/" class="mb-8 inline-block md:hidden" aria-label="Kembali ke beranda Toba Tix"><BrandMark /></RouterLink>
        <p v-if="admin" class="mb-3 inline-flex items-center gap-1.5 rounded-full bg-lake-900 px-3 py-1 text-xs font-semibold text-gold-300">
          Khusus petugas
        </p>
        <h1 class="text-3xl font-extrabold text-lake-900">{{ title }}</h1>
        <p v-if="lead" class="mb-7 mt-2 text-slate-600">{{ lead }}</p>
        <slot />
        <div class="mt-8 border-t border-lake-100 pt-5 text-sm text-slate-600">
          <slot name="footer" />
        </div>
      </div>
    </section>
  </div>
</template>
