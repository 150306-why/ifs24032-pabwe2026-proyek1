const HttpError = require('../../utils/httpError');

const list = (db) => db.prepare('SELECT id, name, type, capacity FROM boats ORDER BY name').all();

function getById(db, id) {
  const row = db.prepare('SELECT id, name, type, capacity FROM boats WHERE id = ?').get(id);
  if (!row) throw HttpError.notFound('Kapal tidak ditemukan');
  return row;
}

function create(db, { name, type, capacity }) {
  const info = db.prepare('INSERT INTO boats (name, type, capacity) VALUES (?, ?, ?)').run(name, type, capacity);
  return getById(db, Number(info.lastInsertRowid));
}

function update(db, id, { name, type, capacity }) {
  getById(db, id);
  db.prepare('UPDATE boats SET name = ?, type = ?, capacity = ? WHERE id = ?').run(name, type, capacity, id);
  return getById(db, id);
}

function remove(db, id) {
  getById(db, id);
  db.prepare('DELETE FROM boats WHERE id = ?').run(id);
}

module.exports = { list, getById, create, update, remove };
