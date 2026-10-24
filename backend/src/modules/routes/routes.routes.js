const { Router } = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const requireRole = require('../../middlewares/requireRole');
const { idParam } = require('../common.schema');
const { routeSchema } = require('./routes.schema');
const c = require('./routes.controller');

const router = Router();
const admin = [auth, requireRole('admin')];

router.get('/', asyncHandler(c.list)); // publik
router.post('/', ...admin, validate(routeSchema), asyncHandler(c.create));
router.put('/:id', ...admin, validate(idParam, 'params'), validate(routeSchema), asyncHandler(c.update));
router.delete('/:id', ...admin, validate(idParam, 'params'), asyncHandler(c.remove));

module.exports = router;
