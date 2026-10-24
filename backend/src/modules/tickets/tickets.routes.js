const { Router } = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const requireRole = require('../../middlewares/requireRole');
const { codeParam } = require('../common.schema');
const c = require('./tickets.controller');

const router = Router();

router.get('/:code', validate(codeParam, 'params'), asyncHandler(c.verify)); // verifikasi publik
router.post('/:code/checkin', auth, requireRole('admin'), validate(codeParam, 'params'), asyncHandler(c.checkIn));

module.exports = router;
