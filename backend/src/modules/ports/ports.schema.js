const { z } = require('zod');

const portSchema = z.object({ name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(80) });

module.exports = { portSchema };
