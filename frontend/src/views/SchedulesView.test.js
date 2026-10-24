import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { apiError, findByText, mountWithApp, SAMPLE_SCHEDULE } from '@/test/helpers';

vi.mock('@/api/catalog', () => ({
  fetchPorts: vi.fn(),
  fetchSchedules: vi.fn(),
  fetchSchedule: vi.fn(),
}));

import { fetchSchedules } from '@/api/catalog';
import SchedulesView from './SchedulesView.vue';

const result = (items, pagination) => ({ items, pagination });

async function render(route = '/jadwal?origin=1&destination=2') {
  const app = await mountWithApp(SchedulesView, { route });
  await flushPromises();
  return app;
}

describe('SchedulesView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchSchedules.mockResolvedValue(result([SAMPLE_SCHEDULE], { page: 1, limit: 10, total: 25 }));
  });

  it('memuat jadwal dengan query dari URL dan limit 10', async () => {
    const { wrapper } = await render();
    expect(fetchSchedules).toHaveBeenCalledWith({ origin: '1', destination: '2', limit: 10 });
    expect(wrapper.text()).toContain('Ajibata → Tomok');
    expect(wrapper.text()).toContain('Halaman 1');
  });

  it('tanpa hasil menampilkan teks kosong', async () => {
    fetchSchedules.mockResolvedValue(result([], { page: 1, limit: 10, total: 0 }));
    const { wrapper } = await render();
    expect(wrapper.text()).toContain('Belum ada jadwal untuk pencarian ini');
  });

  it('gagal memuat menampilkan error dan tombol coba lagi memuat ulang', async () => {
    fetchSchedules.mockRejectedValueOnce(apiError('Gagal memuat jadwal', undefined, 500));
    const { wrapper } = await render();
    expect(wrapper.text()).toContain('Gagal memuat jadwal');

    await findByText(wrapper, 'button', 'Coba lagi').trigger('click');
    await flushPromises();
    expect(fetchSchedules).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('Ajibata → Tomok');
  });

  it('halaman pertama: Sebelumnya nonaktif, Berikutnya aktif bila masih ada data', async () => {
    const { wrapper } = await render();
    expect(findByText(wrapper, 'button', 'Sebelumnya').attributes('disabled')).toBeDefined();
    expect(findByText(wrapper, 'button', 'Berikutnya').attributes('disabled')).toBeUndefined();
  });

  it('Berikutnya berpindah ke halaman 2 dan memuat ulang', async () => {
    const { wrapper, router } = await render();
    await findByText(wrapper, 'button', 'Berikutnya').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.page).toBe('2');
    expect(fetchSchedules).toHaveBeenCalledTimes(2);
    expect(fetchSchedules).toHaveBeenLastCalledWith({
      origin: '1', destination: '2', page: '2', limit: 10,
    });
  });

  it('halaman terakhir: Berikutnya nonaktif, Sebelumnya aktif dan kembali ke halaman 1', async () => {
    fetchSchedules.mockResolvedValue(result([SAMPLE_SCHEDULE], { page: 3, limit: 10, total: 25 }));
    const { wrapper, router } = await render('/jadwal?page=3');
    expect(findByText(wrapper, 'button', 'Berikutnya').attributes('disabled')).toBeDefined();

    await findByText(wrapper, 'button', 'Sebelumnya').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.page).toBe('2');
  });
});
