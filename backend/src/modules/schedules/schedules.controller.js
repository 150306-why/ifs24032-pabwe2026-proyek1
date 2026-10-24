const service = require('./schedules.service');

const db = (req) => req.app.locals.db;

const list = (req, res) => res.json({ data: service.list(db(req), req.valid.query), message: 'OK' });

const listAll = (req, res) => res.json({
  data: service.list(db(req), req.valid.query, { publicOnly: false }),
  message: 'OK',
});

const get = (req, res) => res.json({ data: service.getById(db(req), req.valid.params.id), message: 'OK' });

const create = (req, res) => res.status(201).json({
  data: service.create(db(req), req.valid.body),
  message: 'Jadwal berhasil dibuat',
});

const update = (req, res) => res.json({
  data: service.update(db(req), req.valid.params.id, req.valid.body),
  message: 'Jadwal berhasil diperbarui',
});

const remove = (req, res) => {
  service.remove(db(req), req.valid.params.id);
  res.json({ data: null, message: 'Jadwal berhasil dihapus' });
};

module.exports = { list, listAll, get, create, update, remove };
