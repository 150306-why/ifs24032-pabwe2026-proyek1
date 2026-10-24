const request = require('supertest');
const { createDb } = require('../src/config/db');
const { initDb } = require('../src/db/init');
const { seedIfEmpty } = require('../src/db/seed');
const { createApp } = require('../src/app');
const { collectGarbage } = require('./gc');

const HOUR = 60 * 60 * 1000;

/** Membuat app + DB in-memory ber-seed, beserta token admin dan customer. */
async function createTestContext() {
  const db = createDb(':memory:');
  initDb(db);
  seedIfEmpty(db);
  const app = createApp({ db });

  const login = async (email, password) => {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return res.body.data.token;
  };
  const adminToken = await login(process.env.SEED_ADMIN_EMAIL, process.env.SEED_ADMIN_PASSWORD);
  const customerToken = await login(process.env.SEED_CUSTOMER_EMAIL, process.env.SEED_CUSTOMER_PASSWORD);
  return { app, db, adminToken, customerToken };
}

/** Menutup DB, memutus referensi, dan memaksa GC sebelum environment Jest dibongkar. */
function releaseContext(ctx) {
  ctx.db.close();
  ctx.db = null;
  ctx.app = null;
  collectGarbage();
}

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

/** Admin membuat jadwal pada rute 1 / kapal 1 dengan kapasitas dan jam berangkat tertentu. */
async function createSchedule({ app, adminToken }, { capacity, inMs = 6 * HOUR }) {
  const res = await request(app)
    .post('/api/schedules')
    .set(bearer(adminToken))
    .send({ route_id: 1, boat_id: 1, capacity, departure_at: new Date(Date.now() + inMs).toISOString() });
  return res.body.data;
}

const book = (ctx, token, scheduleId, passengers) => request(ctx.app)
  .post('/api/bookings')
  .set(bearer(token))
  .send({ schedule_id: scheduleId, passengers });

const adults = (n) => Array.from({ length: n }, (_, i) => ({ name: `Penumpang ${i + 1}`, category: 'dewasa' }));

module.exports = { createTestContext, releaseContext, bearer, createSchedule, book, adults, HOUR };
