<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/features/auth/states/authStore';
import AppIcon from '@/features/common/components/AppIcon.vue';
import BrandMark from '@/features/common/components/BrandMark.vue';

const auth = useAuthStore();
const router = useRouter();
const open = ref(false);

function logout() {
  auth.logout();
  open.value = false;
  router.push({ name: 'home' });
}

const linkClass = 'rounded-lg px-3 py-2 text-sm font-medium text-lake-100 transition hover:bg-white/10 hover:text-white';
</script>

<template>
  <header class="no-print sticky top-0 z-40 bg-lake-900 text-white">
    <nav class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3" aria-label="Navigasi utama">
      <RouterLink to="/" class="rounded-lg focus-visible:ring-offset-lake-900" aria-label="Toba Tix, beranda">
        <BrandMark light />
      </RouterLink>

      <button
        class="rounded-lg p-2 text-white hover:bg-white/10 md:hidden"
        :aria-expanded="open"
        aria-controls="menu-utama"
        aria-label="Buka menu"
        @click="open = !open"
      >
        <AppIcon :name="open ? 'x' : 'menu'" :size="22" />
      </button>

      <ul
        id="menu-utama"
        class="absolute inset-x-0 top-full flex-col gap-1 border-t border-white/10 bg-lake-900 p-3 md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0"
        :class="open ? 'flex' : 'hidden'"
        @click="open = false"
      >
        <li><RouterLink to="/jadwal" :class="linkClass" active-class="!bg-white/10 !text-white">Jadwal</RouterLink></li>
        <li><RouterLink to="/verifikasi" :class="linkClass" active-class="!bg-white/10 !text-white">Cek tiket</RouterLink></li>
        <template v-if="auth.isAuthenticated">
          <li v-if="!auth.isAdmin"><RouterLink to="/tiket-saya" :class="linkClass" active-class="!bg-white/10 !text-white">Tiket saya</RouterLink></li>
          <li v-if="!auth.isAdmin"><RouterLink to="/profil" :class="linkClass" active-class="!bg-white/10 !text-white">Profil</RouterLink></li>
          <li v-if="auth.isAdmin">
            <RouterLink to="/admin" class="inline-flex items-center gap-1.5 rounded-lg bg-gold-400 px-3 py-2 text-sm font-semibold text-lake-950 hover:bg-gold-300">
              <AppIcon name="dashboard" :size="16" /> Admin
            </RouterLink>
          </li>
          <li v-if="auth.user" class="hidden px-2 text-sm text-lake-200 lg:block">{{ auth.user.name }}</li>
          <li><button :class="[linkClass, 'w-full text-left']" @click="logout">Keluar</button></li>
        </template>
        <template v-else>
          <li><RouterLink to="/masuk" :class="linkClass">Masuk</RouterLink></li>
          <li>
            <RouterLink to="/daftar" class="inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-lake-900 hover:bg-lake-100">Daftar</RouterLink>
          </li>
        </template>
      </ul>
    </nav>
    <div class="ulos-band ulos-band-thin" aria-hidden="true"></div>
  </header>
</template>
