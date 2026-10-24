const { Router } = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const requireRole = require('../../middlewares/requireRole');
const { idParam } = require('../common.schema');
const { listQuerySchema, createScheduleSchema, updateScheduleSchema } = require('./schedules.schema');
const c = require('./schedules.controller');

const router = Router();
const admin = [auth, requireRole('admin')];

router.get('/', validate(listQuerySchema, 'query'), asyncHandler(c.list)); // publik
// Harus sebelum '/:id' agar "admin" tidak dianggap id.
router.get('/admin/list', ...admin, validate(listQuerySchema, 'query'), asyncHandler(c.listAll));
router.get('/:id', validate(idParam, 'params'), asyncHandler(c.get));
router.post('/', ...admin, validate(createScheduleSchema), asyncHandler(c.create));
router.put('/:id', ...admin, validate(idParam, 'params'), validate(updateScheduleSchema), asyncHandler(c.update));
router.delete('/:id', ...admin, validate(idParam, 'params'), asyncHandler(c.remove));

module.exports = router;
