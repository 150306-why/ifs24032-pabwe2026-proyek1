const authService = require('./auth.service');

const db = (req) => req.app.locals.db;

function register(req, res) {
  const result = authService.register(db(req), req.valid.body);
  res.status(201).json({ data: result, message: 'Registrasi berhasil' });
}

function login(req, res) {
  const result = authService.login(db(req), req.valid.body);
  res.json({ data: result, message: 'Login berhasil' });
}

function me(req, res) {
  const user = authService.getMe(db(req), req.user.id);
  res.json({ data: user, message: 'OK' });
}

function updateProfile(req, res) {
  const user = authService.updateProfile(db(req), req.user.id, req.valid.body);
  res.json({ data: user, message: 'Profil diperbarui' });
}

function changePassword(req, res) {
  authService.changePassword(db(req), req.user.id, req.valid.body);
  res.json({ data: null, message: 'Password berhasil diganti' });
}

module.exports = { register, login, me, updateProfile, changePassword };
