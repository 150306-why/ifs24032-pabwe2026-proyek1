<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/features/common/components/AppHeader.vue';
import AppFooter from '@/features/common/components/AppFooter.vue';
import AdminLayout from '@/features/admin/components/AdminLayout.vue';
import ToastHost from '@/features/common/components/ToastHost.vue';

const route = useRoute();
// meta.layout: 'admin' (sidebar), 'bare' (layar penuh, mis. halaman masuk), selain itu layout publik.
const layout = computed(() => route.meta?.layout || 'public');
</script>

<template>
  <div class="min-h-screen bg-mist text-ink">
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">
      Lewati ke konten
    </a>

    <AdminLayout v-if="layout === 'admin'">
      <main id="main" class="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
        <RouterView />
      </main>
    </AdminLayout>

    <main v-else-if="layout === 'bare'" id="main">
      <RouterView />
    </main>

    <div v-else class="flex min-h-screen flex-col">
      <AppHeader />
      <main id="main" class="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <RouterView />
      </main>
      <AppFooter />
    </div>

    <ToastHost />
  </div>
</template>
