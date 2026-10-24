const request = require('supertest');
const { createTestContext, bearer, createSchedule, book, adults, HOUR } = require('./helpers');

describe('Tiket dan check-in', () => {
  let ctx;
  beforeAll(async () => { ctx = await createTestContext(); });
  // Tutup DB agar prepared statement dilepas sebelum Jest membongkar environment (cegah crash native better-sqlite3).
  afterAll(() => { ctx.db.close(); });

  async function paidTicket(inMs) {
    const schedule = await createSchedule(ctx, { capacity: 5, inMs });
    const booking = (await book(ctx, ctx.customerToken, schedule.id, adults(1))).body.data;
    await request(ctx.app).post(`/api/bookings/${booking.code}/pay`).set(bearer(ctx.customerToken));
    return booking.tickets[0].code;
  }

  it('verifikasi publik tanpa data sensitif', async () => {
    const code = await paidTicket(10 * 60 * 1000);
    const res = await request(ctx.app).get(`/api/tickets/${code}`);
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.passenger_name).toContain('*');
    ['price', 'email', 'user_id', 'booking_code'].forEach((k) => expect(res.body.data).not.toHaveProperty(k));
    expect((await request(ctx.app).get('/api/tickets/TK-TIDAKADA')).status).toBe(404);
  });

  it('check-in: customer 403, admin sukses, kedua kali 409', async () => {
    const code = await paidTicket(10 * 60 * 1000); // berangkat hari ini (WIB)
    expect((await request(ctx.app).post(`/api/tickets/${code}/checkin`).set(bearer(ctx.customerToken))).status).toBe(403);
    expect((await request(ctx.app).post(`/api/tickets/${code}/checkin`)).status).toBe(401);
    const first = await request(ctx.app).post(`/api/tickets/${code}/checkin`).set(bearer(ctx.adminToken));
    expect(first.status).toBe(200);
    expect(first.body.data.checked_in).toBe(true);
    const second = await request(ctx.app).post(`/api/tickets/${code}/checkin`).set(bearer(ctx.adminToken));
    expect(second.status).toBe(409);
  });

  it('check-in booking belum dibayar -> 409', async () => {
    const schedule = await createSchedule(ctx, { capacity: 5, inMs: 10 * 60 * 1000 });
    const booking = (await book(ctx, ctx.customerToken, schedule.id, adults(1))).body.data;
    const res = await request(ctx.app).post(`/api/tickets/${booking.tickets[0].code}/checkin`).set(bearer(ctx.adminToken));
    expect(res.status).toBe(409);
  });

  it('check-in bukan hari keberangkatan -> 422', async () => {
    const code = await paidTicket(3 * 24 * HOUR);
    const res = await request(ctx.app).post(`/api/tickets/${code}/checkin`).set(bearer(ctx.adminToken));
    expect(res.status).toBe(422);
  });
});
