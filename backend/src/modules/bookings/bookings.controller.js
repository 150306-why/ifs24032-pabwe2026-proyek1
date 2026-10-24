const service = require('./bookings.service');

const db = (req) => req.app.locals.db;

function create(req, res) {
  const booking = service.createBooking(db(req), req.user.id, req.valid.body);
  res.status(201).json({ data: booking, message: 'Booking dibuat, selesaikan pembayaran dalam 15 menit' });
}

function list(req, res) {
  res.json({ data: service.listMine(db(req), req.user.id), message: 'OK' });
}

function get(req, res) {
  res.json({ data: service.getByCode(db(req), req.valid.params.code, req.user), message: 'OK' });
}

function pay(req, res) {
  res.json({ data: service.pay(db(req), req.valid.params.code, req.user), message: 'Pembayaran berhasil' });
}

function cancel(req, res) {
  res.json({ data: service.cancel(db(req), req.valid.params.code, req.user), message: 'Booking dibatalkan' });
}

module.exports = { create, list, get, pay, cancel };
