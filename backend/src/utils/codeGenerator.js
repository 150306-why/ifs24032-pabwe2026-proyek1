const crypto = require('crypto');

/**
 * Kode acak yang sulit ditebak, contoh: TT-9F3A1C2B7D.
 * @param {string} prefix awalan agar mudah dikenali (TT = booking, TK = tiket)
 * @param {number} [bytes=5] jumlah byte acak
 */
function generateCode(prefix, bytes = 5) {
  return `${prefix}-${crypto.randomBytes(bytes).toString('hex').toUpperCase()}`;
}

module.exports = { generateCode };
