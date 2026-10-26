import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { apiError, mountWithApp, squash } from '@/test-utils';

vi.mock('@/features/admin/api/adminApi', () => ({ fetchStats: vi.fn(), resourceApi: vi.fn(() => ({})) }));

import { fetchStats } from '@/features/admin/api/adminApi';
import AdminDashboardPage from './AdminDashboardPage.vue';

const AUTH = { token: 't', user: { id: 1, name: 'Admin Toba Tix', role: 'admin' } };
const STATS = {
  totals: {
    customers: 4, bookings: 10, revenue: 250000, tickets_sold: 18, checked_in_today: 2,
    upcoming_schedules: 63, ports: 3, boats: 2, routes: 3,
  },
  bookings_by_status: { paid: 5, pending: 3, cancelled: 2 },
  revenue_by_day: [
    '2030-01-01', '2030-01-02', '2030-01-03', '2030-01-04', '2030-01-05', '2030-01-06', '2030-01-07',
  ].map((date, i) => ({ date, total: i === 6 ? 100000 : 0 })),
  top_routes: [{ origin: 'Ajibata', destination: 'Tomok', tickets: 12, revenue: 240000 }],
  today_departures: [{
    id: 1, departure_at: '2030-01-07T01:00:00.000Z', capacity: 120, booked: 60, status: 'open', origin: 'Ajibata', destination: 'Tomok', boat: 'KMP Toba Sejahtera',
  }],
};

const render = async () => {
  const app = await mountWithApp(AdminDashboardPage, { route: '/admin', auth: AUTH });
  await flushPromises();
  return app;
};

describe('AdminDashboardPage', () => {
  beforeEach(() => { vi.resetAllMocks(); fetchStats.mockResolvedValue(STATS); });

  it('menyapa admin dan menampilkan kartu ringkasan', async () => {
    const { wrapper } = await render();
    const text = squash(wrapper.text());
    expect(wrapper.find('h1').text()).toBe('Halo, Admin');
    expect(text).toContain('Rp250.000');
    expect(text).toContain('Totalbooking10');
    expect(text).toContain('Tiketterjual18');
    expect(text).toContain('3menunggupembayaran');
    expect(text).toContain('2check-inhariini');
  });

  it('menampilkan persentase status booking dan rute terlaris', async () => {
    const { wrapper } = await render();
    const text = wrapper.text();
    expect(text).toContain('5 (50%)');
    expect(text).toContain('3 (30%)');
    expect(text).toContain('2 (20%)');
    expect(text).toContain('12 tiket');
  });

  it('grafik 7 hari punya tabel alternatif untuk pembaca layar', async () => {
    const { wrapper } = await render();
    expect(wrapper.findAll('table.sr-only tr')).toHaveLength(7);
    expect(wrapper.find('figure figcaption').text()).toContain('Rp');
  });

  it('keberangkatan hari ini menampilkan keterisian kursi', async () => {
    const { wrapper } = await render();
    expect(wrapper.text()).toContain('60/120 kursi');
  });

  it('tanpa data menampilkan keadaan kosong dan tanpa pembagian nol', async () => {
    fetchStats.mockResolvedValue({
      ...STATS,
      totals: { ...STATS.totals, bookings: 0 },
      bookings_by_status: { paid: 0, pending: 0, cancelled: 0 },
      top_routes: [],
      today_departures: [],
    });
    const { wrapper } = await render();
    expect(wrapper.text()).toContain('Tidak ada keberangkatan hari ini');
    expect(wrapper.text()).toContain('Belum ada tiket terjual');
    expect(wrapper.text()).toContain('0 (0%)');
  });

  it('gagal memuat menampilkan error dan bisa dicoba lagi', async () => {
    fetchStats.mockRejectedValueOnce(apiError('Server sibuk', undefined, 500));
    const { wrapper } = await render();
    expect(wrapper.find('[role="alert"]').text()).toContain('Server sibuk');
    await wrapper.findAll('button').find((b) => b.text() === 'Coba lagi').trigger('click');
    await flushPromises();
    expect(wrapper.find('h1').exists()).toBe(true);
    expect(wrapper.text()).toContain('Status booking');
  });
});
