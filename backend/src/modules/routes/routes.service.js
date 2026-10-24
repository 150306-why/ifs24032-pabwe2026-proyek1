const HttpError = require('../../utils/httpError');

const BASE_SQL = `
  SELECT r.id, r.duration_min, r.origin_port_id, r.destination_port_id,
         po.name AS origin_name, pd.name AS destination_name
  FROM routes r
  JOIN ports po ON po.id = r.origin_port_id
  JOIN ports pd ON pd.id = r.destination_port_id`;

/** Bentuk respons rute dengan tarif ter-nested. */
function toRoute(row, fareRows) {
  const fares = { dewasa: null, anak: null };
  fareRows.forEach((f) => { fares[f.category] = f.price; });
  return {
    id: row.id,
    duration_min: row.duration_min,
    origin: { id: row.origin_port_id, name: row.origin_name },
    destination: { id: row.destination_port_id, name: row.destination_name },
    fares,
  };
}

function list(db) {
  const rows = db.prepare(`${BASE_SQL} ORDER BY po.name, pd.name`).all();
  const fares = db.prepare('SELECT route_id, category, price FROM fares').all();
  return rows.map((r) => toRoute(r, fares.filter((f) => f.route_id === r.id)));
}

function getById(db, id) {
  const row = db.prepare(`${BASE_SQL} WHERE r.id = ?`).get(id);
  if (!row) throw HttpError.notFound('Rute tidak ditemukan');
  const fares = db.prepare('SELECT route_id, category, price FROM fares WHERE route_id = ?').all(id);
  return toRoute(row, fares);
}

function saveFares(db, routeId, fares) {
  const upsert = db.prepare(`INSERT INTO fares (route_id, category, price) VALUES (?, ?, ?)
    ON CONFLICT (route_id, category) DO UPDATE SET price = excluded.price`);
  Object.entries(fares).forEach(([category, price]) => upsert.run(routeId, category, price));
}

function create(db, body) {
  const id = db.transaction(() => {
    const info = db
      .prepare('INSERT INTO routes (origin_port_id, destination_port_id, duration_min) VALUES (?, ?, ?)')
      .run(body.origin_port_id, body.destination_port_id, body.duration_min);
    const routeId = Number(info.lastInsertRowid);
    saveFares(db, routeId, body.fares);
    return routeId;
  }).immediate();
  return getById(db, id);
}

function update(db, id, body) {
  getById(db, id);
  db.transaction(() => {
    db.prepare('UPDATE routes SET origin_port_id = ?, destination_port_id = ?, duration_min = ? WHERE id = ?')
      .run(body.origin_port_id, body.destination_port_id, body.duration_min, id);
    saveFares(db, id, body.fares);
  }).immediate();
  return getById(db, id);
}

function remove(db, id) {
  getById(db, id);
  db.prepare('DELETE FROM routes WHERE id = ?').run(id); // 409 bila sudah punya jadwal
}

module.exports = { list, getById, create, update, remove };
