const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const HttpError = require('../utils/httpError');

/** Mewajibkan header `Authorization: Bearer <token>`; mengisi req.user. */
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(HttpError.unauthorized());

  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    req.user = { id: Number(payload.sub), role: payload.role };
    return next();
  } catch {
    return next(HttpError.unauthorized('Token tidak valid atau kadaluarsa'));
  }
}

module.exports = auth;
