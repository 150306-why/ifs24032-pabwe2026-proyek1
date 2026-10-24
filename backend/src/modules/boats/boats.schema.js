const { z } = require('zod');

const boatSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum(['ferry', 'speedboat', 'wisata']),
  capacity: z.number().int().positive().max(1000),
});

module.exports = { boatSchema };
