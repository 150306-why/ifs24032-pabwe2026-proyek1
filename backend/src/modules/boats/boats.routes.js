const { Router } = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const requireRole = require('../../middlewares/requireRole');
const { idParam } = require('../common.schema');
const { boatSchema } = require('./boats.schema');
const c = require('./boats.controller');

const router = Router();
router.use(auth, requireRole('admin')); // seluruh endpoint kapal khusus admin

router.get('/', asyncHandler(c.list));
router.get('/:id', validate(idParam, 'params'), asyncHandler(c.get));
router.post('/', validate(boatSchema), asyncHandler(c.create));
router.put('/:id', validate(idParam, 'params'), validate(boatSchema), asyncHandler(c.update));
router.delete('/:id', validate(idParam, 'params'), asyncHandler(c.remove));

module.exports = router;
