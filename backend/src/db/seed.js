const bcrypt = require('bcryptjs');
const { createDb } = require('../config/db');
const { env } = require('../config/env');
const { initDb } = require('./init');

// Data contoh, BUKAN data resmi. Jam UTC (WIB = UTC+7): 01:00Z=08:00, 04:00Z=11:00, 08:00Z=15:00 WIB.
const PORTS = ['Ajibata', 'Tomok', 'Tuktuk'];
const BOATS = [
  { name: 'KMP Toba Sejahtera', type: 'ferry', capacity: 120 },
  { name: 'Speedboat Danau Biru', type: 'wisata', capacity: 20 },
];
// boat: indeks ke BOATS; fares dalam rupiah
const ROUTES = [
  { from: 'Ajibata', to: 'Tomok', duration: 60, boat: 0, adult: 20000, child: 12000 },
  { from: 'Tomok', to: 'Ajibata', duration: 60, boat: 0, adult: 20000, child: 12000 },
  { from: 'Tomok', to: 'Tuktuk', duration: 30, boat: 1, adult: 45000, child: 30000 },
];
const DEPARTURE_HOURS_UTC = [1, 4, 8];
const DAYS_AHEAD = 7;

/** Membuat tanggal keberangkatan ISO UTC untuk hari ke-n dari hari ini. */
function departureIso(dayOffset, hourUtc) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(hourUtc, 0, 0, 0);
  return d.toISOString();
}

/** Mengisi akun demo; password wajib datang dari env, bukan dari repo. */
function seedUsers(db) {
  const { adminEmail, adminPassword, customerEmail, customerPassword } = env.seed;
  if (!adminPassword || !customerPassword) {
    throw new Error('SEED_ADMIN_PASSWORD dan SEED_CUSTOMER_PASSWORD wajib diisi di .env.');
  }
  const insert = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
  insert.run('Admin Toba Tix', adminEmail, bcrypt.hashSync(adminPassword, 10), 'admin');
  insert.run('Pelanggan Demo', customerEmail, bcrypt.hashSync(customerPassword, 10), 'customer');
}

/** Mengisi pelabuhan, kapal, rute, tarif, dan jadwal 7 hari ke depan. */
function seedCatalog(db) {
  const portId = {};
  PORTS.forEach((name) => {
    portId[name] = db.prepare('INSERT INTO ports (name) VALUES (?)').run(name).lastInsertRowid;
  });
  const boatIds = BOATS.map((b) => db
    .prepare('INSERT INTO boats (name, type, capacity) VALUES (?, ?, ?)')
    .run(b.name, b.type, b.capacity).lastInsertRowid);

  ROUTES.forEach((r) => {
    const routeId = db
      .prepare('INSERT INTO routes (origin_port_id, destination_port_id, duration_min) VALUES (?, ?, ?)')
      .run(portId[r.from], portId[r.to], r.duration).lastInsertRowid;
    const fare = db.prepare('INSERT INTO fares (route_id, category, price) VALUES (?, ?, ?)');
    fare.run(routeId, 'dewasa', r.adult);
    fare.run(routeId, 'anak', r.child);

    const schedule = db.prepare(
      'INSERT INTO schedules (route_id, boat_id, departure_at, capacity) VALUES (?, ?, ?, ?)',
    );
    for (let day = 1; day <= DAYS_AHEAD; day += 1) {
      DEPARTURE_HOURS_UTC.forEach((h) => {
        schedule.run(routeId, boatIds[r.boat], departureIso(day, h), BOATS[r.boat].capacity);
      });
    }
  });
}

/**
 * Seed hanya jika DB masih kosong (idempoten), dalam satu transaksi.
 * @param {import('better-sqlite3').Database} db
 * @returns {boolean} true jika seed dijalankan
 */
function seedIfEmpty(db) {
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM ports').get();
  if (total > 0) return false;
  db.transaction(() => {
    seedUsers(db);
    seedCatalog(db);
  })();
  return true;
}

module.exports = { seedIfEmpty };

// Dijalankan langsung: `npm run db:seed`
if (require.main === module) {
  const db = createDb();
  initDb(db);
  console.log(seedIfEmpty(db) ? 'Seed selesai.' : 'DB sudah berisi data, seed dilewati.');
  db.close();
}
