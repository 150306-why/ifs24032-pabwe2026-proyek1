const HttpError = require('../../utils/httpError');
const { wibDayRangeUtc } = require('../../utils/date');
const { expirePending } = require('../bookings/bookings.service');

const SELECT_SQL = `
  SELECT s.id, s.route_id, s.boat_id, s.departure_at, s.capacity, s.booked, s.status,
         (s.capacity - s.booked) AS seats_left, r.duration_min,
         r.origin_port_id, po.name AS origin_name, r.destination_port_id, pd.name AS destination_name,
         b.name AS boat_name, b.type AS boat_type,
         (SELECT price FROM fares f WHERE f.route_id = s.route_id AND f.category = 'dewasa') AS price_dewasa,
         (SELECT price FROM fares f WHERE f.route_id = s.route_id AND f.category = 'anak') AS price_anak
  FROM schedules s
  JOIN routes r ON r.id = s.route_id
  JOIN ports po ON po.id = r.origin_port_id
  JOIN ports pd ON pd.id = r.destination_port_id
  JOIN boats b ON b.id = s.boat_id`;

function toSchedule(row) {
  return {
    id: row.id,
    departure_at: row.departure_at,
    status: row.status,
    capacity: row.capacity,
    booked: row.booked,
    seats_left: row.seats_left,
    duration_min: row.duration_min,
    boat: { id: row.boat_id, name: row.boat_name, type: row.boat_type },
    route: {
      id: row.route_id,
      origin: { id: row.origin_port_id, name: row.origin_name },
      destination: { id: row.destination_port_id, name: row.destination_name },
    },
    fares: { dewasa: row.price_dewasa, anak: row.price_anak },
  };
}

/**
 * Daftar jadwal berpaginasi. Publik: hanya open dan belum berangkat.
 * Klausa WHERE dirakit dari potongan tetap; semua nilai lewat parameter (anti SQL injection).
 */
function list(db, { origin, destination, date, page, limit }, { publicOnly = true } = {}) {
  expirePending(db);
  const where = [];
  const params = [];
  if (publicOnly) {
    where.push("s.status = 'open'", 's.departure_at > ?');
    params.push(new Date().toISOString());
  }
  if (origin) { where.push('r.origin_port_id = ?'); params.push(origin); }
  if (destination) { where.push('r.destination_port_id = ?'); params.push(destination); }
  if (date) {
    const [from, to] = wibDayRangeUtc(date);
    where.push('s.departure_at >= ? AND s.departure_at < ?');
    params.push(from, to);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { total } = db
    .prepare(`SELECT COUNT(*) AS total FROM schedules s JOIN routes r ON r.id = s.route_id ${clause}`)
    .get(...params);
  const rows = db
    .prepare(`${SELECT_SQL} ${clause} ORDER BY s.departure_at ASC LIMIT ? OFFSET ?`)
    .all(...params, limit, (page - 1) * limit);
  return { items: rows.map(toSchedule), pagination: { page, limit, total } };
}

function getById(db, id) {
  expirePending(db);
  const row = db.prepare(`${SELECT_SQL} WHERE s.id = ?`).get(id);
  if (!row) throw HttpError.notFound('Jadwal tidak ditemukan');
  return toSchedule(row);
}

function mustFind(db, table, id, label) {
  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id); // table dari kode, bukan input
  if (!row) throw HttpError.notFound(`${label} tidak ditemukan`);
  return row;
}

function create(db, { route_id: routeId, boat_id: boatId, departure_at: departureAt, capacity }) {
  mustFind(db, 'routes', routeId, 'Rute');
  const boat = mustFind(db, 'boats', boatId, 'Kapal');
  const seats = capacity ?? boat.capacity;
  if (seats > boat.capacity) throw HttpError.unprocessable('Kapasitas melebihi kapasitas kapal');

  const info = db
    .prepare('INSERT INTO schedules (route_id, boat_id, departure_at, capacity) VALUES (?, ?, ?, ?)')
    .run(routeId, boatId, new Date(departureAt).toISOString(), seats);
  return getById(db, Number(info.lastInsertRowid));
}

function update(db, id, changes) {
  const current = mustFind(db, 'schedules', id, 'Jadwal');
  const boat = mustFind(db, 'boats', changes.boat_id ?? current.boat_id, 'Kapal');
  const capacity = changes.capacity ?? current.capacity;
  if (capacity > boat.capacity) throw HttpError.unprocessable('Kapasitas melebihi kapasitas kapal');
  if (capacity < current.booked) throw HttpError.unprocessable('Kapasitas lebih kecil dari kursi yang sudah dipesan');

  db.prepare('UPDATE schedules SET boat_id = ?, departure_at = ?, capacity = ?, status = ? WHERE id = ?').run(
    boat.id,
    changes.departure_at ? new Date(changes.departure_at).toISOString() : current.departure_at,
    capacity,
    changes.status ?? current.status,
    id,
  );
  return getById(db, id);
}

function remove(db, id) {
  mustFind(db, 'schedules', id, 'Jadwal');
  db.prepare('DELETE FROM schedules WHERE id = ?').run(id); // 409 bila sudah ada booking
}

module.exports = { list, getById, create, update, remove };
