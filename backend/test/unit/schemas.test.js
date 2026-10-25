const { registerSchema, loginSchema } = require('../../src/modules/auth/auth.schema');
const { boatSchema } = require('../../src/modules/boats/boats.schema');
const { portSchema } = require('../../src/modules/ports/ports.schema');
const { routeSchema } = require('../../src/modules/routes/routes.schema');
const {
  listQuerySchema, createScheduleSchema, updateScheduleSchema,
} = require('../../src/modules/schedules/schedules.schema');
const { createBookingSchema, MAX_PASSENGERS } = require('../../src/modules/bookings/bookings.schema');
const { idParam, codeParam } = require('../../src/modules/common.schema');

const ok = (schema, value) => schema.safeParse(value).success;

describe('auth.schema', () => {
  it('register: trim nama, email dinormalisasi', () => {
    const r = registerSchema.parse({ name: '  Budi  ', email: ' Budi@Test.COM ', password: 'password123' });
    expect(r).toEqual({ name: 'Budi', email: 'budi@test.com', password: 'password123' });
  });

  it('register: menolak nama pendek, email salah, password pendek/panjang', () => {
    const base = { name: 'Budi', email: 'budi@test.com', password: 'password123' };
    expect(ok(registerSchema, { ...base, name: 'B' })).toBe(false);
    expect(ok(registerSchema, { ...base, email: 'bukan-email' })).toBe(false);
    expect(ok(registerSchema, { ...base, password: '1234567' })).toBe(false);
    expect(ok(registerSchema, { ...base, password: 'a'.repeat(73) })).toBe(false);
    expect(ok(registerSchema, base)).toBe(true);
  });

  it('login: password wajib', () => {
    expect(ok(loginSchema, { email: 'a@b.co', password: '' })).toBe(false);
    expect(ok(loginSchema, { email: 'a@b.co', password: 'x' })).toBe(true);
    expect(ok(loginSchema, { email: 'salah', password: 'x' })).toBe(false);
  });
});

describe('boats.schema', () => {
  const base = { name: 'KM Uji', type: 'ferry', capacity: 10 };

  it('menerima data valid', () => {
    expect(ok(boatSchema, base)).toBe(true);
    ['ferry', 'speedboat', 'wisata'].forEach((type) => expect(ok(boatSchema, { ...base, type })).toBe(true));
  });

  it('menolak tipe, kapasitas, dan nama tidak valid', () => {
    expect(ok(boatSchema, { ...base, type: 'kano' })).toBe(false);
    expect(ok(boatSchema, { ...base, capacity: 0 })).toBe(false);
    expect(ok(boatSchema, { ...base, capacity: 1001 })).toBe(false);
    expect(ok(boatSchema, { ...base, capacity: 1.5 })).toBe(false);
    expect(ok(boatSchema, { ...base, capacity: '10' })).toBe(false);
    expect(ok(boatSchema, { ...base, name: 'K' })).toBe(false);
  });
});

describe('ports.schema', () => {
  it('nama minimal 2 karakter', () => {
    expect(ok(portSchema, { name: 'A' })).toBe(false);
    expect(ok(portSchema, { name: ' Ajibata ' })).toBe(true);
    expect(portSchema.parse({ name: ' Tomok ' }).name).toBe('Tomok');
  });
});

describe('routes.schema', () => {
  const base = { origin_port_id: 1, destination_port_id: 2, duration_min: 60, fares: { dewasa: 20000, anak: 12000 } };

  it('menerima data valid', () => {
    expect(ok(routeSchema, base)).toBe(true);
  });

  it('asal dan tujuan sama ditolak pada field destination_port_id', () => {
    const result = routeSchema.safeParse({ ...base, destination_port_id: 1 });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(['destination_port_id']);
  });

  it('menolak durasi, tarif, dan field wajib yang tidak valid', () => {
    expect(ok(routeSchema, { ...base, duration_min: 1441 })).toBe(false);
    expect(ok(routeSchema, { ...base, duration_min: 0 })).toBe(false);
    expect(ok(routeSchema, { ...base, fares: { dewasa: -1, anak: 0 } })).toBe(false);
    expect(ok(routeSchema, { ...base, fares: { dewasa: 1000 } })).toBe(false);
    expect(ok(routeSchema, { ...base, origin_port_id: 0 })).toBe(false);
  });
});

describe('schedules.schema', () => {
  it('listQuerySchema: nilai bawaan', () => {
    expect(listQuerySchema.parse({})).toEqual({ page: 1, limit: 10, order: 'asc' });
  });

  it('listQuerySchema: string di-coerce menjadi angka', () => {
    const r = listQuerySchema.parse({ origin: '1', destination: '2', date: '2026-10-25', page: '3', limit: '5' });
    expect(r).toEqual({
      origin: 1, destination: 2, date: '2026-10-25', page: 3, limit: 5, order: 'asc',
    });
  });

  it('listQuerySchema: menolak batas dan format tidak valid', () => {
    expect(ok(listQuerySchema, { limit: '51' })).toBe(false);
    expect(ok(listQuerySchema, { limit: '0' })).toBe(false);
    expect(ok(listQuerySchema, { page: '0' })).toBe(false);
    expect(ok(listQuerySchema, { origin: '0' })).toBe(false);
    expect(ok(listQuerySchema, { date: 'besok' })).toBe(false);
    expect(ok(listQuerySchema, { date: '2026-13-45' })).toBe(false);
  });

  it('createScheduleSchema', () => {
    const base = { route_id: 1, boat_id: 1, departure_at: '2030-01-01T01:00:00.000Z' };
    expect(ok(createScheduleSchema, base)).toBe(true);
    expect(ok(createScheduleSchema, { ...base, capacity: 5 })).toBe(true);
    expect(ok(createScheduleSchema, { ...base, departure_at: 'besok' })).toBe(false);
    expect(ok(createScheduleSchema, { ...base, capacity: 0 })).toBe(false);
    expect(ok(createScheduleSchema, { boat_id: 1, departure_at: base.departure_at })).toBe(false);
  });

  it('updateScheduleSchema: parsial, tetapi tidak boleh kosong', () => {
    const empty = updateScheduleSchema.safeParse({});
    expect(empty.success).toBe(false);
    expect(empty.error.issues[0].message).toBe('Minimal satu field harus diisi');
    expect(ok(updateScheduleSchema, { status: 'closed' })).toBe(true);
    expect(ok(updateScheduleSchema, { status: 'tutup' })).toBe(false);
    expect(ok(updateScheduleSchema, { capacity: 10, boat_id: 2 })).toBe(true);
  });
});

describe('bookings.schema', () => {
  const pax = (n) => Array.from({ length: n }, (_, i) => ({ name: `Penumpang ${i + 1}`, category: 'dewasa' }));

  it('batas penumpang 1..MAX_PASSENGERS', () => {
    expect(MAX_PASSENGERS).toBe(10);
    expect(ok(createBookingSchema, { schedule_id: 1, passengers: pax(0) })).toBe(false);
    expect(ok(createBookingSchema, { schedule_id: 1, passengers: pax(1) })).toBe(true);
    expect(ok(createBookingSchema, { schedule_id: 1, passengers: pax(10) })).toBe(true);
    expect(ok(createBookingSchema, { schedule_id: 1, passengers: pax(11) })).toBe(false);
  });

  it('menolak kategori, nama, dan schedule_id tidak valid', () => {
    expect(ok(createBookingSchema, { schedule_id: 1, passengers: [{ name: 'Budi', category: 'bayi' }] })).toBe(false);
    expect(ok(createBookingSchema, { schedule_id: 1, passengers: [{ name: 'B', category: 'dewasa' }] })).toBe(false);
    expect(ok(createBookingSchema, { schedule_id: 0, passengers: pax(1) })).toBe(false);
  });
});

describe('common.schema', () => {
  it('idParam meng-coerce string menjadi angka positif', () => {
    expect(idParam.parse({ id: '5' })).toEqual({ id: 5 });
    expect(ok(idParam, { id: '0' })).toBe(false);
    expect(ok(idParam, { id: 'abc' })).toBe(false);
    expect(ok(idParam, { id: '1.5' })).toBe(false);
  });

  it('codeParam: trim dan huruf besar, panjang 3..40', () => {
    expect(codeParam.parse({ code: ' tt-abc ' })).toEqual({ code: 'TT-ABC' });
    expect(ok(codeParam, { code: 'ab' })).toBe(false);
    expect(ok(codeParam, { code: 'x'.repeat(41) })).toBe(false);
  });
});
