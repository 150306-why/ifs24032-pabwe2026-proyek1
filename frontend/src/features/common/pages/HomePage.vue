<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchPorts, fetchRoutes } from '@/features/schedules/api/catalogApi';
import { useAsync } from '@/hooks/useAsync';
import { dateInputFromToday, formatDuration, formatRupiah } from '@/helpers/formatHelper';
import AppIcon from '@/features/common/components/AppIcon.vue';
import LakeScene from '@/features/common/components/LakeScene.vue';
import RouteSearchForm from '@/features/schedules/components/RouteSearchForm.vue';

const router = useRouter();
const ports = useAsync(fetchPorts);
const routes = useAsync(fetchRoutes);

const popular = computed(() => (routes.data.value || []).slice(0, 6));

function search(query) {
  router.push({ name: 'schedules', query });
}

function openRoute(r) {
  search({ origin: r.origin.id, destination: r.destination.id, date: dateInputFromToday(0) });
}

const STEPS = [
  { icon: 'search', title: 'Pilih jadwal', text: 'Cari rute dan tanggal, lihat tarif serta sisa kursi langsung.' },
  { icon: 'wallet', title: 'Bayar dalam 15 menit', text: 'Isi data penumpang, lalu selesaikan pembayaran sebelum waktu habis.' },
  { icon: 'qr', title: 'Tunjukkan kode QR', text: 'Tiket ada di ponsel Anda. Petugas memindainya saat naik kapal.' },
];

onMounted(() => {
  ports.run();
  routes.run();
});
</script>

<template>
  <div class="-mt-8">
    <section class="relative -mx-4 overflow-hidden bg-lake-900 text-white sm:mx-0 sm:mt-8 sm:rounded-3xl">
      <div class="absolute inset-0 opacity-90"><LakeScene :ferry-x="590" :sun-x="560" /></div>
      <div class="absolute inset-0 bg-gradient-to-r from-lake-950 via-lake-950/70 to-transparent"></div>
      <div class="relative px-6 pb-28 pt-14 sm:px-12 sm:pb-32 sm:pt-20">
        <h1 class="max-w-2xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">Menyeberang Danau Toba, lebih mudah.</h1>
        <p class="mt-4 max-w-lg text-lg text-lake-100">Pesan tiket kapal penyeberangan dan wisata, bayar dari ponsel, lalu tunjukkan kode QR di pelabuhan.</p>
      </div>
      <div class="ulos-band absolute inset-x-0 bottom-0" aria-hidden="true"></div>
    </section>

    <div class="card relative z-10 -mt-16 mx-auto max-w-5xl !p-5 sm:mx-6 sm:!p-6">
      <RouteSearchForm :ports="ports.data.value || []" @search="search" />
      <p v-if="ports.error.value" class="mt-3 text-sm font-medium text-ulos-700" role="alert">{{ ports.error.value }}</p>
    </div>

    <section v-if="popular.length" class="mt-14" aria-labelledby="rute-populer">
      <h2 id="rute-populer" class="text-2xl font-bold text-lake-900">Rute penyeberangan</h2>
      <p class="mb-5 mt-1 text-slate-600">Pilih salah satu untuk melihat jadwal hari ini.</p>
      <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="r in popular" :key="r.id">
          <button class="card-flat group flex w-full flex-col gap-3 p-5 text-left transition hover:border-lake-400 hover:shadow-lift" @click="openRoute(r)">
            <span class="flex items-center gap-2 text-lg font-bold text-lake-900">
              {{ r.origin.name }} <AppIcon name="arrow" :size="16" class="text-ulos-600" /> {{ r.destination.name }}
            </span>
            <span class="flex items-center justify-between text-sm text-slate-600">
              <span class="inline-flex items-center gap-1.5"><AppIcon name="clock" :size="15" /> {{ formatDuration(r.duration_min) }}</span>
              <span>mulai <strong class="font-display text-base text-pine-700">{{ formatRupiah(r.fares.anak ?? r.fares.dewasa) }}</strong></span>
            </span>
          </button>
        </li>
      </ul>
    </section>

    <section class="mt-14" aria-labelledby="cara-pesan">
      <h2 id="cara-pesan" class="mb-6 text-2xl font-bold text-lake-900">Tiga langkah sampai di atas kapal</h2>
      <ol class="grid gap-4 md:grid-cols-3">
        <li v-for="(s, i) in STEPS" :key="s.title" class="card-flat flex gap-4 p-5">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lake-900 text-gold-300"><AppIcon :name="s.icon" :size="22" /></span>
          <div>
            <h3 class="font-bold text-lake-900"><span class="sr-only">Langkah {{ i + 1 }}: </span>{{ s.title }}</h3>
            <p class="mt-1 text-sm leading-relaxed text-slate-600">{{ s.text }}</p>
          </div>
        </li>
      </ol>
    </section>

    <section class="mt-14 flex flex-col items-start justify-between gap-4 rounded-3xl bg-lake-900 p-6 text-white sm:flex-row sm:items-center sm:p-8">
      <div>
        <h2 class="text-2xl font-bold">Sudah punya tiket?</h2>
        <p class="mt-1 text-lake-200">Masukkan kode tiket untuk memastikan statusnya masih berlaku.</p>
      </div>
      <RouterLink to="/verifikasi" class="inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-3 font-semibold text-lake-950 hover:bg-gold-300">
        <AppIcon name="shield" :size="18" /> Cek keaslian tiket
      </RouterLink>
    </section>
  </div>
</template>
