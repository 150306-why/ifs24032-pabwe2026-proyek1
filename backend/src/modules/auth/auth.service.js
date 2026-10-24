const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../../config/env');
const HttpError = require('../../utils/httpError');

const BCRYPT_ROUNDS = 10;
// Hash tiruan agar waktu respons login tidak membedakan email ada/tidak ada.
const DUMMY_HASH = bcrypt.hashSync('dummy-password', BCRYPT_ROUNDS);

/** Bentuk user yang aman dikirim ke klien (tanpa password_hash). */
const toPublicUser = ({ id, name, email, role }) => ({ id, name, email, role });

/** Membuat JWT; subject = id user. */
function signToken(user) {
  return jwt.sign({ role: user.role }, env.jwtSecret, {
    subject: String(user.id),
    expiresIn: env.jwtExpiresIn,
    algorithm: 'HS256',
  });
}

/**
 * Mendaftarkan customer baru. Role selalu 'customer' (admin hanya lewat seed).
 * @throws {HttpError} 409 jika email sudah terdaftar
 */
function register(db, { name, email, password }) {
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) throw HttpError.conflict('Email sudah terdaftar');

  const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, email, hash, 'customer');
  const user = { id: Number(info.lastInsertRowid), name, email, role: 'customer' };
  return { user, token: signToken(user) };
}

/**
 * Login dengan email dan password.
 * @throws {HttpError} 401 dengan pesan generik bila gagal
 */
function login(db, { email, password }) {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const valid = bcrypt.compareSync(password, row ? row.password_hash : DUMMY_HASH);
  if (!row || !valid) throw HttpError.unauthorized('Email atau password salah');
  return { user: toPublicUser(row), token: signToken(row) };
}

/** Data user yang sedang login. @throws {HttpError} 401 jika user sudah tidak ada */
function getMe(db, userId) {
  const row = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(userId);
  if (!row) throw HttpError.unauthorized();
  return row;
}

module.exports = { register, login, getMe };
