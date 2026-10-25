<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/features/auth/states/authStore';
import { getErrorMessage, getFieldErrors } from '@/helpers/errorHelper';
import BaseButton from '@/features/common/components/BaseButton.vue';
import BaseInput from '@/features/common/components/BaseInput.vue';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const form = reactive({ email: '', password: '' });
const errors = ref({});
const message = ref('');
const loading = ref(false);

function validate() {
  const e = {};
  if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email tidak valid';
  if (!form.password) e.password = 'Password wajib diisi';
  errors.value = e;
  return Object.keys(e).length === 0;
}

async function submit() {
  message.value = '';
  if (!validate()) return;
  loading.value = true;
  try {
    await auth.login({ email: form.email.trim(), password: form.password });
    // Hanya terima redirect internal (cegah open redirect).
    const redirect = String(route.query.redirect || '/');
    router.push(redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/');
  } catch (err) {
    errors.value = getFieldErrors(err);
    message.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="card mx-auto max-w-md">
    <h1 class="page-title">Masuk</h1>
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <BaseInput id="username" v-model="form.email" type="email" label="Email" autocomplete="username" :error="errors.email" />
      <BaseInput id="password" v-model="form.password" type="password" label="Password" autocomplete="current-password" :error="errors.password" />
      <p v-if="message" class="text-red-700" role="alert">{{ message }}</p>
      <BaseButton id="btn-submit" type="submit" class="w-full" :loading="loading">Masuk</BaseButton>
    </form>
    <p class="mt-4 text-sm text-slate-700">
      Belum punya akun? <RouterLink to="/daftar" class="text-lake-700 underline">Daftar</RouterLink>
    </p>
  </section>
</template>