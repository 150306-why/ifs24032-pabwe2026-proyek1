const { z } = require('zod');

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD')
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Tanggal tidak valid');

const listQuerySchema = z.object({
  origin: z.coerce.number().int().positive().optional(),
  destination: z.coerce.number().int().positive().optional(),
  date: dateOnly.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  order: z.enum(['asc', 'desc']).default('asc'), // urutan waktu berangkat
});

const isoDate = z.string().datetime('Gunakan format ISO 8601 UTC, mis. 2026-11-01T01:00:00.000Z');
const status = z.enum(['open', 'closed', 'cancelled']);

const createScheduleSchema = z.object({
  route_id: z.number().int().positive(),
  boat_id: z.number().int().positive(),
  departure_at: isoDate,
  capacity: z.number().int().positive().optional(),
});

const updateScheduleSchema = z
  .object({
    boat_id: z.number().int().positive(),
    departure_at: isoDate,
    capacity: z.number().int().positive(),
    status,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Minimal satu field harus diisi');

module.exports = { listQuerySchema, createScheduleSchema, updateScheduleSchema };
