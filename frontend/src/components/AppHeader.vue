<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

function logout() {
  auth.logout();
  router.push({ name: 'home' });
}

const linkClass = 'rounded px-2 py-1 hover:bg-lake-800 focus:outline-none focus:ring-2 focus:ring-white';
</script>

<template>
  <header class="bg-lake-700 text-white">
    <nav class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3" aria-label="Navigasi utama">
      <RouterLink to="/" class="text-xl font-bold focus:outline-none focus:ring-2 focus:ring-white">⛴ Toba Tix</RouterLink>
      <ul class="flex flex-wrap items-center gap-1 text-sm">
        <li><RouterLink to="/jadwal" :class="linkClass">Jadwal</RouterLink></li>
        <template v-if="auth.isAuthenticated">
          <li><RouterLink to="/tiket-saya" :class="linkClass">Tiket saya</RouterLink></li>
          <li v-if="auth.isAdmin"><RouterLink to="/admin" :class="linkClass">Admin</RouterLink></li>
          <li v-if="auth.user" class="hidden px-2 text-lake-100 sm:block">{{ auth.user.name }}</li>
          <li><button :class="linkClass" @click="logout">Keluar</button></li>
        </template>
        <template v-else>
          <li><RouterLink to="/masuk" :class="linkClass">Masuk</RouterLink></li>
          <li><RouterLink to="/daftar" class="rounded bg-white px-3 py-1 font-medium text-lake-800 focus:outline-none focus:ring-2 focus:ring-pine-500">Daftar</RouterLink></li>
        </template>
      </ul>
    </nav>
  </header>
</template>
