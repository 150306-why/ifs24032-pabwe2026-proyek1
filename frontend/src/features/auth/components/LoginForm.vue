<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/features/auth/states/authStore';
import { getErrorMessage, getFieldErrors } from '@/helpers/errorHelper';
import BaseButton from '@/features/common/components/BaseButton.vue';
import BaseInput from '@/features/common/components/BaseInput.vue';

const props = defineProps({
  /** 'customer' menerima semua akun (admin dialihkan ke panel); 'admin' hanya menerima admin. */
  role: { type: String, default: 'customer' },
});

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const form = reactive({ email: '', password: '' });
const errors = ref({});
const message = ref('');
const loading = ref(false);
const showPassword = ref(false);

function validate() {
  const e = {};
  if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email tidak valid';
  if (!form.password) e.password = 'Password wajib diisi';
  errors.value = e;
  return Object.keys(e).length === 0;
}

/** Hanya terima tujuan internal (cegah open redirect). */
function safeRedirect() {
  const target = String(route.query.redirect || '');
  return target.startsWith('/') && !target.startsWith('//') ? target : '';
}

function destinationFor(user) {
  const redirect = safeRedirect();
  if (props.role === 'admin') return redirect.startsWith('/admin') ? redirect : '/admin';
  if (user.role === 'admin') return redirect || '/admin';
  return redirect || '/';
}

async function submit() {
  message.value = '';
  if (!validate()) return;
  loading.value = true;
  try {
    const user = await auth.login({ email: form.email.trim(), password: form.password });
    if (props.role === 'admin' && user.role !== 'admin') {
      auth.logout();
      message.value = 'Akun ini bukan akun admin. Gunakan halaman masuk pelanggan.';
      return;
    }
    router.push(destinationFor(user));
  } catch (err) {
    errors.value = getFieldErrors(err);
    message.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="submit">
    <BaseInput
      id="username"
      v-model="form.email"
      type="email"
      label="Email"
      autocomplete="username"
      :placeholder="role === 'admin' ? 'admin@tobatix.test' : 'nama@email.com'"
      :error="errors.email"
    />
    <div>
      <BaseInput
        id="password"
        v-model="form.password"
        :type="showPassword ? 'text' : 'password'"
        label="Password"
        autocomplete="current-password"
        :error="errors.password"
      />
      <label class="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
        <input v-model="showPassword" type="checkbox" class="h-4 w-4 rounded border-lake-300 text-lake-700" />
        Tampilkan password
      </label>
    </div>
    <p v-if="message" class="rounded-xl bg-ulos-50 px-3.5 py-2.5 text-sm font-medium text-ulos-700" role="alert">{{ message }}</p>
    <BaseButton id="btn-submit" type="submit" size="lg" class="w-full" :variant="role === 'admin' ? 'primary' : 'accent'" :loading="loading">
      {{ role === 'admin' ? 'Masuk ke panel admin' : 'Masuk' }}
    </BaseButton>
  </form>
</template>
