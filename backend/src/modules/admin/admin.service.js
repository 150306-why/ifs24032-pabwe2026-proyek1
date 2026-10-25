const { wibDayRangeUtc, wibDate } = require('../../utils/date');
const { expirePending } = require('../bookings/bookings.service');

const DAY_MS = 24 * 60 * 60 * 1000;

/** Escape karakter khusus LIKE agar pencarian "50%" tidak dianggap wildcard. */
const likePattern = (q) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

const count = (db, sql, ...params) => db.prepare(sql).get(...params).n;

/**
 * Ringkasan untuk dashboard admin. Semua angka dihitung di server dengan query terparameter.
 * @param {import('better-sqlite3').Database} db
 * @param {Date} [now]
 */
function getStats(db, now = new Date()) {
  expirePending(db, now);
  const nowIso = now.toISOString();
  const [todayFrom, todayTo] = wibDayRangeUtc(wibDate(now));

  const byStatus = { pending: 0, paid: 0, cancelled: 0 };
  db.prepare('SELECT status, COUNT(*) AS n FROM bookings GROUP BY status').all()
    .forEach((r) => { byStatus[r.status] = r.n; });

  const revenue = db.prepare("SELECT COALESCE(SUM(total), 0) AS n FROM bookings WHERE status = 'paid'").get().n;
  const ticketsSold = count(db, "SELECT COUNT(*) AS n FROM tickets t JOIN bookings b ON b.id = t.booking_id WHERE b.status = 'paid'");
  const checkedInToday = count(db, 'SELECT COUNT(*) AS n FROM tickets WHERE checked_in_at >= ? AND checked_in_at < ?', todayFrom, todayTo);

  // Pendapatan 7 hari terakhir (WIB), termasuk hari ini; hari tanpa transaksi bernilai 0.
  const days = [];
  for (let i = 6; i >= 0; i -= 1) days.push(wibDate(new Date(now.getTime() - i * DAY_MS)));
  const paidRows = db.prepare("SELECT total, created_at FROM bookings WHERE status = 'paid' AND created_at >= ?")
    .all(wibDayRangeUtc(days[0])[0]);
  const revenueByDay = days.map((date) => ({
    date,
    total: paidRows.filter((r) => wibDate(r.created_at) === date).reduce((sum, r) => sum + r.total, 0),
  }));

  const topRoutes = db.prepare(`
    SELECT po.name AS origin, pd.name AS destination, COUNT(t.id) AS tickets, COALESCE(SUM(t.price), 0) AS revenue
    FROM tickets t
    JOIN bookings b ON b.id = t.booking_id AND b.status = 'paid'
    JOIN schedules s ON s.id = b.schedule_id
    JOIN routes r ON r.id = s.route_id
    JOIN ports po ON po.id = r.origin_port_id
    JOIN ports pd ON pd.id = r.destination_port_id
    GROUP BY r.id ORDER BY tickets DESC, revenue DESC LIMIT 5`).all();

  const todayDepartures = db.prepare(`
    SELECT s.id, s.departure_at, s.capacity, s.booked, s.status, po.name AS origin, pd.name AS destination, bo.name AS boat
    FROM schedules s
    JOIN routes r ON r.id = s.route_id
    JOIN ports po ON po.id = r.origin_port_id
    JOIN ports pd ON pd.id = r.destination_port_id
    JOIN boats bo ON bo.id = s.boat_id
    WHERE s.departure_at >= ? AND s.departure_at < ? ORDER BY s.departure_at`).all(todayFrom, todayTo);

  return {
    totals: {
      customers: count(db, "SELECT COUNT(*) AS n FROM users WHERE role = 'customer'"),
      bookings: byStatus.pending + byStatus.paid + byStatus.cancelled,
      revenue,
      tickets_sold: ticketsSold,
      checked_in_today: checkedInToday,
      upcoming_schedules: count(db, "SELECT COUNT(*) AS n FROM schedules WHERE status = 'open' AND departure_at > ?", nowIso),
      ports: count(db, 'SELECT COUNT(*) AS n FROM ports'),
      boats: count(db, 'SELECT COUNT(*) AS n FROM boats'),
      routes: count(db, 'SELECT COUNT(*) AS n FROM routes'),
    },
    bookings_by_status: byStatus,
    revenue_by_day: revenueByDay,
    top_routes: topRoutes,
    today_departures: todayDepartures,
  };
}

/** Daftar semua booking (semua pelanggan) dengan filter status dan pencarian kode/nama/email. */
function listBookings(db, { status, q, page, limit }) {
  expirePending(db);
  const where = [];
  const params = [];
  if (status) { where.push('b.status = ?'); params.push(status); }
  if (q) {
    where.push("(b.code LIKE ? ESCAPE '\\' OR u.name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')");
    const p = likePattern(q);
    params.push(p, p, p);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const from = `FROM bookings b JOIN users u ON u.id = b.user_id
    JOIN schedules s ON s.id = b.schedule_id JOIN routes r ON r.id = s.route_id
    JOIN ports po ON po.id = r.origin_port_id JOIN ports pd ON pd.id = r.destination_port_id
    JOIN boats bo ON bo.id = s.boat_id ${clause}`;

  const total = count(db, `SELECT COUNT(*) AS n ${from}`, ...params);
  const rows = db.prepare(`
    SELECT b.code, b.status, b.total, b.created_at, s.departure_at,
           u.name AS customer_name, u.email AS customer_email,
           po.name AS origin, pd.name AS destination, bo.name AS boat_name,
           (SELECT COUNT(*) FROM tickets t WHERE t.booking_id = b.id) AS passenger_count
    ${from} ORDER BY b.id DESC LIMIT ? OFFSET ?`).all(...params, limit, (page - 1) * limit);

  return {
    items: rows.map((r) => ({
      code: r.code,
      status: r.status,
      total: r.total,
      created_at: r.created_at,
      passenger_count: r.passenger_count,
      customer: { name: r.customer_name, email: r.customer_email },
      schedule: { departure_at: r.departure_at, origin: r.origin, destination: r.destination, boat_name: r.boat_name },
    })),
    pagination: { page, limit, total },
  };
}

/** Daftar pengguna beserta jumlah booking lunas dan total belanja. Tanpa password_hash. */
function listUsers(db, { role, q, page, limit }) {
  const where = [];
  const params = [];
  if (role) { where.push('u.role = ?'); params.push(role); }
  if (q) {
    where.push("(u.name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')");
    const p = likePattern(q);
    params.push(p, p);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = count(db, `SELECT COUNT(*) AS n FROM users u ${clause}`, ...params);
  const items = db.prepare(`
    SELECT u.id, u.name, u.email, u.role,
           (SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id) AS bookings,
           (SELECT COALESCE(SUM(b.total), 0) FROM bookings b WHERE b.user_id = u.id AND b.status = 'paid') AS spent
    FROM users u ${clause} ORDER BY u.id LIMIT ? OFFSET ?`).all(...params, limit, (page - 1) * limit);
  return { items, pagination: { page, limit, total } };
}

module.exports = { getStats, listBookings, listUsers };
