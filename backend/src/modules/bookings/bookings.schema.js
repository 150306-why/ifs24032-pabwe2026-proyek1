const { z } = require('zod');

const MAX_PASSENGERS = 10;

const createBookingSchema = z.object({
  schedule_id: z.number().int().positive(),
  passengers: z
    .array(
      z.object({
        name: z.string().trim().min(2, 'Nama penumpang minimal 2 karakter').max(80),
        category: z.enum(['dewasa', 'anak']),
      }),
    )
    .min(1, 'Minimal 1 penumpang')
    .max(MAX_PASSENGERS, `Maksimal ${MAX_PASSENGERS} penumpang per booking`),
});

module.exports = { createBookingSchema, MAX_PASSENGERS };
