<script setup>
import { reactive, ref, watch } from 'vue';
import { useAuthStore } from '@/features/auth/states/authStore';
import { useToastStore } from '@/features/common/states/toastStore';
import { getErrorMessage, getFieldErrors } from '@/helpers/errorHelper';
import BaseButton from '@/features/common/components/BaseButton.vue';
import BaseInput from '@/features/common/components/BaseInput.vue';
import AppIcon from '@/features/common/components/AppIcon.vue';

const auth = useAuthStore();
const toast = useToastStore();

const profile = reactive({ name: auth.user?.name || '' });
watch(() => auth.user?.name, (name) => { if (name) profile.name = name; });
const profileErrors = ref({});
const profileMessage = ref('');
const savingProfile = ref(false);

const pwd = reactive({ current_password: '', new_password: '', confirm: '' });
const pwdErrors = ref({});
const pwdMessage = ref('');
const savingPwd = ref(false);

async function saveProfile() {
  profileErrors.value = {};
  profileMessage.value = '';
  if (profile.name.trim().length < 2) {
    profileErrors.value = { name: 'Nama minimal 2 karakter' };
    return;
  }
  savingProfile.value = true;
  try {
    await auth.updateProfile({ name: profile.name.trim() });
    toast.success('Profil diperbarui');
  } catch (err) {
    profileErrors.value = getFieldErrors(err);
    profileMessage.value = getErrorMessage(err);
  } finally {
    savingProfile.value = false;
  }
}

async function savePassword() {
  pwdErrors.value = {};
  pwdMessage.value = '';
  const e = {};
  if (!pwd.current_password) e.current_password = 'Password saat ini wajib diisi';
  if (pwd.new_password.length < 8) e.new_password = 'Password baru minimal 8 karakter';
  if (pwd.confirm !== pwd.new_password) e.confirm = 'Konfirmasi password tidak sama';
  if (Object.keys(e).length) {
    pwdErrors.value = e;
    return;
  }
  savingPwd.value = true;
  try {
    await auth.changePassword({ current_password: pwd.current_password, new_password: pwd.new_password });
    Object.assign(pwd, { current_password: '', new_password: '', confirm: '' });
    toast.success('Password berhasil diganti');
  } catch (err) {
    pwdErrors.value = getFieldErrors(err);
    pwdMessage.value = getErrorMessage(err);
  } finally {
    savingPwd.value = false;
  }
}
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <h1 class="page-title">Profil saya</h1>
    <p class="page-lead">Perbarui nama yang tampil di akun dan ganti password secara berkala.</p>

    <div class="mb-6 flex items-center gap-4 rounded-2xl bg-lake-900 p-5 text-white">
      <span class="flex h-14 w-14 items-center justify-center rounded-full bg-gold-400 font-display text-2xl font-extrabold text-lake-950">
        {{ (auth.user?.name || '?').charAt(0).toUpperCase() }}
      </span>
      <div class="min-w-0">
        <p class="truncate text-lg font-bold">{{ auth.user?.name }}</p>
        <p class="truncate text-sm text-lake-200">{{ auth.user?.email }}</p>
      </div>
      <RouterLink to="/tiket-saya" class="ml-auto hidden items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 sm:inline-flex">
        <AppIcon name="ticket" :size="16" /> Tiket saya
      </RouterLink>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      <form class="card space-y-4" novalidate @submit.prevent="saveProfile">
        <h2 class="text-lg font-bold text-lake-900">Data akun</h2>
        <BaseInput id="profile-name" v-model="profile.name" label="Nama lengkap" autocomplete="name" :error="profileErrors.name" />
        <BaseInput id="profile-email" :model-value="auth.user?.email" label="Email" disabled hint="Email tidak bisa diubah." />
        <p v-if="profileMessage" class="text-sm font-medium text-ulos-700" role="alert">{{ profileMessage }}</p>
        <BaseButton type="submit" :loading="savingProfile">Simpan profil</BaseButton>
      </form>

      <form class="card space-y-4" novalidate @submit.prevent="savePassword">
        <h2 class="text-lg font-bold text-lake-900">Ganti password</h2>
        <BaseInput id="current-password" v-model="pwd.current_password" type="password" label="Password saat ini" autocomplete="current-password" :error="pwdErrors.current_password" />
        <BaseInput id="new-password" v-model="pwd.new_password" type="password" label="Password baru" autocomplete="new-password" :error="pwdErrors.new_password" />
        <BaseInput id="confirm-password" v-model="pwd.confirm" type="password" label="Ulangi password baru" autocomplete="new-password" :error="pwdErrors.confirm" />
        <p v-if="pwdMessage" class="text-sm font-medium text-ulos-700" role="alert">{{ pwdMessage }}</p>
        <BaseButton type="submit" :loading="savingPwd">Ganti password</BaseButton>
      </form>
    </div>
  </section>
</template>
