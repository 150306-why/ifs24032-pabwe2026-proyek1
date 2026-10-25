const { z } = require('zod');

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
};

/** Kata kunci pencarian bebas; dipotong agar query LIKE tetap ringan. */
const keyword = z.string().trim().max(60).optional();

const bookingsQuerySchema = z.object({
  status: z.enum(['pending', 'paid', 'cancelled']).optional(),
  q: keyword,
  ...pagination,
});

const usersQuerySchema = z.object({
  role: z.enum(['customer', 'admin']).optional(),
  q: keyword,
  ...pagination,
});

module.exports = { bookingsQuerySchema, usersQuerySchema };
