const { z } = require('zod');

const idParam = z.object({ id: z.coerce.number().int().positive() });
const codeParam = z.object({ code: z.string().trim().min(3).max(40).transform((c) => c.toUpperCase()) });

module.exports = { idParam, codeParam };
