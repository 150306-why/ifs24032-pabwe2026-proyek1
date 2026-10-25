<script setup>
import AuthShell from '@/features/auth/components/AuthShell.vue';
import LoginForm from '@/features/auth/components/LoginForm.vue';
</script>

<template>
  <AuthShell admin title="Masuk admin" lead="Kelola jadwal, booking, dan check-in penumpang.">
    <LoginForm role="admin" />
    <template #footer>
      <p>Bukan petugas? <RouterLink to="/masuk" class="link">Masuk sebagai pelanggan</RouterLink></p>
    </template>
  </AuthShell>
</template>
