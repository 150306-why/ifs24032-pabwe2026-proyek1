<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fetchPorts } from '@/features/schedules/api/catalogApi';
import { useAsync } from '@/hooks/useAsync';
import { todayInput } from '@/helpers/formatHelper';
import BaseButton from '@/features/common/components/BaseButton.vue';
import BaseSelect from '@/features/common/components/BaseSelect.vue';
import BaseInput from '@/features/common/components/BaseInput.vue';

const router = useRouter();
const ports = useAsync(fetchPorts);
const form = reactive({ origin: '', destination: '', date: todayInput() });
const errors = ref({});

const options = computed(() => (ports.data.value || []).map((p) => ({ value: p.id, label: p.name })));

function validate() {
  const e = {};
  if (!form.origin) e.origin = 'Pilih pelabuhan asal';
  if (!form.destination) e.destination = 'Pilih pelabuhan tujuan';
  else if (form.destination === form.origin) e.destination = 'Tujuan harus berbeda dari asal';
  if (!form.date) e.date = 'Pilih tanggal';
  errors.value = e;
  return Object.keys(e).length === 0;
}

function search() {
  if (!validate()) return;
  router.push({ name: 'schedules', query: { origin: form.origin, destination: form.destination, date: form.date } });
}

onMounted(ports.run);
</script>

<template>
  <section>
    <div class="mb-6 rounded-2xl bg-gradient-to-br from-lake-700 to-pine-600 p-6 text-white sm:p-10">
      <h1 class="text-3xl font-bold sm:text-4xl">Menyeberang Danau Toba, lebih mudah.</h1>
      <p class="mt-2 max-w-xl text-lake-100">Pesan tiket kapal penyeberangan dan wisata, bayar, lalu tunjukkan kode QR di pelabuhan.</p>
    </div>

    <form class="card grid gap-4 sm:grid-cols-4 sm:items-end" novalidate @submit.prevent="search">
      <BaseSelect id="origin" v-model="form.origin" label="Asal" :options="options" :error="errors.origin" />
      <BaseSelect id="destination" v-model="form.destination" label="Tujuan" :options="options" :error="errors.destination" />
      <BaseInput id="date" v-model="form.date" type="date" label="Tanggal" :min="todayInput()" :error="errors.date" />
      <BaseButton type="submit">Cari jadwal</BaseButton>
      <p v-if="ports.error.value" class="text-sm text-red-700 sm:col-span-4" role="alert">{{ ports.error.value }}</p>
    </form>
  </section>
</template>
