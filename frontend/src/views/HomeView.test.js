import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { apiError, mountWithApp } from '@/test/helpers';

vi.mock('@/api/catalog', () => ({
  fetchPorts: vi.fn(),
  fetchSchedules: vi.fn(),
  fetchSchedule: vi.fn(),
}));

import { fetchPorts } from '@/api/catalog';
import HomeView from './HomeView.vue';

const PORTS = [{ id: 1, name: 'Ajibata' }, { id: 2, name: 'Tomok' }];

async function render() {
  const app = await mountWithApp(HomeView);
  await flushPromises();
  return app;
}

describe('HomeView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchPorts.mockResolvedValue(PORTS);
  });

  it('memuat pelabuhan ke pilihan asal dan tujuan', async () => {
    const { wrapper } = await render();
    expect(fetchPorts).toHaveBeenCalledTimes(1);
    expect(wrapper.find('h1').text()).toContain('Danau Toba');
    const origin = wrapper.find('#origin').findAll('option').map((o) => o.text());
    expect(origin).toEqual(['Pilih…', 'Ajibata', 'Tomok']);
    expect(wrapper.find('#destination').findAll('option')).toHaveLength(3);
  });

  it('pencarian kosong menampilkan error asal dan tujuan dan tidak berpindah halaman', async () => {
    const { wrapper, router } = await render();
    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).toContain('Pilih pelabuhan asal');
    expect(wrapper.text()).toContain('Pilih pelabuhan tujuan');
    expect(router.currentRoute.value.name).toBe('home');
  });

  it('tujuan sama dengan asal ditolak', async () => {
    const { wrapper } = await render();
    await wrapper.find('#origin').setValue('1');
    await wrapper.find('#destination').setValue('1');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).toContain('Tujuan harus berbeda dari asal');
  });

  it('tanggal kosong ditolak', async () => {
    const { wrapper } = await render();
    await wrapper.find('#origin').setValue('1');
    await wrapper.find('#destination').setValue('2');
    await wrapper.find('#date').setValue('');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).toContain('Pilih tanggal');
  });

  it('pencarian valid membawa asal, tujuan, dan tanggal ke halaman jadwal', async () => {
    const { wrapper, router } = await render();
    await wrapper.find('#origin').setValue('1');
    await wrapper.find('#destination').setValue('2');
    await wrapper.find('#date').setValue('2030-01-15');
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    expect(router.currentRoute.value.name).toBe('schedules');
    expect(router.currentRoute.value.query).toEqual({ origin: '1', destination: '2', date: '2030-01-15' });
  });

  it('gagal memuat pelabuhan menampilkan pesan error', async () => {
    fetchPorts.mockRejectedValue(apiError('Server sibuk', undefined, 500));
    const { wrapper } = await render();
    expect(wrapper.find('[role="alert"]').text()).toBe('Server sibuk');
  });
});
