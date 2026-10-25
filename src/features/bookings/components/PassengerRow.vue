<script setup>
import AppIcon from '@/features/common/components/AppIcon.vue';
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
  <fieldset class="rounded-2xl border border-lake-100 bg-lake-50/40 p-4">
    <legend class="flex items-center gap-1.5 rounded-full bg-lake-900 px-3 py-1 text-xs font-semibold text-white">
      <AppIcon name="user" :size="13" /> Penumpang {{ index + 1 }}
    </legend>
    <div class="mt-1 grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
      <BaseInput :id="`passenger-name-${index}`" v-model="name" label="Nama sesuai identitas" maxlength="80" autocomplete="off" />
      <BaseSelect :id="`passenger-category-${index}`" v-model="category" label="Kategori" :options="CATEGORIES" />
      <button
        v-if="canRemove"
        type="button"
        class="inline-flex items-center justify-center rounded-xl border border-ulos-200 bg-white px-3 py-2.5 text-ulos-700 hover:bg-ulos-50"
        :aria-label="`Hapus penumpang ${index + 1}`"
        @click="$emit('remove')"
      >
        <AppIcon name="trash" :size="18" />
        <span class="sr-only">Hapus</span>
      </button>
    </div>
  </fieldset>
</template>
