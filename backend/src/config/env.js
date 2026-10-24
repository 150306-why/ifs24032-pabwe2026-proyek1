require('dotenv').config();

/**
 * Konfigurasi aplikasi dari environment variable.
 * Dibaca sekali agar mudah diuji dan tidak tersebar di banyak file.
 */
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  dbPath: process.env.DB_PATH || './data/tobatix.db',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@tobatix.test',
    adminPassword: process.env.SEED_ADMIN_PASSWORD,
    customerEmail: process.env.SEED_CUSTOMER_EMAIL || 'customer@tobatix.test',
    customerPassword: process.env.SEED_CUSTOMER_PASSWORD,
  },
};

/** Pastikan konfigurasi wajib tersedia sebelum server berjalan. */
function assertRequiredEnv() {
  if (!env.jwtSecret || env.jwtSecret.length < 16) {
    throw new Error('JWT_SECRET wajib diisi (minimal 16 karakter).');
  }
}

module.exports = { env, assertRequiredEnv };
