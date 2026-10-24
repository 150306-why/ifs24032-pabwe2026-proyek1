const service = require('./tickets.service');

const db = (req) => req.app.locals.db;

const verify = (req, res) => res.json({ data: service.verify(db(req), req.valid.params.code), message: 'OK' });

const checkIn = (req, res) => res.json({
  data: service.checkIn(db(req), req.valid.params.code),
  message: 'Check-in berhasil',
});

module.exports = { verify, checkIn };
