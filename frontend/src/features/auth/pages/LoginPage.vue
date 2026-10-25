<script setup>
import AuthShell from '@/features/auth/components/AuthShell.vue';
import LoginForm from '@/features/auth/components/LoginForm.vue';
</script>

<template>
  <AuthShell title="Masuk" lead="Lihat tiket Anda dan pesan perjalanan berikutnya.">
    <LoginForm role="customer" />
    <template #footer>
      <p>Belum punya akun? <RouterLink to="/daftar" class="link">Daftar gratis</RouterLink></p>
      <p class="mt-2">Petugas pelabuhan atau pengelola? <RouterLink to="/admin/login" class="link">Masuk sebagai admin</RouterLink></p>
    </template>
  </AuthShell>
</template>
