<script setup>
import { ref, watch } from 'vue';
import QRCode from 'qrcode';

const props = defineProps({
  value: { type: String, required: true },
  size: { type: Number, default: 180 },
});
const src = ref('');

watch(() => props.value, async (value) => {
  src.value = await QRCode.toDataURL(value, { width: props.size, margin: 1 });
}, { immediate: true });
</script>

<template>
  <img v-if="src" :src="src" :width="size" :height="size" :alt="`Kode QR tiket ${value}`" class="rounded border border-slate-200" />
</template>
