<script setup>
// Ilustrasi dekoratif: pegunungan di tepi Danau Toba, Pulau Samosir, dan kapal penyeberangan.
defineProps({
  dark: Boolean,
  // Posisi horizontal kapal dan matahari (koordinat viewBox 0-800); disesuaikan agar tidak terpotong.
  ferryX: { type: Number, default: 300 },
  sunX: { type: Number, default: 470 },
});
</script>

<template>
  <svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMax slice" class="h-full w-full" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="dark ? '#07222d' : '#0c2f3b'" />
        <stop offset="1" :stop-color="dark ? '#174d5f' : '#2f7b8f'" />
      </linearGradient>
      <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1f6176" />
        <stop offset="1" stop-color="#0c2f3b" />
      </linearGradient>
    </defs>
    <rect width="800" height="520" fill="url(#sky)" />
    <circle :cx="sunX" cy="150" r="46" fill="#e3b34f" opacity=".92" />
    <circle :cx="sunX" cy="150" r="78" fill="#e3b34f" opacity=".12" />
    <path d="M0 330 120 230l90 70 110-110 130 120 90-60 120 90 140-80v250H0z" fill="#174d5f" />
    <path d="M0 360 80 300l100 50 90-70 120 80 120-50 110 70 180-60v200H0z" fill="#123e4d" />
    <path d="M250 372c40-34 78-46 120-46s70 12 100 30l30 16H250z" fill="#0c2f3b" />
    <rect y="372" width="800" height="148" fill="url(#water)" />
    <g class="wave-drift">
      <g fill="none" stroke="#82b9c6" stroke-opacity=".35" stroke-width="2" stroke-linecap="round">
        <path v-for="n in 2" :key="n" :transform="`translate(${(n - 1) * 800} 0)`"
          d="M20 410c20-8 40-8 60 0s40 8 60 0 40-8 60 0 40 8 60 0 40-8 60 0 40 8 60 0 40-8 60 0 40 8 60 0 40-8 60 0 40 8 60 0 40-8 60 0 40 8 60 0M0 450c20-8 40-8 60 0s40 8 60 0 40-8 60 0 40 8 60 0 40-8 60 0 40 8 60 0 40-8 60 0 40 8 60 0 40-8 60 0 40 8 60 0 40-8 60 0 40 8 60 0M0 490c20-8 40-8 60 0s40 8 60 0 40-8 60 0 40 8 60 0 40-8 60 0 40 8 60 0 40-8 60 0 40 8 60 0 40-8 60 0 40 8 60 0 40-8 60 0 40 8 60 0" />
      </g>
    </g>
    <g class="ferry" :transform="`translate(${ferryX} 372)`" :style="{ '--fx': `${ferryX}px` }">
      <path d="M0 14h150l-18 26H22z" fill="#fff" />
      <path d="M8 24h134l-4 6H12z" fill="#b8271f" />
      <path d="M26 14V-4h86v18z" fill="#fff" />
      <path d="M26 -4h86l-6-14H36z" fill="#d7eaef" />
      <rect x="40" y="2" width="12" height="8" fill="#2f7b8f" />
      <rect x="60" y="2" width="12" height="8" fill="#2f7b8f" />
      <rect x="80" y="2" width="12" height="8" fill="#2f7b8f" />
      <rect x="98" y="2" width="8" height="8" fill="#2f7b8f" />
      <rect x="86" y="-34" width="14" height="30" fill="#14212b" />
      <rect x="86" y="-26" width="14" height="5" fill="#d09a2c" />
    </g>
  </svg>
</template>

<style scoped>
.wave-drift { animation: wave 14s linear infinite; }
.ferry { animation: bob 5s ease-in-out infinite; }
@keyframes wave { to { transform: translateX(-240px); } }
@keyframes bob { 50% { transform: translate(var(--fx), 376px); } }
</style>
