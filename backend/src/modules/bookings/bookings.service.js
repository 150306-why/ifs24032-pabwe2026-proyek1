const HttpError = require('../../utils/httpError');
const { generateCode } = require('../../utils/codeGenerator');

const PENDING_TTL_MS = 15 * 60 * 1000; // batas bayar 15 menit

const BOOKING_SQL = `
  SELECT b.id, b.code, b.user_id, b.total, b.status, b.created_at, b.schedule_id,
         s.departure_at, po.name AS origin_name, pd.name AS destination_name, bo.name AS boat_name,
         (SELECT COUNT(*) FROM tickets t WHERE t.booking_id = b.id) AS passenger_count
  FROM bookings b
  JOIN schedules s ON s.id = b.schedule_id
  JOIN routes r ON r.id = s.route_id
  JOIN ports po ON po.id = r.origin_port_id
  JOIN ports pd ON pd.id = r.destination_port_id
  JOIN boats bo ON bo.id = s.boat_id`;

/** Bentuk ringkas booking untuk daftar dan detail. */
function toBooking(row) {
  return {
    code: row.code,
    status: row.status,
    total: row.total,
    created_at: row.created_at,
    expires_at: row.status === 'pending' ? new Date(Date.parse(row.created_at) + PENDING_TTL_MS).toISOString() : null,
    passenger_count: row.passenger_count,
    schedule: {
      id: row.schedule_id,
      departure_at: row.departure_at,
      origin: row.origin_name,
      destination: row.destination_name,
      boat_name: row.boat_name,
    },
  };
}

function withTickets(db, row) {
  const tickets = db
    .prepare('SELECT passenger_name, category, price, code, checked_in_at FROM tickets WHERE booking_id = ? ORDER BY id')
    .all(row.id);
  return { ...toBooking(row), tickets };
}

/** Mengembalikan kursi ke jadwal (tidak pernah membuat booked < 0). */
function releaseSeats(db, scheduleId, count) {
  db.prepare('UPDATE schedules SET booked = booked - ? WHERE id = ? AND booked >= ?').run(count, scheduleId, count);
}

/**
 * Membatalkan booking pending yang melewati batas bayar dan mengembalikan kuotanya.
 * Dipanggil lazy saat data dibaca, plus job interval di server.js.
 * @returns {number} jumlah booking yang dibatalkan
 */
function expirePending(db, now = new Date()) {
  const cutoff = new Date(now.getTime() - PENDING_TTL_MS).toISOString();
  const stale = db
    .prepare("SELECT id, schedule_id, (SELECT COUNT(*) FROM tickets WHERE booking_id = bookings.id) AS n FROM bookings WHERE status = 'pending' AND created_at < ?")
    .all(cutoff);
  if (stale.length === 0) return 0;

  let expired = 0;
  db.transaction(() => {
    stale.forEach((b) => {
      const info = db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ? AND status = 'pending'").run(b.id);
      if (info.changes === 1) {
        releaseSeats(db, b.schedule_id, b.n);
        expired += 1;
      }
    });
  }).immediate();
  return expired;
}

/**
 * Membuat booking + tiket dalam SATU transaksi. Harga selalu dari tabel fares.
 * @throws {HttpError} 404 jadwal tidak ada, 409 jadwal tak tersedia / kursi tidak cukup, 422 tarif tidak ada
 */
function createBooking(db, userId, { schedule_id: scheduleId, passengers }, now = new Date()) {
  expirePending(db, now);

  const bookingId = db.transaction(() => {
    const schedule = db.prepare('SELECT id, route_id, departure_at, status FROM schedules WHERE id = ?').get(scheduleId);
    if (!schedule) throw HttpError.notFound('Jadwal tidak ditemukan');
    if (schedule.status !== 'open' || schedule.departure_at <= now.toISOString()) {
      throw HttpError.conflict('Jadwal sudah tidak tersedia');
    }

    const fareRows = db.prepare('SELECT category, price FROM fares WHERE route_id = ?').all(schedule.route_id);
    const fares = Object.fromEntries(fareRows.map((f) => [f.category, f.price]));
    const priced = passengers.map((p) => {
      if (fares[p.category] === undefined) throw HttpError.unprocessable(`Tarif ${p.category} belum tersedia`);
      return { ...p, price: fares[p.category] };
    });
    const total = priced.reduce((sum, p) => sum + p.price, 0);

    // Pengurangan kuota atomik: gagal bila kursi tidak cukup atau jadwal tidak open.
    const reserved = db
      .prepare("UPDATE schedules SET booked = booked + ? WHERE id = ? AND status = 'open' AND booked + ? <= capacity")
      .run(priced.length, scheduleId, priced.length);
    if (reserved.changes === 0) throw HttpError.conflict('Kursi tidak cukup');

    const info = db
      .prepare('INSERT INTO bookings (code, user_id, schedule_id, total, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(generateCode('TT', 6), userId, scheduleId, total, 'pending', now.toISOString());
    const id = Number(info.lastInsertRowid);

    const insertTicket = db.prepare(
      'INSERT INTO tickets (booking_id, passenger_name, category, price, code) VALUES (?, ?, ?, ?, ?)',
    );
    priced.forEach((p) => insertTicket.run(id, p.name, p.category, p.price, generateCode('TK', 6)));
    return id;
  }).immediate();

  return withTickets(db, db.prepare(`${BOOKING_SQL} WHERE b.id = ?`).get(bookingId));
}

/** Daftar booking milik user. */
function listMine(db, userId) {
  expirePending(db);
  return db.prepare(`${BOOKING_SQL} WHERE b.user_id = ? ORDER BY b.id DESC`).all(userId).map(toBooking);
}

/** Memuat booking dan memastikan hak akses. */
function loadAuthorized(db, code, user, { ownerOnly = false } = {}) {
  expirePending(db);
  const row = db.prepare(`${BOOKING_SQL} WHERE b.code = ?`).get(code);
  if (!row) throw HttpError.notFound('Booking tidak ditemukan');
  const isOwner = row.user_id === user.id;
  if (!isOwner && (ownerOnly || user.role !== 'admin')) throw HttpError.forbidden();
  return row;
}

function getByCode(db, code, user) {
  return withTickets(db, loadAuthorized(db, code, user));
}

/** Simulasi pembayaran: pending -> paid (atomik). */
function pay(db, code, user) {
  const row = loadAuthorized(db, code, user, { ownerOnly: true });
  const info = db.prepare("UPDATE bookings SET status = 'paid' WHERE id = ? AND status = 'pending'").run(row.id);
  if (info.changes === 0) throw HttpError.conflict('Booking tidak dalam status menunggu pembayaran');
  return getByCode(db, code, user);
}

/** Batalkan booking dan kembalikan kuota dalam satu transaksi. */
function cancel(db, code, user, now = new Date()) {
  const row = loadAuthorized(db, code, user);
  if (row.departure_at <= now.toISOString()) throw HttpError.conflict('Jadwal sudah berangkat');

  db.transaction(() => {
    const info = db
      .prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ? AND status IN ('pending', 'paid')")
      .run(row.id);
    if (info.changes === 0) throw HttpError.conflict('Booking sudah dibatalkan');
    releaseSeats(db, row.schedule_id, row.passenger_count);
  }).immediate();
  return getByCode(db, code, user);
}

module.exports = { createBooking, listMine, getByCode, pay, cancel, expirePending, PENDING_TTL_MS };
