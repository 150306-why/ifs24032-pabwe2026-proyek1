<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { todayInput } from '@/helpers/formatHelper';
import AppIcon from '@/features/common/components/AppIcon.vue';
import BaseButton from '@/features/common/components/BaseButton.vue';
import BaseInput from '@/features/common/components/BaseInput.vue';
import BaseSelect from '@/features/common/components/BaseSelect.vue';

const props = defineProps({
  ports: { type: Array, default: () => [] },
  initial: { type: Object, default: () => ({}) }, // berisi origin, destination, dan date
  submitLabel: { type: String, default: 'Cari jadwal' },
});
const emit = defineEmits(['search']);

const form = reactive({ origin: '', destination: '', date: todayInput() });
const errors = ref({});

watch(() => props.initial, (v) => {
  form.origin = v.origin ? Number(v.origin) : '';
  form.destination = v.destination ? Number(v.destination) : '';
  form.date = v.date || todayInput();
}, { immediate: true });

const options = computed(() => props.ports.map((p) => ({ value: p.id, label: p.name })));

function swap() {
  [form.origin, form.destination] = [form.destination, form.origin];
}

function validate() {
  const e = {};
  if (!form.origin) e.origin = 'Pilih pelabuhan asal';
  if (!form.destination) e.destination = 'Pilih pelabuhan tujuan';
  else if (form.destination === form.origin) e.destination = 'Tujuan harus berbeda dari asal';
  if (!form.date) e.date = 'Pilih tanggal';
  errors.value = e;
  return Object.keys(e).length === 0;
}

function submit() {
  if (validate()) emit('search', { origin: form.origin, destination: form.destination, date: form.date });
}

defineExpose({ form });
</script>

<template>
  <form class="grid gap-4 sm:grid-cols-[1fr_auto_1fr_11rem_auto] sm:items-start" novalidate @submit.prevent="submit">
    <BaseSelect id="origin" v-model="form.origin" label="Asal" :options="options" :error="errors.origin" />
    <button
      type="button"
      class="mt-7 hidden h-10 w-10 items-center justify-center rounded-full border border-lake-200 text-lake-700 transition hover:bg-lake-50 sm:flex"
      aria-label="Tukar asal dan tujuan"
      @click="swap"
    >
      <AppIcon name="swap" :size="18" />
    </button>
    <BaseSelect id="destination" v-model="form.destination" label="Tujuan" :options="options" :error="errors.destination" />
    <BaseInput id="date" v-model="form.date" type="date" label="Tanggal" :min="todayInput()" :error="errors.date" />
    <div class="sm:mt-7">
      <BaseButton type="submit" variant="accent" size="lg" class="w-full"><AppIcon name="search" :size="18" /> {{ submitLabel }}</BaseButton>
    </div>
  </form>
</template>
