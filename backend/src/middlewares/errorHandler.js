const { ZodError } = require('zod');
const HttpError = require('../utils/httpError');

/** Respons 404 untuk route yang tidak ada. */
function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
}

/** Penangan error terpusat; detail error 500 tidak dibocorkan ke klien. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const errors = {};
    err.issues.forEach((i) => { errors[i.path.join('.') || '_'] = i.message; });
    return res.status(422).json({ message: 'Data tidak valid', errors });
  }
  if (typeof err.code === 'string' && err.code.startsWith('SQLITE_CONSTRAINT')) {
    if (err.code.includes('UNIQUE') || err.code.includes('PRIMARYKEY')) {
      return res.status(409).json({ message: 'Data sudah ada' });
    }
    if (err.code.includes('FOREIGNKEY')) {
      return res.status(409).json({ message: 'Data masih dipakai data lain atau referensi tidak valid' });
    }
    return res.status(422).json({ message: 'Data melanggar aturan basis data' });
  }
  if (err instanceof HttpError) {
    const body = { message: err.message };
    if (err.errors) body.errors = err.errors;
    return res.status(err.status).json(body);
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Format JSON tidak valid' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Ukuran data terlalu besar' });
  }
  console.error(err);
  return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
}

module.exports = { errorHandler, notFoundHandler };
