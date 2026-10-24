const { z } = require('zod');

const email = z.string().trim().toLowerCase().email('Email tidak valid').max(120);

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(80),
  email,
  password: z.string().min(8, 'Password minimal 8 karakter').max(72),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password wajib diisi').max(72),
});

module.exports = { registerSchema, loginSchema };
