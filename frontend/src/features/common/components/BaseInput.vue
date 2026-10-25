<script setup>
defineOptions({ inheritAttrs: false });
defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  error: { type: String, default: '' },
});
const model = defineModel({ type: [String, Number] });
</script>

<template>
  <div>
    <label :for="id" class="mb-1 block text-sm font-medium text-slate-700">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      v-bind="$attrs"
      :type="type"
      class="input"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${id}-error` : undefined"
    />
    <p v-if="error" :id="`${id}-error`" role="alert" class="mt-1 text-sm text-red-700">{{ error }}</p>
  </div>
</template>
