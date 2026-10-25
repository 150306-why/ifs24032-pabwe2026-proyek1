<script setup>
defineOptions({ inheritAttrs: false });
defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
});
const model = defineModel({ type: [String, Number] });
</script>

<template>
  <div>
    <label :for="id" class="mb-1.5 block text-sm font-semibold text-lake-900">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      v-bind="$attrs"
      :type="type"
      class="input"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
    />
    <p v-if="hint && !error" :id="`${id}-hint`" class="mt-1 text-xs text-slate-500">{{ hint }}</p>
    <p v-if="error" :id="`${id}-error`" role="alert" class="mt-1 text-sm font-medium text-ulos-700">{{ error }}</p>
  </div>
</template>
