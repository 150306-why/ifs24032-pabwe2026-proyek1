const HttpError = require('../../utils/httpError');
const { wibDate } = require('../../utils/date');

const TICKET_SQL = `
  SELECT t.id, t.code, t.passenger_name, t.category, t.checked_in_at,
         b.status AS booking_status, s.departure_at,
         po.name AS origin_name, pd.name AS destination_name, bo.name AS boat_name
  FROM tickets t
  JOIN bookings b ON b.id = t.booking_id
  JOIN schedules s ON s.id = b.schedule_id
  JOIN routes r ON r.id = s.route_id
  JOIN ports po ON po.id = r.origin_port_id
  JOIN ports pd ON pd.id = r.destination_port_id
  JOIN boats bo ON bo.id = s.boat_id
  WHERE t.code = ?`;

/** Menyamarkan nama: "Budi Santoso" -> "B*** S******". */
function maskName(name) {
  return name.split(/\s+/).map((w) => w[0] + '*'.repeat(Math.max(w.length - 1, 0))).join(' ');
}

function findTicket(db, code) {
  const row = db.prepare(TICKET_SQL).get(code);
  if (!row) throw HttpError.notFound('Tiket tidak ditemukan');
  return row;
}

/** Verifikasi publik: tanpa email, harga, atau kode booking. */
function verify(db, code) {
  const t = findTicket(db, code);
  return {
    code: t.code,
    passenger_name: maskName(t.passenger_name),
    category: t.category,
    valid: t.booking_status === 'paid',
    booking_status: t.booking_status,
    checked_in: t.checked_in_at !== null,
    departure_at: t.departure_at,
    origin: t.origin_name,
    destination: t.destination_name,
    boat_name: t.boat_name,
  };
}

/**
 * Check-in oleh admin. Syarat: booking paid, hari keberangkatan (WIB), belum pernah check-in.
 * @throws {HttpError} 409 belum dibayar / sudah check-in, 422 bukan hari keberangkatan
 */
function checkIn(db, code, now = new Date()) {
  const t = findTicket(db, code);
  if (t.booking_status !== 'paid') throw HttpError.conflict('Booking belum dibayar atau sudah dibatalkan');
  if (wibDate(t.departure_at) !== wibDate(now)) {
    throw HttpError.unprocessable('Check-in hanya bisa dilakukan pada hari keberangkatan');
  }
  const info = db
    .prepare('UPDATE tickets SET checked_in_at = ? WHERE id = ? AND checked_in_at IS NULL')
    .run(now.toISOString(), t.id);
  if (info.changes === 0) throw HttpError.conflict('Tiket sudah check-in');
  return verify(db, code);
}

module.exports = { verify, checkIn, maskName };
