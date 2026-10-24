const { env, assertRequiredEnv } = require('./config/env');
const { createDb } = require('./config/db');
const { initDb } = require('./db/init');
const { seedIfEmpty } = require('./db/seed');
const { createApp } = require('./app');
const { expirePending } = require('./modules/bookings/bookings.service');

assertRequiredEnv();

const db = createDb();
initDb(db);
// Seed otomatis saat start jika DB kosong (berguna di hosting dengan filesystem sementara).
seedIfEmpty(db);

// Job sederhana: batalkan booking pending kadaluarsa tiap menit (selain lazy expiry saat baca).
setInterval(() => {
  try { expirePending(db); } catch (err) { console.error('Gagal expire booking', err); }
}, 60 * 1000).unref();

const app = createApp({ db });
app.listen(env.port, () => console.log(`Toba Tix API berjalan di port ${env.port}`));
