<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getErrorMessage, getFieldErrors } from '@/utils/errors';
import BaseButton from '@/components/BaseButton.vue';
import BaseInput from '@/components/BaseInput.vue';

const auth = useAuthStore();
const router = useRouter();

const form = reactive({ name: '', email: '', password: '', confirm: '' });
const errors = ref({});
const message = ref('');
const loading = ref(false);

function validate() {
  const e = {};
  if (form.name.trim().length < 2) e.name = 'Nama minimal 2 karakter';
  if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email tidak valid';
  if (form.password.length < 8) e.password = 'Password minimal 8 karakter';
  if (form.confirm !== form.password) e.confirm = 'Konfirmasi password tidak sama';
  errors.value = e;
  return Object.keys(e).length === 0;
}

async function submit() {
  message.value = '';
  if (!validate()) return;
  loading.value = true;
  try {
    await auth.register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
    router.push('/');
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
    <h1 class="page-title">Daftar</h1>
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <BaseInput id="name" v-model="form.name" label="Nama lengkap" autocomplete="name" :error="errors.name" />
      <BaseInput id="email" v-model="form.email" type="email" label="Email" autocomplete="email" :error="errors.email" />
      <BaseInput id="password" v-model="form.password" type="password" label="Password (min. 8 karakter)" autocomplete="new-password" :error="errors.password" />
      <BaseInput id="confirm" v-model="form.confirm" type="password" label="Ulangi password" autocomplete="new-password" :error="errors.confirm" />
      <p v-if="message" class="text-red-700" role="alert">{{ message }}</p>
      <BaseButton type="submit" class="w-full" :loading="loading">Buat akun</BaseButton>
    </form>
    <p class="mt-4 text-sm text-slate-700">
      Sudah punya akun? <RouterLink to="/masuk" class="text-lake-700 underline">Masuk</RouterLink>
    </p>
  </section>
</template>
