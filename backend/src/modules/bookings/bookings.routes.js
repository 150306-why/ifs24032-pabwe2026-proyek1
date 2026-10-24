const { Router } = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const { codeParam } = require('../common.schema');
const { createBookingSchema } = require('./bookings.schema');
const c = require('./bookings.controller');

const router = Router();
router.use(auth); // semua endpoint booking butuh login; kepemilikan dicek di service

router.post('/', validate(createBookingSchema), asyncHandler(c.create));
router.get('/', asyncHandler(c.list));
router.get('/:code', validate(codeParam, 'params'), asyncHandler(c.get));
router.post('/:code/pay', validate(codeParam, 'params'), asyncHandler(c.pay));
router.post('/:code/cancel', validate(codeParam, 'params'), asyncHandler(c.cancel));

module.exports = router;
