<script setup>
defineOptions({ inheritAttrs: false });
defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  options: { type: Array, required: true }, // [{ value, label }]
  placeholder: { type: String, default: 'Pilih…' },
  error: { type: String, default: '' },
});
const model = defineModel({ type: [String, Number] });
</script>

<template>
  <div>
    <label :for="id" class="mb-1.5 block text-sm font-semibold text-lake-900">{{ label }}</label>
    <select
      :id="id"
      v-model="model"
      v-bind="$attrs"
      class="input"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${id}-error` : undefined"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <p v-if="error" :id="`${id}-error`" role="alert" class="mt-1 text-sm font-medium text-ulos-700">{{ error }}</p>
  </div>
</template>
