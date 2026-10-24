const fs = require('fs');
const path = require('path');
const { createDb } = require('../config/db');

/**
 * Membuat semua tabel (idempoten, aman dipanggil berulang).
 * @param {import('better-sqlite3').Database} db
 */
function initDb(db) {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(sql);
}

module.exports = { initDb };

// Dijalankan langsung: `npm run db:init`
if (require.main === module) {
  const db = createDb();
  initDb(db);
  console.log('Skema database siap.');
  db.close();
}
