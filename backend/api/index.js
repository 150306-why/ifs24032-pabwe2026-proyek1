// Entry serverless untuk Vercel (hosting biasa tetap memakai src/server.js).
// Filesystem Vercel hanya bisa ditulis di /tmp dan isinya sementara: DB dibuat dan di-seed ulang
// setiap instance baru berjalan, jadi akun/booking baru bisa hilang. Cukup untuk demo.
process.env.DB_PATH = process.env.DB_PATH || '/tmp/tobatix.db';

const { assertRequiredEnv } = require('../src/config/env');
const { createDb } = require('../src/config/db');
const { initDb } = require('../src/db/init');
const { seedIfEmpty } = require('../src/db/seed');
const { createApp } = require('../src/app');

assertRequiredEnv();
const db = createDb();
initDb(db);
seedIfEmpty(db);

module.exports = createApp({ db });
