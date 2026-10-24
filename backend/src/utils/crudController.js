/**
 * Pabrik controller CRUD sederhana agar tidak mengulang kode (DRY).
 * Service wajib punya: list, getById, create, update, remove.
 * @param {object} service
 * @param {string} noun nama resource untuk pesan, mis. "Pelabuhan"
 */
function createCrudController(service, noun) {
  const db = (req) => req.app.locals.db;
  return {
    list: (req, res) => res.json({ data: service.list(db(req)), message: 'OK' }),
    get: (req, res) => res.json({ data: service.getById(db(req), req.valid.params.id), message: 'OK' }),
    create: (req, res) => res.status(201).json({
      data: service.create(db(req), req.valid.body),
      message: `${noun} berhasil dibuat`,
    }),
    update: (req, res) => res.json({
      data: service.update(db(req), req.valid.params.id, req.valid.body),
      message: `${noun} berhasil diperbarui`,
    }),
    remove: (req, res) => {
      service.remove(db(req), req.valid.params.id);
      res.json({ data: null, message: `${noun} berhasil dihapus` });
    },
  };
}

module.exports = { createCrudController };
