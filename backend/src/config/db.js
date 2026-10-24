const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { env } = require('./env');

/**
 * Membuka koneksi SQLite dengan foreign key aktif dan WAL (kecuali in-memory).
 * @param {string} [dbPath] lokasi file DB, default dari env.DB_PATH
 * @returns {import('better-sqlite3').Database}
 */
function createDb(dbPath = env.dbPath) {
  const isMemory = dbPath === ':memory:';
  if (!isMemory) fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  if (!isMemory) db.pragma('journal_mode = WAL');
  return db;
}

module.exports = { createDb };
