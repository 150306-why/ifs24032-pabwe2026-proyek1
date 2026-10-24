const HttpError = require('../utils/httpError');

/**
 * Membatasi akses berdasarkan role. Pakai setelah middleware auth.
 * @param {...('customer'|'admin')} roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(HttpError.unauthorized());
    if (!roles.includes(req.user.role)) return next(HttpError.forbidden());
    return next();
  };
}

module.exports = requireRole;
