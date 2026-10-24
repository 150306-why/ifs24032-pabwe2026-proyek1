const request = require('supertest');
const { createTestContext, bearer, createSchedule, book, adults } = require('./helpers');

describe('Booking', () => {
  let ctx;
  beforeAll(async () => { ctx = await createTestContext(); });

  it('booking sukses: harga dihitung server, mengabaikan harga dari klien', async () => {
    const schedule = await createSchedule(ctx, { capacity: 10 });
    const res = await request(ctx.app)
      .post('/api/bookings')
      .set(bearer(ctx.customerToken))
      .send({ schedule_id: schedule.id, passengers: [
        { name: 'Siti', category: 'dewasa', price: 1 },
        { name: 'Anak Siti', category: 'anak', price: 1 },
      ] });
    expect(res.status).toBe(201);
    expect(res.body.data.total).toBe(32000); // 20000 + 12000 dari tabel fares
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.tickets).toHaveLength(2);
    const after = await request(ctx.app).get(`/api/schedules/${schedule.id}`);
    expect(after.body.data.seats_left).toBe(8);
  });

  it('kursi tidak cukup -> 409 dan kuota tidak melebihi kapasitas', async () => {
    const schedule = await createSchedule(ctx, { capacity: 2 });
    expect((await book(ctx, ctx.customerToken, schedule.id, adults(2))).status).toBe(201);
    const full = await book(ctx, ctx.customerToken, schedule.id, adults(1));
    expect(full.status).toBe(409);
    const after = await request(ctx.app).get(`/api/schedules/${schedule.id}`);
    expect(after.body.data.booked).toBe(2);
    expect(after.body.data.booked).toBeLessThanOrEqual(after.body.data.capacity);
  });

  it('permintaan bersamaan tidak bisa melebihi kapasitas', async () => {
    const schedule = await createSchedule(ctx, { capacity: 2 });
    const results = await Promise.all([1, 2, 3, 4].map(() => book(ctx, ctx.customerToken, schedule.id, adults(1))));
    const ok = results.filter((r) => r.status === 201).length;
    expect(ok).toBe(2);
    expect(results.filter((r) => r.status === 409)).toHaveLength(2);
  });

  it('validasi: >10 penumpang, kategori salah, tanpa token', async () => {
    const schedule = await createSchedule(ctx, { capacity: 50 });
    expect((await book(ctx, ctx.customerToken, schedule.id, adults(11))).status).toBe(422);
    expect((await book(ctx, ctx.customerToken, schedule.id, [{ name: 'Budi', category: 'bayi' }])).status).toBe(422);
    const noToken = await request(ctx.app).post('/api/bookings').send({ schedule_id: schedule.id, passengers: adults(1) });
    expect(noToken.status).toBe(401);
  });

  it('jadwal sudah berangkat ditolak', async () => {
    ctx.db.prepare("INSERT INTO schedules (route_id, boat_id, departure_at, capacity) VALUES (1, 1, '2020-01-01T00:00:00.000Z', 5)").run();
    const id = ctx.db.prepare('SELECT MAX(id) AS id FROM schedules').get().id;
    expect((await book(ctx, ctx.customerToken, id, adults(1))).status).toBe(409);
  });

  it('cancel mengembalikan kuota; cancel kedua -> 409', async () => {
    const schedule = await createSchedule(ctx, { capacity: 5 });
    const created = await book(ctx, ctx.customerToken, schedule.id, adults(3));
    const { code } = created.body.data;
    expect((await request(ctx.app).get(`/api/schedules/${schedule.id}`)).body.data.seats_left).toBe(2);
    const cancel = await request(ctx.app).post(`/api/bookings/${code}/cancel`).set(bearer(ctx.customerToken));
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe('cancelled');
    expect((await request(ctx.app).get(`/api/schedules/${schedule.id}`)).body.data.seats_left).toBe(5);
    expect((await request(ctx.app).post(`/api/bookings/${code}/cancel`).set(bearer(ctx.customerToken))).status).toBe(409);
  });

  it('pay mengubah status ke paid; pay ulang -> 409', async () => {
    const schedule = await createSchedule(ctx, { capacity: 5 });
    const { code } = (await book(ctx, ctx.customerToken, schedule.id, adults(1))).body.data;
    const pay = await request(ctx.app).post(`/api/bookings/${code}/pay`).set(bearer(ctx.customerToken));
    expect(pay.body.data.status).toBe('paid');
    expect((await request(ctx.app).post(`/api/bookings/${code}/pay`).set(bearer(ctx.customerToken))).status).toBe(409);
  });

  it('booking milik orang lain -> 403, admin boleh melihat', async () => {
    const other = await request(ctx.app)
      .post('/api/auth/register')
      .send({ name: 'Orang Lain', email: 'lain@test.com', password: 'password123' });
    const schedule = await createSchedule(ctx, { capacity: 5 });
    const { code } = (await book(ctx, ctx.customerToken, schedule.id, adults(1))).body.data;
    expect((await request(ctx.app).get(`/api/bookings/${code}`).set(bearer(other.body.data.token))).status).toBe(403);
    expect((await request(ctx.app).post(`/api/bookings/${code}/pay`).set(bearer(other.body.data.token))).status).toBe(403);
    expect((await request(ctx.app).get(`/api/bookings/${code}`).set(bearer(ctx.adminToken))).status).toBe(200);
  });

  it('booking pending lewat 15 menit otomatis batal dan kuota kembali', async () => {
    const schedule = await createSchedule(ctx, { capacity: 4 });
    const { code } = (await book(ctx, ctx.customerToken, schedule.id, adults(2))).body.data;
    const old = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    ctx.db.prepare('UPDATE bookings SET created_at = ? WHERE code = ?').run(old, code);
    const res = await request(ctx.app).get(`/api/bookings/${code}`).set(bearer(ctx.customerToken));
    expect(res.body.data.status).toBe('cancelled');
    expect((await request(ctx.app).get(`/api/schedules/${schedule.id}`)).body.data.seats_left).toBe(4);
  });
});
