<script setup>
import { computed, onMounted } from 'vue';
import { fetchStats } from '@/features/admin/api/adminApi';
import { useAuthStore } from '@/features/auth/states/authStore';
import { useAsync } from '@/hooks/useAsync';
import { formatRupiah, formatTime } from '@/helpers/formatHelper';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader.vue';
import StatCard from '@/features/admin/components/StatCard.vue';
import AsyncState from '@/features/common/components/AsyncState.vue';
import AppIcon from '@/features/common/components/AppIcon.vue';

const auth = useAuthStore();
const loader = useAsync(fetchStats);
const stats = computed(() => loader.data.value);

const maxRevenue = computed(() => Math.max(1, ...(stats.value?.revenue_by_day || []).map((d) => d.total)));
const weekTotal = computed(() => (stats.value?.revenue_by_day || []).reduce((sum, d) => sum + d.total, 0));

const dayLabel = (iso) => new Intl.DateTimeFormat('id-ID', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
const barHeight = (total) => `${Math.max(total === 0 ? 2 : 6, Math.round((total / maxRevenue.value) * 100))}%`;

const STATUS_ROWS = [
  { key: 'paid', label: 'Lunas', bar: 'bg-pine-500' },
  { key: 'pending', label: 'Menunggu bayar', bar: 'bg-gold-400' },
  { key: 'cancelled', label: 'Dibatalkan', bar: 'bg-slate-400' },
];
const statusShare = (key) => {
  const total = stats.value?.totals.bookings || 0;
  return total === 0 ? 0 : Math.round((stats.value.bookings_by_status[key] / total) * 100);
};
const fill = (d) => (d.capacity ? Math.round((d.booked / d.capacity) * 100) : 0);

onMounted(loader.run);
</script>

<template>
  <section>
    <AdminPageHeader :title="`Halo, ${auth.user?.name?.split(' ')[0] || 'Admin'}`" lead="Ringkasan operasional Toba Tix hari ini.">
      <template #actions>
        <RouterLink to="/admin/checkin" class="inline-flex items-center gap-2 rounded-xl bg-lake-800 px-4 py-2.5 font-semibold text-white hover:bg-lake-900">
          <AppIcon name="scan" :size="18" /> Check-in tiket
        </RouterLink>
      </template>
    </AdminPageHeader>

    <AsyncState :loading="loader.loading.value && !stats" :error="loader.error.value" @retry="loader.run">
      <div v-if="stats" class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Pendapatan (lunas)" :value="formatRupiah(stats.totals.revenue)" icon="wallet" tone="pine" :hint="`${formatRupiah(weekTotal)} dalam 7 hari`" />
          <StatCard label="Total booking" :value="stats.totals.bookings" icon="ticket" tone="lake" :hint="`${stats.bookings_by_status.pending} menunggu pembayaran`" />
          <StatCard label="Tiket terjual" :value="stats.totals.tickets_sold" icon="qr" tone="ulos" :hint="`${stats.totals.checked_in_today} check-in hari ini`" />
          <StatCard label="Pelanggan" :value="stats.totals.customers" icon="users" tone="gold" :hint="`${stats.totals.upcoming_schedules} jadwal akan datang`" />
        </div>

        <div class="grid gap-6 lg:grid-cols-3">
          <div class="card lg:col-span-2">
            <div class="mb-4 flex items-baseline justify-between">
              <h2 class="text-lg font-bold text-lake-900">Pendapatan 7 hari terakhir</h2>
              <p class="text-sm text-slate-500">Booking lunas, per hari booking dibuat</p>
            </div>
            <div class="flex h-48 items-end gap-3 border-b border-lake-100 pb-px" role="img" :aria-label="`Grafik pendapatan 7 hari, total ${formatRupiah(weekTotal)}`">
              <div v-for="(d, i) in stats.revenue_by_day" :key="d.date" class="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span class="text-[11px] font-medium text-slate-500">{{ d.total ? formatRupiah(d.total).replace('Rp', '') : '' }}</span>
                <div class="w-full rounded-t-lg" :class="i === stats.revenue_by_day.length - 1 ? 'bg-ulos-600' : 'bg-lake-600'" :style="{ height: barHeight(d.total) }" :title="`${d.date}: ${formatRupiah(d.total)}`"></div>
              </div>
            </div>
            <div class="mt-2 flex gap-3">
              <span v-for="d in stats.revenue_by_day" :key="d.date" class="flex-1 text-center text-xs text-slate-500">{{ dayLabel(d.date) }}</span>
            </div>
            <table class="sr-only">
              <caption>Pendapatan per hari</caption>
              <tr v-for="d in stats.revenue_by_day" :key="d.date"><th scope="row">{{ d.date }}</th><td>{{ formatRupiah(d.total) }}</td></tr>
            </table>
          </div>

          <div class="card">
            <h2 class="mb-4 text-lg font-bold text-lake-900">Status booking</h2>
            <ul class="space-y-4">
              <li v-for="row in STATUS_ROWS" :key="row.key">
                <div class="mb-1 flex justify-between text-sm">
                  <span class="font-medium text-lake-900">{{ row.label }}</span>
                  <span class="text-slate-600">{{ stats.bookings_by_status[row.key] }} ({{ statusShare(row.key) }}%)</span>
                </div>
                <div class="h-2.5 overflow-hidden rounded-full bg-lake-50"><div class="h-full rounded-full" :class="row.bar" :style="{ width: `${statusShare(row.key)}%` }"></div></div>
              </li>
            </ul>
            <RouterLink to="/admin/bookings" class="link mt-5 inline-block text-sm">Lihat semua booking</RouterLink>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <div class="card">
            <h2 class="mb-4 text-lg font-bold text-lake-900">Keberangkatan hari ini</h2>
            <p v-if="stats.today_departures.length === 0" class="rounded-xl bg-lake-50 px-4 py-6 text-center text-slate-600">Tidak ada keberangkatan hari ini.</p>
            <ul v-else class="divide-y divide-lake-50">
              <li v-for="d in stats.today_departures" :key="d.id" class="py-3">
                <div class="flex items-center justify-between gap-3">
                  <p class="font-semibold text-lake-900">{{ d.origin }} → {{ d.destination }}</p>
                  <p class="font-display text-lg font-bold text-lake-800">{{ formatTime(d.departure_at) }}</p>
                </div>
                <div class="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                  <span class="flex-1 truncate">{{ d.boat }}</span>
                  <span>{{ d.booked }}/{{ d.capacity }} kursi</span>
                </div>
                <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-lake-50"><div class="h-full rounded-full bg-lake-600" :style="{ width: `${fill(d)}%` }"></div></div>
              </li>
            </ul>
          </div>

          <div class="card">
            <h2 class="mb-4 text-lg font-bold text-lake-900">Rute terlaris</h2>
            <p v-if="stats.top_routes.length === 0" class="rounded-xl bg-lake-50 px-4 py-6 text-center text-slate-600">Belum ada tiket terjual.</p>
            <ol v-else class="divide-y divide-lake-50">
              <li v-for="r in stats.top_routes" :key="`${r.origin}-${r.destination}`" class="flex items-center justify-between gap-3 py-3">
                <div>
                  <p class="font-semibold text-lake-900">{{ r.origin }} → {{ r.destination }}</p>
                  <p class="text-xs text-slate-500">{{ r.tickets }} tiket</p>
                </div>
                <p class="font-semibold text-pine-700">{{ formatRupiah(r.revenue) }}</p>
              </li>
            </ol>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <RouterLink v-for="q in [
            { to: '/admin/schedules', icon: 'calendar', label: 'Kelola jadwal', n: stats.totals.upcoming_schedules, unit: 'jadwal akan datang' },
            { to: '/admin/routes', icon: 'route', label: 'Kelola rute', n: stats.totals.routes, unit: 'rute aktif' },
            { to: '/admin/boats', icon: 'ship', label: 'Kelola kapal', n: stats.totals.boats, unit: 'kapal terdaftar' },
          ]" :key="q.to" :to="q.to" class="card-flat flex items-center gap-3 p-4 transition hover:border-lake-400 hover:shadow-lift">
            <AppIcon :name="q.icon" :size="22" class="text-lake-700" />
            <div><p class="font-semibold text-lake-900">{{ q.label }}</p><p class="text-xs text-slate-500">{{ q.n }} {{ q.unit }}</p></div>
            <AppIcon name="arrow" :size="18" class="ml-auto text-lake-400" />
          </RouterLink>
        </div>
      </div>
    </AsyncState>
  </section>
</template>
