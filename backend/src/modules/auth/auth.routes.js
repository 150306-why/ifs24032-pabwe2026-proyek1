const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const controller = require('./auth.controller');
const { registerSchema, loginSchema, profileSchema, passwordSchema } = require('./auth.schema');

const router = Router();

// Batasi percobaan login/registrasi untuk menahan brute force.
// RATE_LIMIT_MAX bisa dinaikkan saat test agar tidak mengganggu.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak percobaan, coba lagi nanti' },
});

router.use(authLimiter);
router.post('/register', validate(registerSchema), asyncHandler(controller.register));
router.post('/login', validate(loginSchema), asyncHandler(controller.login));
router.get('/me', auth, asyncHandler(controller.me));
router.put('/profile', auth, validate(profileSchema), asyncHandler(controller.updateProfile));
router.put('/password', auth, validate(passwordSchema), asyncHandler(controller.changePassword));

module.exports = router;
