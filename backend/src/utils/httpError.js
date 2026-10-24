/** Error terpusat dengan status HTTP; dipakai service dan middleware. */
class HttpError extends Error {
  /**
   * @param {number} status kode HTTP
   * @param {string} message pesan aman untuk klien
   * @param {object} [errors] detail per field (opsional)
   */
  constructor(status, message, errors) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.errors = errors;
  }

  static badRequest(msg, errors) { return new HttpError(400, msg, errors); }
  static unauthorized(msg = 'Autentikasi diperlukan') { return new HttpError(401, msg); }
  static forbidden(msg = 'Akses ditolak') { return new HttpError(403, msg); }
  static notFound(msg = 'Data tidak ditemukan') { return new HttpError(404, msg); }
  static conflict(msg) { return new HttpError(409, msg); }
  static unprocessable(msg, errors) { return new HttpError(422, msg, errors); }
}

module.exports = HttpError;
