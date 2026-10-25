<script setup>
import BaseInput from '@/features/common/components/BaseInput.vue';
import BaseSelect from '@/features/common/components/BaseSelect.vue';

defineProps({
  index: { type: Number, required: true },
  canRemove: Boolean,
});
defineEmits(['remove']);

const name = defineModel('name', { type: String });
const category = defineModel('category', { type: String });
const CATEGORIES = [
  { value: 'dewasa', label: 'Dewasa' },
  { value: 'anak', label: 'Anak' },
];
</script>

<template>
  <fieldset class="rounded-lg border border-slate-200 p-3">
    <legend class="px-1 text-sm font-semibold text-lake-800">Penumpang {{ index + 1 }}</legend>
    <div class="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
      <BaseInput :id="`passenger-name-${index}`" v-model="name" label="Nama sesuai identitas" maxlength="80" autocomplete="off" />
      <BaseSelect :id="`passenger-category-${index}`" v-model="category" label="Kategori" :options="CATEGORIES" />
      <button
        v-if="canRemove"
        type="button"
        class="rounded-lg border border-red-700 px-3 py-2 text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
        :aria-label="`Hapus penumpang ${index + 1}`"
        @click="$emit('remove')"
      >
        Hapus
      </button>
    </div>
  </fieldset>
</template>
