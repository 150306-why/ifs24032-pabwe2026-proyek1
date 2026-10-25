const { Router } = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const requireRole = require('../../middlewares/requireRole');
const { bookingsQuerySchema, usersQuerySchema } = require('./admin.schema');
const c = require('./admin.controller');

const router = Router();
router.use(auth, requireRole('admin')); // seluruh endpoint khusus admin

router.get('/stats', asyncHandler(c.stats));
router.get('/bookings', validate(bookingsQuerySchema, 'query'), asyncHandler(c.bookings));
router.get('/users', validate(usersQuerySchema, 'query'), asyncHandler(c.users));

module.exports = router;
