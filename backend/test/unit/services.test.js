const { createDb } = require('../../src/config/db');
const { initDb } = require('../../src/db/init');
const { seedIfEmpty } = require('../../src/db/seed');
const bookings = require('../../src/modules/bookings/bookings.service');
const tickets = require('../../src/modules/tickets/tickets.service');
const schedules = require('../../src/modules/schedules/schedules.service');
const { expectHttpError } = require('../mocks');
const { collectGarbage } = require('../gc');

const admin = { id: 1, role: 'admin' };
const customer = { id: 2, role: 'customer' };
const stranger = { id: 99, role: 'customer' };
const pax = [{ name: 'Budi Santoso', category: 'dewasa' }];

let db;
beforeEach(() => {
  db = createDb(':memory:');
  initDb(db);
  seedIfEmpty(db); // user 1 = admin, user 2 = customer; rute 1 = Ajibata -> Tomok (dewasa 20000, anak 12000)
});
afterEach(() => { db.close(); });
afterAll(() => {
  db = null;
  collectGarbage();
});

const scheduleOf = (routeId = 1) => db
  .prepare('SELECT * FROM schedules WHERE route_id = ? ORDER BY departure_at LIMIT 1')
  .get(routeId);

const newBooking = (passengers = pax, scheduleId = scheduleOf().id) => bookings
  .createBooking(db, customer.id, { schedule_id: scheduleId, passengers });

const bookedOf = (id) => db.prepare('SELECT booked FROM schedules WHERE id = ?').get(id).booked;

describe('bookings.service', () => {
  it('createBooking: pending, harga dari tabel fares, tiket dibuat, batas bayar 15 menit', () => {
    const booking = newBooking([
      { name: 'Budi', category: 'dewasa' },
      { name: 'Ani', category: 'anak' },
    ]);
    expect(booking.status).toBe('pending');
    expect(booking.total).toBe(32000);
    expect(booking.passenger_count).toBe(2);
    expect(booking.tickets).toHaveLength(2);
    booking.tickets.forEach((t) => expect(t.code).toMatch(/^TK-[0-9A-F]{12}$/));
    expect(booking.code).toMatch(/^TT-[0-9A-F]{12}$/);
    expect(Date.parse(booking.expires_at) - Date.parse(booking.created_at)).toBe(bookings.PENDING_TTL_MS);
    expect(bookedOf(booking.schedule.id)).toBe(2);
  });

  it('createBooking: jadwal tidak ada -> 404', () => {
    expectHttpError(() => newBooking(pax, 99999), 404, 'Jadwal tidak ditemukan');
  });

  it('createBooking: jadwal sudah berangkat -> 409', () => {
    const farFuture = new Date('2100-01-01T00:00:00.000Z');
    expectHttpError(
      () => bookings.createBooking(db, customer.id, { schedule_id: scheduleOf().id, passengers: pax }, farFuture),
      409,
      'Jadwal sudah tidak tersedia',
    );
  });

  it('createBooking: jadwal ditutup -> 409', () => {
    const s = scheduleOf();
    db.prepare("UPDATE schedules SET status = 'closed' WHERE id = ?").run(s.id);
    expectHttpError(() => newBooking(pax, s.id), 409, 'Jadwal sudah tidak tersedia');
  });

  it('createBooking: tarif kategori belum ada -> 422', () => {
    db.prepare("DELETE FROM fares WHERE route_id = 1 AND category = 'anak'").run();
    expectHttpError(
      () => newBooking([{ name: 'Ani', category: 'anak' }]),
      422,
      'Tarif anak belum tersedia',
    );
  });

  it('createBooking: kursi tidak cukup -> 409 dan seluruh transaksi dibatalkan', () => {
    const s = scheduleOf();
    db.prepare('UPDATE schedules SET capacity = 1 WHERE id = ?').run(s.id);
    expectHttpError(
      () => newBooking([{ name: 'Budi', category: 'dewasa' }, { name: 'Ani', category: 'dewasa' }], s.id),
      409,
      'Kursi tidak cukup',
    );
    expect(bookedOf(s.id)).toBe(0);
    expect(db.prepare('SELECT COUNT(*) AS n FROM bookings').get().n).toBe(0);
  });

  it('expirePending: 0 jika tidak ada yang kadaluarsa', () => {
    newBooking();
    expect(bookings.expirePending(db)).toBe(0);
  });

  it('expirePending: membatalkan pending kadaluarsa dan mengembalikan kuota', () => {
    const booking = newBooking([{ name: 'A1', category: 'dewasa' }, { name: 'B2', category: 'dewasa' }]);
    expect(bookedOf(booking.schedule.id)).toBe(2);
    const later = new Date(Date.now() + bookings.PENDING_TTL_MS + 60 * 1000);
    expect(bookings.expirePending(db, later)).toBe(1);
    expect(bookedOf(booking.schedule.id)).toBe(0);
    const row = db.prepare('SELECT status FROM bookings WHERE code = ?').get(booking.code);
    expect(row.status).toBe('cancelled');
  });

  it('expirePending: booking paid tidak disentuh', () => {
    const booking = newBooking();
    bookings.pay(db, booking.code, customer);
    const later = new Date(Date.now() + bookings.PENDING_TTL_MS + 60 * 1000);
    expect(bookings.expirePending(db, later)).toBe(0);
    expect(bookedOf(booking.schedule.id)).toBe(1);
  });

  it('listMine: hanya booking milik user, terbaru lebih dulu', () => {
    const first = newBooking();
    const second = newBooking();
    const mine = bookings.listMine(db, customer.id);
    expect(mine.map((b) => b.code)).toEqual([second.code, first.code]);
    expect(mine[0].tickets).toBeUndefined();
    expect(bookings.listMine(db, admin.id)).toEqual([]);
  });

  it('getByCode: pemilik dan admin boleh, orang lain 403, tidak ada 404', () => {
    const { code } = newBooking();
    expect(bookings.getByCode(db, code, customer).code).toBe(code);
    expect(bookings.getByCode(db, code, admin).tickets).toHaveLength(1);
    expectHttpError(() => bookings.getByCode(db, code, stranger), 403);
    expectHttpError(() => bookings.getByCode(db, 'TT-TIDAKADA', customer), 404, 'Booking tidak ditemukan');
  });

  it('pay: pemilik berhasil, expires_at hilang; admin bukan pemilik 403; bayar ulang 409', () => {
    const { code } = newBooking();
    expectHttpError(() => bookings.pay(db, code, admin), 403);
    const paid = bookings.pay(db, code, customer);
    expect(paid.status).toBe('paid');
    expect(paid.expires_at).toBeNull();
    expectHttpError(
      () => bookings.pay(db, code, customer),
      409,
      'Booking tidak dalam status menunggu pembayaran',
    );
  });

  it('cancel: mengembalikan kuota; booking paid juga bisa dibatalkan; admin boleh', () => {
    const a = newBooking();
    expect(bookings.cancel(db, a.code, customer).status).toBe('cancelled');
    expect(bookedOf(a.schedule.id)).toBe(0);

    const b = newBooking();
    bookings.pay(db, b.code, customer);
    expect(bookings.cancel(db, b.code, admin).status).toBe('cancelled');
    expect(bookedOf(b.schedule.id)).toBe(0);
  });

  it('cancel: ulang 409, orang lain 403, setelah berangkat 409', () => {
    const { code } = newBooking();
    expectHttpError(() => bookings.cancel(db, code, stranger), 403);
    expectHttpError(
      () => bookings.cancel(db, code, customer, new Date('2100-01-01T00:00:00.000Z')),
      409,
      'Jadwal sudah berangkat',
    );
    bookings.cancel(db, code, customer);
    expectHttpError(() => bookings.cancel(db, code, customer), 409, 'Booking sudah dibatalkan');
  });
});

describe('tickets.service', () => {
  const paidTicket = () => {
    const booking = newBooking();
    bookings.pay(db, booking.code, customer);
    return { code: booking.tickets[0].code, departure: new Date(booking.schedule.departure_at), booking };
  };

  it('maskName menyamarkan huruf setelah huruf pertama', () => {
    expect(tickets.maskName('Budi Santoso')).toBe('B*** S******');
    expect(tickets.maskName('A')).toBe('A');
    expect(tickets.maskName('Budi   Santoso')).toBe('B*** S******');
  });

  it('verify: tiket tidak ada -> 404', () => {
    expectHttpError(() => tickets.verify(db, 'TK-TIDAKADA'), 404, 'Tiket tidak ditemukan');
  });

  it('verify: valid hanya jika booking paid, nama disamarkan', () => {
    const booking = newBooking();
    const code = booking.tickets[0].code;
    const pending = tickets.verify(db, code);
    expect(pending.valid).toBe(false);
    expect(pending.booking_status).toBe('pending');
    expect(pending.checked_in).toBe(false);
    expect(pending.passenger_name).toBe('B*** S******');
    expect(pending.origin).toBe('Ajibata');
    expect(pending.destination).toBe('Tomok');

    bookings.pay(db, booking.code, customer);
    expect(tickets.verify(db, code).valid).toBe(true);
  });

  it('checkIn: sukses pada hari keberangkatan, kedua kali 409', () => {
    const { code, departure } = paidTicket();
    const result = tickets.checkIn(db, code, departure);
    expect(result.checked_in).toBe(true);
    expectHttpError(() => tickets.checkIn(db, code, departure), 409, 'Tiket sudah check-in');
  });

  it('checkIn: bukan hari keberangkatan -> 422', () => {
    const { code, departure } = paidTicket();
    // Jangan pakai new Date(): jadwal seed dibuat relatif terhadap jam saat test jalan,
    // sehingga pada jam tertentu (zona WIB) keberangkatan terpajang di "hari ini" dan test jadi flaky.
    const otherDay = new Date(departure.getTime() + 3 * 24 * 60 * 60 * 1000);
    expectHttpError(
      () => tickets.checkIn(db, code, otherDay),
      422,
      'Check-in hanya bisa dilakukan pada hari keberangkatan',
    );
  });

  it('checkIn: belum dibayar atau sudah dibatalkan -> 409', () => {
    const booking = newBooking();
    const departure = new Date(booking.schedule.departure_at);
    expectHttpError(() => tickets.checkIn(db, booking.tickets[0].code, departure), 409);

    bookings.pay(db, booking.code, customer);
    bookings.cancel(db, booking.code, customer);
    expectHttpError(() => tickets.checkIn(db, booking.tickets[0].code, departure), 409);
  });
});

describe('schedules.service', () => {
  const FUTURE = '2030-01-01T01:00:00.000Z';

  it('list: paginasi dan total', () => {
    const page = schedules.list(db, { page: 2, limit: 5 });
    expect(page.items).toHaveLength(5);
    expect(page.pagination).toEqual({ page: 2, limit: 5, total: 63 });
  });

  it('list: filter origin dan destination', () => {
    const r = schedules.list(db, { origin: 1, destination: 2, page: 1, limit: 50 });
    expect(r.pagination.total).toBe(21);
    r.items.forEach((s) => expect(s.route.origin.name).toBe('Ajibata'));
  });

  it('list: filter tanggal WIB', () => {
    const first = scheduleOf();
    const date = new Date(Date.parse(first.departure_at) + 7 * 3600e3).toISOString().slice(0, 10);
    const r = schedules.list(db, { date, page: 1, limit: 50 });
    expect(r.pagination.total).toBe(9); // 3 rute x 3 jam
  });

  it('list: publik menyembunyikan jadwal lampau dan tertutup, admin melihat semuanya', () => {
    // Ambil jadwal seed SEBELUM menyisipkan jadwal lampau: scheduleOf() mengurutkan
    // berdasarkan departure_at, sehingga setelah insert 2020 ia akan mengembalikan jadwal lampau itu.
    const upcoming = scheduleOf();
    db.prepare(
      "INSERT INTO schedules (route_id, boat_id, departure_at, capacity) VALUES (1, 1, '2020-01-01T00:00:00.000Z', 5)",
    ).run();
    db.prepare("UPDATE schedules SET status = 'closed' WHERE id = ?").run(upcoming.id);
    expect(schedules.list(db, { page: 1, limit: 100 }).pagination.total).toBe(62);
    expect(schedules.list(db, { page: 1, limit: 100 }, { publicOnly: false }).pagination.total).toBe(64);
  });

  it('getById: ada dan tidak ada', () => {
    const s = scheduleOf();
    expect(schedules.getById(db, s.id)).toMatchObject({ id: s.id, seats_left: s.capacity });
    expectHttpError(() => schedules.getById(db, 99999), 404, 'Jadwal tidak ditemukan');
  });

  it('create: kapasitas bawaan = kapasitas kapal', () => {
    const s = schedules.create(db, { route_id: 1, boat_id: 2, departure_at: FUTURE });
    expect(s.capacity).toBe(20);
    expect(s.boat.id).toBe(2);
    expect(s.departure_at).toBe(FUTURE);
  });

  it('create: validasi referensi dan kapasitas', () => {
    expectHttpError(() => schedules.create(db, { route_id: 99, boat_id: 1, departure_at: FUTURE }), 404, 'Rute tidak ditemukan');
    expectHttpError(() => schedules.create(db, { route_id: 1, boat_id: 99, departure_at: FUTURE }), 404, 'Kapal tidak ditemukan');
    expectHttpError(
      () => schedules.create(db, { route_id: 1, boat_id: 2, departure_at: FUTURE, capacity: 21 }),
      422,
      'Kapasitas melebihi kapasitas kapal',
    );
  });

  it('update: status, waktu, dan kapasitas', () => {
    const s = scheduleOf();
    expect(schedules.update(db, s.id, { status: 'closed' }).status).toBe('closed');
    expect(schedules.update(db, s.id, { departure_at: FUTURE }).departure_at).toBe(FUTURE);
    expect(schedules.update(db, s.id, { capacity: 50 }).capacity).toBe(50);
  });

  it('update: aturan kapasitas dan referensi', () => {
    const s = scheduleOf();
    expectHttpError(() => schedules.update(db, 99999, { status: 'closed' }), 404, 'Jadwal tidak ditemukan');
    expectHttpError(() => schedules.update(db, s.id, { boat_id: 99 }), 404, 'Kapal tidak ditemukan');
    // kapasitas 120 melebihi kapal 2 (kapasitas 20)
    expectHttpError(() => schedules.update(db, s.id, { boat_id: 2 }), 422, 'Kapasitas melebihi kapasitas kapal');

    newBooking([{ name: 'Budi', category: 'dewasa' }, { name: 'Ani', category: 'dewasa' }], s.id);
    expectHttpError(
      () => schedules.update(db, s.id, { capacity: 1 }),
      422,
      'Kapasitas lebih kecil dari kursi yang sudah dipesan',
    );
  });

  it('remove: berhasil, tidak ada 404, sudah ada booking ditolak constraint', () => {
    const created = schedules.create(db, { route_id: 1, boat_id: 1, departure_at: FUTURE });
    schedules.remove(db, created.id);
    expectHttpError(() => schedules.getById(db, created.id), 404);
    expectHttpError(() => schedules.remove(db, created.id), 404, 'Jadwal tidak ditemukan');

    const s = scheduleOf();
    newBooking(pax, s.id);
    let error;
    try {
      schedules.remove(db, s.id);
    } catch (e) {
      error = e;
    }
    expect(error.code).toMatch(/^SQLITE_CONSTRAINT/);
  });
});