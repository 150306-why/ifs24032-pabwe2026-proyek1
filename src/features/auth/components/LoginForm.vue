<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/features/auth/states/authStore';
import { getErrorMessage, getFieldErrors } from '@/helpers/errorHelper';
import { FORM_MESSAGES, isValidEmail } from '@/helpers/validationHelper';
import BaseButton from '@/features/common/components/BaseButton.vue';
import BaseInput from '@/features/common/components/BaseInput.vue';

const props = defineProps({
  /** 'customer' menerima semua akun (admin dialihkan ke panel); 'admin' hanya menerima admin. */
  mode: { type: String, default: 'customer' },
});

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const form = reactive({ email: '', password: '' });
const errors = ref({});
const message = ref('');
const loading = ref(false);
const showPassword = ref(false);
/** Petunjuk pengelola password peramban; dipisah karena jenis input berganti saat "Tampilkan password". */
const passwordAttrs = { autocomplete: 'current-password' };

function validate() {
  const e = {};
  if (!isValidEmail(form.email)) e.email = FORM_MESSAGES.emailInvalid;
  if (!form.password) e.password = FORM_MESSAGES.secretRequired;
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
  if (props.mode === 'admin') return redirect.startsWith('/admin') ? redirect : '/admin';
  if (user.role === 'admin') return redirect || '/admin';
  return redirect || '/';
}

async function submit() {
  message.value = '';
  if (!validate()) return;
  loading.value = true;
  try {
    const user = await auth.login({ email: form.email.trim(), password: form.password });
    if (props.mode === 'admin' && user.role !== 'admin') {
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
      :placeholder="mode === 'admin' ? 'admin@tobatix.test' : 'nama@email.com'"
      :error="errors.email"
    />
    <div>
      <BaseInput
        id="password"
        v-model="form.password"
        :type="showPassword ? 'text' : 'password'"
        label="Password"
        v-bind="passwordAttrs"
        :error="errors.password"
      />
      <label class="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
        <input v-model="showPassword" type="checkbox" class="h-4 w-4 rounded border-lake-300 text-lake-700" />
        Tampilkan password
      </label>
    </div>
    <p v-if="message" class="rounded-xl bg-ulos-50 px-3.5 py-2.5 text-sm font-medium text-ulos-700" role="alert">{{ message }}</p>
    <BaseButton id="btn-submit" type="submit" size="lg" class="w-full" :variant="mode === 'admin' ? 'primary' : 'accent'" :loading="loading">
      {{ mode === 'admin' ? 'Masuk ke panel admin' : 'Masuk' }}
    </BaseButton>
  </form>
</template>
