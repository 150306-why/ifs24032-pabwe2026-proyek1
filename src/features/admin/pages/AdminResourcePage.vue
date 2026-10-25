<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAsync } from '@/hooks/useAsync';
import { getErrorMessage, getFieldErrors } from '@/helpers/errorHelper';
import { useToastStore } from '@/features/common/states/toastStore';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader.vue';
import AppIcon from '@/features/common/components/AppIcon.vue';
import AsyncState from '@/features/common/components/AsyncState.vue';
import BaseButton from '@/features/common/components/BaseButton.vue';
import BaseInput from '@/features/common/components/BaseInput.vue';
import BaseSelect from '@/features/common/components/BaseSelect.vue';
import PaginationBar from '@/features/common/components/PaginationBar.vue';
import TonePill from '@/features/common/components/TonePill.vue';
import { OPTION_SOURCES, RESOURCES } from '../adminConfigs';

const PAGE_SIZE = 10;

const route = useRoute();
const toast = useToastStore();
const config = computed(() => RESOURCES[route.params.resource]);

const page = ref(1);
const query = ref('');
const loader = useAsync(() => (config.value.paginated
  ? config.value.api.listPaged({ page: page.value, limit: PAGE_SIZE, order: 'desc' })
  : config.value.api.list()));

const allRows = computed(() => {
  const data = loader.data.value;
  if (!data) return [];
  return Array.isArray(data) ? data : data.items;
});
// Resource kecil (pelabuhan, kapal, rute) difilter di klien; jadwal dipaginasi server.
const rows = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q || config.value.paginated) return allRows.value;
  return allRows.value.filter((row) => config.value.columns.some((c) => String(c.value(row)).toLowerCase().includes(q)));
});
const pagination = computed(() => (config.value.paginated ? loader.data.value?.pagination : null));

const optionData = ref({}); // { ports: [...], boats: [...] }
const editingId = ref(null); // null = tambah baru
const showForm = ref(false);
const form = ref({});
const errors = ref({});
const message = ref('');
const saving = ref(false);
const dialog = ref(null);

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

async function openForm() {
  showForm.value = true;
  await nextTick();
  dialog.value?.querySelector('input, select')?.focus();
}

function startCreate() {
  resetForm();
  openForm();
}

function startEdit(row) {
  resetForm();
  editingId.value = row.id;
  form.value = config.value.toForm(row);
  openForm();
}

async function save() {
  saving.value = true;
  errors.value = {};
  message.value = '';
  try {
    const payload = config.value.toPayload(form.value, isEdit.value);
    if (isEdit.value) await config.value.api.update(editingId.value, payload);
    else await config.value.api.create(payload);
    toast.success(isEdit.value ? `${config.value.title} diperbarui` : `${config.value.title} ditambahkan`);
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
  message.value = '';
  try {
    await config.value.api.remove(row.id);
    toast.success(`${config.value.title} dihapus`);
    await loader.run();
  } catch (err) {
    message.value = getErrorMessage(err);
  }
}

function goToPage(next) {
  page.value = next;
  loader.run();
}

async function init() {
  page.value = 1;
  query.value = '';
  resetForm();
  await Promise.all([loader.run(), loadOptions()]);
}

watch(() => route.params.resource, init);
onMounted(init);
</script>

<template>
  <section>
    <AdminPageHeader :title="`Kelola ${config.title}`" :lead="`Tambah, ubah, atau hapus data ${config.singular}.`">
      <template #actions>
        <BaseButton @click="startCreate"><AppIcon name="plus" :size="18" /> Tambah</BaseButton>
      </template>
    </AdminPageHeader>

    <div v-if="!config.paginated" class="relative mb-4 max-w-sm">
      <AppIcon name="search" :size="18" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input v-model="query" type="search" class="input !pl-10" :placeholder="`Cari ${config.singular}…`" :aria-label="`Cari ${config.singular}`" />
    </div>

    <p v-if="message && !showForm" class="mb-3 rounded-xl bg-ulos-50 px-4 py-3 font-medium text-ulos-700" role="alert">{{ message }}</p>

    <AsyncState
      :loading="loader.loading.value && !loader.data.value"
      :error="loader.error.value"
      :empty="allRows.length === 0"
      empty-text="Belum ada data."
      @retry="loader.run"
    >
      <div class="table-wrap">
        <table class="table-base">
          <caption class="sr-only">Daftar {{ config.title }}</caption>
          <thead>
            <tr>
              <th v-for="c in config.columns" :key="c.key" scope="col">{{ c.label }}</th>
              <th scope="col" class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td v-for="c in config.columns" :key="c.key">
                <TonePill v-if="c.kind === 'pill'" :tone="c.tone(row)" class="capitalize">{{ c.value(row) }}</TonePill>
                <template v-else>{{ c.value(row) }}</template>
              </td>
              <td class="whitespace-nowrap text-right">
                <button class="mr-1 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold text-lake-700 hover:bg-lake-100" @click="startEdit(row)">
                  <AppIcon name="edit" :size="15" /> Ubah
                </button>
                <button class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold text-ulos-700 hover:bg-ulos-50" @click="remove(row)">
                  <AppIcon name="trash" :size="15" /> Hapus
                </button>
              </td>
            </tr>
            <tr v-if="rows.length === 0">
              <td :colspan="config.columns.length + 1" class="py-8 text-center text-slate-500">Tidak ada hasil untuk “{{ query }}”.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaginationBar v-if="pagination" :page="pagination.page" :limit="pagination.limit" :total="pagination.total" @change="goToPage" />
    </AsyncState>

    <div v-if="showForm" class="fixed inset-0 z-50 flex items-end justify-center bg-lake-950/60 p-0 sm:items-center sm:p-4" @keydown.esc="resetForm">
      <div ref="dialog" class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-pass sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div class="ulos-band ulos-band-thin" aria-hidden="true"></div>
        <form class="grid gap-4 p-6 sm:grid-cols-2" novalidate @submit.prevent="save">
          <h2 id="dialog-title" class="text-xl font-bold text-lake-900 sm:col-span-2">{{ isEdit ? 'Ubah' : 'Tambah' }} {{ config.singular }}</h2>
          <template v-for="f in visibleFields" :key="f.key">
            <BaseSelect v-if="f.type === 'select'" :id="`f-${f.key}`" v-model="form[f.key]" :label="f.label" :options="optionsFor(f)" :error="errors[f.key]" />
            <BaseInput v-else :id="`f-${f.key}`" v-model="form[f.key]" :type="f.type" :label="f.label" :min="f.min" :error="errors[f.key]" />
          </template>
          <p v-if="message" class="rounded-xl bg-ulos-50 px-3.5 py-2.5 text-sm font-medium text-ulos-700 sm:col-span-2" role="alert">{{ message }}</p>
          <div class="flex gap-2 sm:col-span-2">
            <BaseButton type="submit" :loading="saving">{{ isEdit ? 'Simpan perubahan' : 'Simpan' }}</BaseButton>
            <BaseButton variant="secondary" @click="resetForm">Batal</BaseButton>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
