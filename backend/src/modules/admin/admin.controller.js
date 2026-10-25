const service = require('./admin.service');

const db = (req) => req.app.locals.db;

const stats = (req, res) => res.json({ data: service.getStats(db(req)), message: 'OK' });
const bookings = (req, res) => res.json({ data: service.listBookings(db(req), req.valid.query), message: 'OK' });
const users = (req, res) => res.json({ data: service.listUsers(db(req), req.valid.query), message: 'OK' });

module.exports = { stats, bookings, users };
