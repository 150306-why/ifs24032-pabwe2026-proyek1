const { z } = require('zod');

const fare = z.number().int().min(0).max(100000000);

const routeSchema = z
  .object({
    origin_port_id: z.number().int().positive(),
    destination_port_id: z.number().int().positive(),
    duration_min: z.number().int().positive().max(1440),
    fares: z.object({ dewasa: fare, anak: fare }),
  })
  .refine((v) => v.origin_port_id !== v.destination_port_id, {
    message: 'Pelabuhan asal dan tujuan tidak boleh sama',
    path: ['destination_port_id'],
  });

module.exports = { routeSchema };
