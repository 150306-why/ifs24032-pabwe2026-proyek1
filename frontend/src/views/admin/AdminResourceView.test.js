import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { apiError, findByText, mountWithApp } from '@/test/helpers';

// Satu objek API tiruan per path, dipakai bersama oleh RESOURCES dan OPTION_SOURCES.
const { apis } = vi.hoisted(() => ({ apis: {} }));
vi.mock('@/api/admin', () => ({
  resourceApi: (path) => {
    if (!apis[path]) {
      apis[path] = {
        list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(),
      };
    }
    return apis[path];
  },
  checkInTicket: vi.fn(),
}));

import AdminResourceView from './AdminResourceView.vue';

const PORTS = [{ id: 1, name: 'Ajibata' }, { id: 2, name: 'Tomok' }];
const BOATS = [{ id: 1, name: 'KMP Toba Sejahtera', type: 'ferry', capacity: 120 }];
const ROUTES = [{
  id: 3,
  duration_min: 60,
  origin: { id: 1, name: 'Ajibata' },
  destination: { id: 2, name: 'Tomok' },
  fares: { dewasa: 20000, anak: 12000 },
}];
const SCHEDULES = [{
  id: 9,
  departure_at: '2030-01-01T01:00:00.000Z',
  capacity: 120,
  booked: 5,
  status: 'open',
  route: { id: 3, origin: ROUTES[0].origin, destination: ROUTES[0].destination },
  boat: { id: 1, name: 'KMP Toba Sejahtera' },
}];

async function render(resource) {
  const app = await mountWithApp(AdminResourceView, { route: `/admin/${resource}` });
  await flushPromises();
  return app;
}

const rowTexts = (wrapper) => wrapper.findAll('tbody tr').map((tr) => tr.text());

describe('AdminResourceView', () => {
  let confirm;

  beforeEach(() => {
    Object.values(apis).forEach((api) => Object.values(api).forEach((fn) => fn.mockReset()));
    apis['/ports'].list.mockResolvedValue(PORTS);
    apis['/boats'].list.mockResolvedValue(BOATS);
    apis['/routes'].list.mockResolvedValue(ROUTES);
    apis['/schedules'].list.mockResolvedValue(SCHEDULES);
    confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => { confirm.mockRestore(); });

  describe('pelabuhan', () => {
    it('menampilkan judul, navigasi, dan tabel data', async () => {
      const { wrapper } = await render('ports');
      expect(wrapper.find('h1').text()).toBe('Kelola Pelabuhan');
      expect(wrapper.find('nav[aria-label="Menu admin"]').exists()).toBe(true);
      expect(wrapper.find('caption').text()).toBe('Daftar Pelabuhan');
      const rows = rowTexts(wrapper);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toContain('Ajibata');
      expect(rows[1]).toContain('Tomok');
    });

    it('data kosong menampilkan teks kosong', async () => {
      apis['/ports'].list.mockResolvedValue([]);
      const { wrapper } = await render('ports');
      expect(wrapper.text()).toContain('Belum ada data.');
    });

    it('gagal memuat menampilkan error dan bisa dicoba lagi', async () => {
      apis['/ports'].list.mockRejectedValueOnce(apiError('Gagal memuat', undefined, 500));
      const { wrapper } = await render('ports');
      expect(wrapper.text()).toContain('Gagal memuat');
      await findByText(wrapper, 'button', 'Coba lagi').trigger('click');
      await flushPromises();
      expect(rowTexts(wrapper)).toHaveLength(2);
    });

    it('tambah data: form tampil, simpan memanggil create lalu memuat ulang', async () => {
      apis['/ports'].create.mockResolvedValue({ id: 3, name: 'Baru' });
      const { wrapper } = await render('ports');
      expect(wrapper.find('form').exists()).toBe(false);

      await findByText(wrapper, 'button', '+ Tambah').trigger('click');
      expect(wrapper.find('form').exists()).toBe(true);
      await wrapper.find('#f-name').setValue('  Pelabuhan Baru ');
      await wrapper.find('form').trigger('submit');
      await flushPromises();

      expect(apis['/ports'].create).toHaveBeenCalledWith({ name: 'Pelabuhan Baru' });
      expect(apis['/ports'].list).toHaveBeenCalledTimes(2);
      expect(wrapper.find('form').exists()).toBe(false);
    });

    it('simpan gagal menampilkan pesan dan error field, form tetap terbuka', async () => {
      apis['/ports'].create.mockRejectedValue(apiError('Data tidak valid', { name: 'Nama minimal 2 karakter' }));
      const { wrapper } = await render('ports');
      await findByText(wrapper, 'button', '+ Tambah').trigger('click');
      await wrapper.find('#f-name').setValue('A');
      await wrapper.find('form').trigger('submit');
      await flushPromises();

      expect(wrapper.find('form').exists()).toBe(true);
      expect(wrapper.text()).toContain('Data tidak valid');
      expect(wrapper.text()).toContain('Nama minimal 2 karakter');
    });

    it('ubah data: form terisi, simpan memanggil update', async () => {
      apis['/ports'].update.mockResolvedValue({ id: 1, name: 'Ajibata Baru' });
      const { wrapper } = await render('ports');
      await wrapper.findAll('tbody button').find((b) => b.text() === 'Ubah').trigger('click');
      expect(wrapper.find('#f-name').element.value).toBe('Ajibata');
      expect(findByText(wrapper, 'button', 'Simpan perubahan')).toBeDefined();

      await wrapper.find('#f-name').setValue('Ajibata Baru');
      await wrapper.find('form').trigger('submit');
      await flushPromises();
      expect(apis['/ports'].update).toHaveBeenCalledWith(1, { name: 'Ajibata Baru' });
    });

    it('Batal menutup form tanpa menyimpan', async () => {
      const { wrapper } = await render('ports');
      await findByText(wrapper, 'button', '+ Tambah').trigger('click');
      await findByText(wrapper, 'button', 'Batal').trigger('click');
      expect(wrapper.find('form').exists()).toBe(false);
      expect(apis['/ports'].create).not.toHaveBeenCalled();
    });

    it('hapus: konfirmasi diterima memanggil remove dan memuat ulang', async () => {
      apis['/ports'].remove.mockResolvedValue({});
      const { wrapper } = await render('ports');
      await wrapper.findAll('tbody button').find((b) => b.text() === 'Hapus').trigger('click');
      await flushPromises();
      expect(apis['/ports'].remove).toHaveBeenCalledWith(1);
      expect(apis['/ports'].list).toHaveBeenCalledTimes(2);
    });

    it('hapus: konfirmasi ditolak tidak memanggil API', async () => {
      confirm.mockReturnValue(false);
      const { wrapper } = await render('ports');
      await wrapper.findAll('tbody button').find((b) => b.text() === 'Hapus').trigger('click');
      await flushPromises();
      expect(apis['/ports'].remove).not.toHaveBeenCalled();
    });

    it('hapus gagal menampilkan pesan error', async () => {
      apis['/ports'].remove.mockRejectedValue(apiError('Data masih dipakai data lain', undefined, 409));
      const { wrapper } = await render('ports');
      await wrapper.findAll('tbody button').find((b) => b.text() === 'Hapus').trigger('click');
      await flushPromises();
      expect(wrapper.find('[role="alert"]').text()).toBe('Data masih dipakai data lain');
    });
  });

  describe('kapal', () => {
    it('menampilkan kolom dan menyimpan dengan kapasitas numerik', async () => {
      apis['/boats'].create.mockResolvedValue({});
      const { wrapper } = await render('boats');
      expect(wrapper.find('h1').text()).toBe('Kelola Kapal');
      expect(rowTexts(wrapper)[0]).toContain('KMP Toba Sejahtera');
      expect(rowTexts(wrapper)[0]).toContain('ferry');

      await findByText(wrapper, 'button', '+ Tambah').trigger('click');
      await wrapper.find('#f-name').setValue('Boat Baru');
      await wrapper.find('#f-type').setValue('speedboat');
      await wrapper.find('#f-capacity').setValue('15');
      await wrapper.find('form').trigger('submit');
      await flushPromises();
      expect(apis['/boats'].create).toHaveBeenCalledWith({ name: 'Boat Baru', type: 'speedboat', capacity: 15 });
    });
  });

  describe('rute', () => {
    it('pilihan pelabuhan diambil dari API dan tarif dikirim sebagai objek fares', async () => {
      apis['/routes'].create.mockResolvedValue({});
      const { wrapper } = await render('routes');
      expect(rowTexts(wrapper)[0]).toContain('Ajibata → Tomok');
      expect(rowTexts(wrapper)[0]).toContain('60 mnt');

      await findByText(wrapper, 'button', '+ Tambah').trigger('click');
      const options = wrapper.find('#f-origin_port_id').findAll('option').map((o) => o.text());
      expect(options).toEqual(['Pilih…', 'Ajibata', 'Tomok']);

      await wrapper.find('#f-origin_port_id').setValue('1');
      await wrapper.find('#f-destination_port_id').setValue('2');
      await wrapper.find('#f-duration_min').setValue('45');
      await wrapper.find('#f-fare_dewasa').setValue('25000');
      await wrapper.find('#f-fare_anak').setValue('15000');
      await wrapper.find('form').trigger('submit');
      await flushPromises();
      expect(apis['/routes'].create).toHaveBeenCalledWith({
        origin_port_id: 1,
        destination_port_id: 2,
        duration_min: 45,
        fares: { dewasa: 25000, anak: 15000 },
      });
    });

    it('pilihan gagal dimuat tidak merusak halaman', async () => {
      apis['/ports'].list.mockRejectedValue(new Error('gagal'));
      const { wrapper } = await render('routes');
      await findByText(wrapper, 'button', '+ Tambah').trigger('click');
      expect(wrapper.find('#f-origin_port_id').findAll('option')).toHaveLength(1);
    });
  });

  describe('jadwal', () => {
    it('form tambah menampilkan rute (bukan status), form ubah sebaliknya', async () => {
      const { wrapper } = await render('schedules');
      expect(rowTexts(wrapper)[0]).toContain('5/120');

      await findByText(wrapper, 'button', '+ Tambah').trigger('click');
      expect(wrapper.find('#f-route_id').exists()).toBe(true);
      expect(wrapper.find('#f-status').exists()).toBe(false);
      expect(wrapper.find('#f-route_id').findAll('option').map((o) => o.text())).toContain('Ajibata → Tomok');
      expect(wrapper.find('#f-boat_id').findAll('option').map((o) => o.text())).toContain('KMP Toba Sejahtera (120 kursi)');

      await findByText(wrapper, 'button', 'Batal').trigger('click');
      await wrapper.findAll('tbody button').find((b) => b.text() === 'Ubah').trigger('click');
      expect(wrapper.find('#f-route_id').exists()).toBe(false);
      expect(wrapper.find('#f-status').element.value).toBe('open');
    });

    it('tambah jadwal mengirim payload dengan waktu ISO', async () => {
      apis['/schedules'].create.mockResolvedValue({});
      const { wrapper } = await render('schedules');
      await findByText(wrapper, 'button', '+ Tambah').trigger('click');
      await wrapper.find('#f-route_id').setValue('3');
      await wrapper.find('#f-boat_id').setValue('1');
      await wrapper.find('#f-departure_at').setValue('2030-01-01T08:00');
      await wrapper.find('form').trigger('submit');
      await flushPromises();
      expect(apis['/schedules'].create).toHaveBeenCalledWith({
        route_id: 3,
        boat_id: 1,
        departure_at: new Date('2030-01-01T08:00').toISOString(),
        capacity: undefined,
      });
    });

    it('ubah jadwal mengirim status', async () => {
      apis['/schedules'].update.mockResolvedValue({});
      const { wrapper } = await render('schedules');
      await wrapper.findAll('tbody button').find((b) => b.text() === 'Ubah').trigger('click');
      await wrapper.find('#f-status').setValue('closed');
      await wrapper.find('form').trigger('submit');
      await flushPromises();
      const [id, payload] = apis['/schedules'].update.mock.calls[0];
      expect(id).toBe(9);
      expect(payload.status).toBe('closed');
      expect(payload.boat_id).toBe(1);
      expect(payload.capacity).toBe(120);
    });
  });

  it('berpindah resource lewat route memuat data resource baru dan menutup form', async () => {
    const { wrapper, router } = await render('ports');
    await findByText(wrapper, 'button', '+ Tambah').trigger('click');
    expect(wrapper.find('form').exists()).toBe(true);

    await router.push('/admin/boats');
    await flushPromises();
    expect(wrapper.find('h1').text()).toBe('Kelola Kapal');
    expect(wrapper.find('form').exists()).toBe(false);
    expect(apis['/boats'].list).toHaveBeenCalled();
  });
});
