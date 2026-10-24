const HttpError = require('../../utils/httpError');

const list = (db) => db.prepare('SELECT id, name FROM ports ORDER BY name').all();

function getById(db, id) {
  const row = db.prepare('SELECT id, name FROM ports WHERE id = ?').get(id);
  if (!row) throw HttpError.notFound('Pelabuhan tidak ditemukan');
  return row;
}

function create(db, { name }) {
  const info = db.prepare('INSERT INTO ports (name) VALUES (?)').run(name);
  return getById(db, Number(info.lastInsertRowid));
}

function update(db, id, { name }) {
  getById(db, id);
  db.prepare('UPDATE ports SET name = ? WHERE id = ?').run(name, id);
  return getById(db, id);
}

function remove(db, id) {
  getById(db, id);
  db.prepare('DELETE FROM ports WHERE id = ?').run(id); // 409 otomatis bila dipakai rute
}

module.exports = { list, getById, create, update, remove };
