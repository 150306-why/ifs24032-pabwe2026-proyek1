<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAsync } from '@/hooks/useAsync';
import { getErrorMessage, getFieldErrors } from '@/helpers/errorHelper';
import AdminNav from '@/features/admin/components/AdminNav.vue';
import AsyncState from '@/features/common/components/AsyncState.vue';
import BaseButton from '@/features/common/components/BaseButton.vue';
import BaseInput from '@/features/common/components/BaseInput.vue';
import BaseSelect from '@/features/common/components/BaseSelect.vue';
import { OPTION_SOURCES, RESOURCES } from '../adminConfigs';

const route = useRoute();
const config = computed(() => RESOURCES[route.params.resource]);

const loader = useAsync(() => config.value.api.list());
const rows = computed(() => loader.data.value || []);

const optionData = ref({}); // { ports: [...], boats: [...] }
const editingId = ref(null); // null = tambah baru
const showForm = ref(false);
const form = ref({});
const errors = ref({});
const message = ref('');
const saving = ref(false);

const isEdit = computed(() => editingId.value !== null);
const visibleFields = computed(() => config.value.fields.filter((f) => (isEdit.value ? !f.createOnly : !f.editOnly)));

function optionsFor(field) {
  if (field.options) return field.options;
  const source = OPTION_SOURCES[field.optionsFrom];
  return (optionData.value[field.optionsFrom] || []).map((r) => ({ value: r.id, label: source.label(r) }));
}

async function loadOptions() {
  const needed = [...new Set(config.value.fields.map((f) => f.optionsFrom).filter(Boolean))];
  const results = await Promise.all(needed.map((name) => OPTION_SOURCES[name].api.list().catch(() => [])));
  needed.forEach((name, i) => { optionData.value[name] = results[i]; });
}

function resetForm() {
  editingId.value = null;
  showForm.value = false;
  errors.value = {};
  message.value = '';
  form.value = config.value.emptyForm();
}

function startCreate() {
  resetForm();
  showForm.value = true;
}

function startEdit(row) {
  resetForm();
  editingId.value = row.id;
  form.value = config.value.toForm(row);
  showForm.value = true;
}

async function save() {
  saving.value = true;
  errors.value = {};
  message.value = '';
  try {
    const payload = config.value.toPayload(form.value, isEdit.value);
    if (isEdit.value) await config.value.api.update(editingId.value, payload);
    else await config.value.api.create(payload);
    resetForm();
    await loader.run();
  } catch (err) {
    errors.value = getFieldErrors(err);
    message.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
}

async function remove(row) {
  if (!window.confirm('Hapus data ini?')) return;
  try {
    await config.value.api.remove(row.id);
    await loader.run();
  } catch (err) {
    message.value = getErrorMessage(err);
  }
}

async function init() {
  resetForm();
  await Promise.all([loader.run(), loadOptions()]);
}

watch(() => route.params.resource, init);
onMounted(init);
</script>

<template>
  <section>
    <AdminNav />
    <div class="mb-4 flex items-center justify-between">
      <h1 class="page-title !mb-0">Kelola {{ config.title }}</h1>
      <BaseButton @click="startCreate">+ Tambah</BaseButton>
    </div>

    <form v-if="showForm" class="card mb-4 grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="save">
      <template v-for="f in visibleFields" :key="f.key">
        <BaseSelect v-if="f.type === 'select'" :id="`f-${f.key}`" v-model="form[f.key]" :label="f.label" :options="optionsFor(f)" :error="errors[f.key]" />
        <BaseInput v-else :id="`f-${f.key}`" v-model="form[f.key]" :type="f.type" :label="f.label" :min="f.min" :error="errors[f.key]" />
      </template>
      <p v-if="message" class="text-red-700 sm:col-span-2" role="alert">{{ message }}</p>
      <div class="flex gap-2 sm:col-span-2">
        <BaseButton type="submit" :loading="saving">{{ isEdit ? 'Simpan perubahan' : 'Simpan' }}</BaseButton>
        <BaseButton variant="secondary" @click="resetForm">Batal</BaseButton>
      </div>
    </form>
    <p v-else-if="message" class="mb-2 text-red-700" role="alert">{{ message }}</p>

    <AsyncState :loading="loader.loading.value" :error="loader.error.value" :empty="rows.length === 0" empty-text="Belum ada data." @retry="loader.run">
      <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">Daftar {{ config.title }}</caption>
          <thead class="bg-lake-100 text-lake-900">
            <tr>
              <th v-for="c in config.columns" :key="c.key" scope="col" class="px-3 py-2">{{ c.label }}</th>
              <th scope="col" class="px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id" class="border-t border-slate-100">
              <td v-for="c in config.columns" :key="c.key" class="px-3 py-2">{{ c.value(row) }}</td>
              <td class="whitespace-nowrap px-3 py-2">
                <button class="mr-2 text-lake-700 underline focus:outline-none focus:ring-2 focus:ring-lake-500" @click="startEdit(row)">Ubah</button>
                <button class="text-red-700 underline focus:outline-none focus:ring-2 focus:ring-red-500" @click="remove(row)">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AsyncState>
  </section>
</template>
