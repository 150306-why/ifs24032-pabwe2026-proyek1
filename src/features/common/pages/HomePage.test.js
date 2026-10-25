import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { apiError, mountWithApp } from '@/test-utils';

vi.mock('@/features/schedules/api/catalogApi', () => ({
  fetchPorts: vi.fn(),
  fetchSchedules: vi.fn(),
  fetchSchedule: vi.fn(),
  fetchRoutes: vi.fn(),
}));

import { fetchPorts, fetchRoutes } from '@/features/schedules/api/catalogApi';
import HomePage from './HomePage.vue';

const PORTS = [{ id: 1, name: 'Ajibata' }, { id: 2, name: 'Tomok' }];
const ROUTES = [{
  id: 1, duration_min: 60, origin: PORTS[0], destination: PORTS[1], fares: { dewasa: 20000, anak: 12000 },
}];

async function render() {
  const app = await mountWithApp(HomePage);
  await flushPromises();
  return app;
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchPorts.mockResolvedValue(PORTS);
    fetchRoutes.mockResolvedValue(ROUTES);
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

  it('menampilkan rute penyeberangan dan membuka jadwalnya saat dipilih', async () => {
    const { wrapper, router } = await render();
    expect(wrapper.text()).toContain('Rute penyeberangan');
    const card = wrapper.findAll('button').find((b) => b.text().includes('Ajibata') && b.text().includes('Tomok'));
    await card.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.name).toBe('schedules');
    expect(router.currentRoute.value.query).toMatchObject({ origin: '1', destination: '2' });
  });

  it('tanpa data rute, bagian rute disembunyikan', async () => {
    fetchRoutes.mockResolvedValue([]);
    const { wrapper } = await render();
    expect(wrapper.text()).not.toContain('Rute penyeberangan');
  });

  it('tombol tukar menukar asal dan tujuan', async () => {
    const { wrapper } = await render();
    await wrapper.find('#origin').setValue('1');
    await wrapper.find('#destination').setValue('2');
    await wrapper.find('button[aria-label="Tukar asal dan tujuan"]').trigger('click');
    expect(wrapper.find('#origin').element.value).toBe('2');
    expect(wrapper.find('#destination').element.value).toBe('1');
  });

  it('gagal memuat pelabuhan menampilkan pesan error', async () => {
    fetchPorts.mockRejectedValue(apiError('Server sibuk', undefined, 500));
    const { wrapper } = await render();
    expect(wrapper.find('[role="alert"]').text()).toBe('Server sibuk');
  });
});
