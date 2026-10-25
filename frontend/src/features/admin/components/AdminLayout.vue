<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/features/auth/states/authStore';
import AppIcon from '@/features/common/components/AppIcon.vue';
import BrandMark from '@/features/common/components/BrandMark.vue';
import AdminNav from '@/features/admin/components/AdminNav.vue';

const auth = useAuthStore();
const router = useRouter();

function logout() {
  auth.logout();
  router.push({ name: 'admin-login' });
}
</script>

<template>
  <div class="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
    <aside class="no-print bg-lake-950 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
      <div class="flex items-center justify-between gap-3 px-4 py-4 lg:block lg:px-5 lg:py-6">
        <RouterLink to="/admin" aria-label="Dasbor admin Toba Tix"><BrandMark light /></RouterLink>
        <p class="hidden pt-2 text-xs text-lake-400 lg:block">Panel petugas dan pengelola</p>
        <button class="rounded-lg px-3 py-1.5 text-sm text-lake-200 hover:bg-white/10 lg:hidden" @click="logout">Keluar</button>
      </div>
      <div class="ulos-band ulos-band-thin hidden lg:block" aria-hidden="true"></div>
      <div class="px-3 pb-3 lg:flex-1 lg:py-5">
        <AdminNav />
      </div>
      <div class="hidden border-t border-white/10 p-4 lg:block">
        <p class="truncate text-sm font-semibold">{{ auth.user?.name }}</p>
        <p class="truncate text-xs text-lake-400">{{ auth.user?.email || 'Admin' }}</p>
        <div class="mt-3 flex gap-2">
          <RouterLink to="/" class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20">
            <AppIcon name="home" :size="14" /> Situs
          </RouterLink>
          <button class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ulos-700 px-3 py-2 text-xs font-semibold hover:bg-ulos-600" @click="logout">
            <AppIcon name="logout" :size="14" /> Keluar
          </button>
        </div>
      </div>
    </aside>
    <div class="min-w-0">
      <slot />
    </div>
  </div>
</template>
