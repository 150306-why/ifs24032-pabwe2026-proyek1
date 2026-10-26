<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/features/auth/states/authStore';
import { getErrorMessage, getFieldErrors } from '@/helpers/errorHelper';
import { FORM_MESSAGES, isValidEmail } from '@/helpers/validationHelper';
import AuthShell from '@/features/auth/components/AuthShell.vue';
import BaseButton from '@/features/common/components/BaseButton.vue';
import BaseInput from '@/features/common/components/BaseInput.vue';

const auth = useAuthStore();
const router = useRouter();

const form = reactive({ name: '', email: '', password: '', confirm: '' });
const errors = ref({});
const message = ref('');
const loading = ref(false);

function validate() {
  const e = {};
  if (form.name.trim().length < 2) e.name = 'Nama minimal 2 karakter';
  if (!isValidEmail(form.email)) e.email = FORM_MESSAGES.emailInvalid;
  if (form.password.length < 8) e.password = FORM_MESSAGES.secretTooShort;
  if (form.confirm !== form.password) e.confirm = FORM_MESSAGES.confirmMismatch;
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
  <AuthShell title="Buat akun" lead="Cukup satu akun untuk memesan, membayar, dan menyimpan semua tiket.">
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <BaseInput id="name" v-model="form.name" type="text" label="Nama lengkap" autocomplete="name" :error="errors.name" />
      <BaseInput id="email" v-model="form.email" type="email" label="Email" autocomplete="email" :error="errors.email" />
      <BaseInput id="password" v-model="form.password" type="password" label="Password (min. 8 karakter)" autocomplete="new-password" :error="errors.password" />
      <BaseInput id="confirm" v-model="form.confirm" type="password" label="Ulangi password" autocomplete="new-password" :error="errors.confirm" />
      <p v-if="message" class="rounded-xl bg-ulos-50 px-3.5 py-2.5 text-sm font-medium text-ulos-700" role="alert">{{ message }}</p>
      <BaseButton type="submit" variant="accent" size="lg" class="w-full" :loading="loading">Buat akun</BaseButton>
    </form>
    <template #footer>
      <p>Sudah punya akun? <RouterLink to="/masuk" class="link">Masuk</RouterLink></p>
    </template>
  </AuthShell>
</template>
