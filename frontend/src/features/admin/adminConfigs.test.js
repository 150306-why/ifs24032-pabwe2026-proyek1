import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/admin/api/adminApi', () => ({
  resourceApi: vi.fn((path) => ({ path })),
}));

import { OPTION_SOURCES, RESOURCES } from './adminConfigs';
import { squash } from '@/test-utils';

const route = {
  id: 3,
  duration_min: 90,
  origin: { id: 1, name: 'Ajibata' },
  destination: { id: 2, name: 'Tomok' },
  fares: { dewasa: 20000, anak: 12000 },
};
const schedule = {
  id: 9,
  departure_at: '2030-01-01T01:00:00.000Z',
  capacity: 120,
  booked: 5,
  status: 'open',
  route: { id: 3, origin: route.origin, destination: route.destination },
  boat: { id: 1, name: 'KMP Toba Sejahtera' },
};

describe('adminConfigs', () => {
  it('setiap resource memakai API dengan path yang sesuai', () => {
    expect(RESOURCES.ports.api.path).toBe('/ports');
    expect(RESOURCES.boats.api.path).toBe('/boats');
    expect(RESOURCES.routes.api.path).toBe('/routes');
    expect(RESOURCES.schedules.api.path).toBe('/schedules');
  });

  it('OPTION_SOURCES membuat label yang mudah dibaca', () => {
    expect(OPTION_SOURCES.ports.label({ name: 'Tomok' })).toBe('Tomok');
    expect(OPTION_SOURCES.boats.label({ name: 'KMP A', capacity: 120 })).toBe('KMP A (120 kursi)');
    expect(OPTION_SOURCES.routes.label(route)).toBe('Ajibata → Tomok');
  });

  describe('ports', () => {
    const c = RESOURCES.ports;
    it('form dan payload', () => {
      expect(c.emptyForm()).toEqual({ name: '' });
      expect(c.toForm({ id: 1, name: 'Ajibata' })).toEqual({ name: 'Ajibata' });
      expect(c.toPayload({ name: '  Tomok ' })).toEqual({ name: 'Tomok' });
    });
    it('kolom', () => {
      expect(c.columns[0].value({ name: 'Ajibata' })).toBe('Ajibata');
    });
  });

  describe('boats', () => {
    const c = RESOURCES.boats;
    it('form dan payload mengubah kapasitas menjadi angka', () => {
      expect(c.emptyForm()).toEqual({ name: '', type: '', capacity: '' });
      expect(c.toForm({ name: 'KMP', type: 'ferry', capacity: 100 })).toEqual({ name: 'KMP', type: 'ferry', capacity: 100 });
      expect(c.toPayload({ name: ' KMP ', type: 'ferry', capacity: '100' })).toEqual({ name: 'KMP', type: 'ferry', capacity: 100 });
      expect(c.toPayload({ name: 'KMP', type: 'ferry', capacity: '' }).capacity).toBeUndefined();
    });
    it('kolom', () => {
      expect(c.columns.map((col) => col.value({ name: 'KMP', type: 'ferry', capacity: 100 }))).toEqual(['KMP', 'ferry', 100]);
    });
  });

  describe('routes', () => {
    const c = RESOURCES.routes;
    it('form dan payload memetakan tarif ke objek fares', () => {
      expect(c.emptyForm()).toMatchObject({ origin_port_id: '', fare_dewasa: '', fare_anak: '' });
      expect(c.toForm(route)).toEqual({
        origin_port_id: 1, destination_port_id: 2, duration_min: 90, fare_dewasa: 20000, fare_anak: 12000,
      });
      expect(c.toPayload({
        origin_port_id: '1', destination_port_id: '2', duration_min: '90', fare_dewasa: '20000', fare_anak: '0',
      })).toEqual({
        origin_port_id: 1, destination_port_id: 2, duration_min: 90, fares: { dewasa: 20000, anak: 0 },
      });
    });
    it('kolom', () => {
      const [name, duration, fares] = c.columns.map((col) => col.value(route));
      expect(name).toBe('Ajibata → Tomok');
      expect(duration).toBe('90 mnt');
      expect(squash(fares)).toBe('Rp20.000/Rp12.000');
    });
  });

  describe('schedules', () => {
    const c = RESOURCES.schedules;
    it('memakai list khusus admin', () => {
      expect(c.api.path).toBe('/schedules');
    });
    it('toForm mengisi field dari jadwal', () => {
      const form = c.toForm(schedule);
      expect(form).toMatchObject({ route_id: 3, boat_id: 1, capacity: 120, status: 'open' });
      expect(form.departure_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });
    it('payload tambah menyertakan route_id, payload ubah menyertakan status', () => {
      const form = { route_id: '3', boat_id: '1', departure_at: '2030-01-01T08:00', capacity: '', status: 'closed' };
      const iso = new Date('2030-01-01T08:00').toISOString();
      expect(c.toPayload(form, false)).toEqual({
        boat_id: 1, departure_at: iso, capacity: undefined, route_id: 3,
      });
      expect(c.toPayload(form, true)).toEqual({
        boat_id: 1, departure_at: iso, capacity: undefined, status: 'closed',
      });
    });
    it('waktu kosong menghasilkan undefined', () => {
      expect(c.toPayload({ ...c.emptyForm(), route_id: 1, boat_id: 1 }, false).departure_at).toBeUndefined();
    });
    it('kolom', () => {
      const values = c.columns.map((col) => col.value(schedule));
      expect(values[0]).toBe('Ajibata → Tomok');
      expect(values[1]).toBe('KMP Toba Sejahtera');
      expect(values[2]).toMatch(/WIB$/);
      expect(values[3]).toBe('5/120');
      expect(values[4]).toBe('open');
    });
    it('emptyForm', () => {
      expect(c.emptyForm()).toEqual({ route_id: '', boat_id: '', departure_at: '', capacity: '', status: 'open' });
    });
  });
});
