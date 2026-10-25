const request = require('supertest');
const { createTestContext, bearer, releaseContext } = require('./helpers');

describe('Jadwal dan otorisasi admin', () => {
  let ctx;
  beforeAll(async () => { ctx = await createTestContext(); });
  // Tutup DB agar prepared statement dilepas sebelum Jest membongkar environment (cegah crash native better-sqlite3).
  afterAll(() => { releaseContext(ctx); });

  it('daftar publik hanya jadwal open di masa depan, ada sisa kursi dan tarif', async () => {
    const res = await request(ctx.app).get('/api/schedules?limit=50');
    expect(res.status).toBe(200);
    const { items, pagination } = res.body.data;
    expect(items.length).toBeGreaterThan(0);
    expect(pagination.total).toBeGreaterThanOrEqual(items.length);
    items.forEach((s) => {
      expect(s.status).toBe('open');
      expect(new Date(s.departure_at).getTime()).toBeGreaterThan(Date.now());
      expect(s.seats_left).toBe(s.capacity - s.booked);
      expect(s.fares.dewasa).toBeGreaterThan(0);
    });
  });

  it('filter origin/destination dan date bekerja', async () => {
    const all = (await request(ctx.app).get('/api/schedules?limit=50')).body.data.items;
    const first = all[0];
    const date = new Date(new Date(first.departure_at).getTime() + 7 * 3600e3).toISOString().slice(0, 10);
    const res = await request(ctx.app)
      .get(`/api/schedules?origin=${first.route.origin.id}&destination=${first.route.destination.id}&date=${date}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    res.body.data.items.forEach((s) => {
      expect(s.route.origin.id).toBe(first.route.origin.id);
      expect(s.route.destination.id).toBe(first.route.destination.id);
    });
    const none = await request(ctx.app).get('/api/schedules?origin=999');
    expect(none.body.data.items).toHaveLength(0);
  });

  it('query tidak valid -> 422', async () => {
    expect((await request(ctx.app).get('/api/schedules?date=besok')).status).toBe(422);
  });

  it('detail jadwal tidak ada -> 404', async () => {
    expect((await request(ctx.app).get('/api/schedules/99999')).status).toBe(404);
  });

  it('endpoint admin: tanpa token 401, customer 403, admin 201', async () => {
    const body = { name: 'Pelabuhan Baru' };
    expect((await request(ctx.app).post('/api/ports').send(body)).status).toBe(401);
    expect((await request(ctx.app).post('/api/ports').set(bearer(ctx.customerToken)).send(body)).status).toBe(403);
    expect((await request(ctx.app).post('/api/ports').set(bearer(ctx.adminToken)).send(body)).status).toBe(201);
    expect((await request(ctx.app).get('/api/boats').set(bearer(ctx.customerToken))).status).toBe(403);
  });

  it('hapus pelabuhan yang dipakai rute -> 409', async () => {
    const res = await request(ctx.app).delete('/api/ports/1').set(bearer(ctx.adminToken));
    expect(res.status).toBe(409);
  });
});

describe('Jadwal: urutan admin', () => {
  let ctx;
  beforeAll(async () => { ctx = await createTestContext(); });
  afterAll(() => { releaseContext(ctx); });

  it('order=desc mengurutkan keberangkatan terbaru lebih dulu; nilai lain ditolak', async () => {
    const asc = await request(ctx.app).get('/api/schedules/admin/list?limit=50').set(bearer(ctx.adminToken));
    const desc = await request(ctx.app).get('/api/schedules/admin/list?limit=50&order=desc').set(bearer(ctx.adminToken));
    const times = (res) => res.body.data.items.map((s) => s.departure_at);
    expect(times(asc)).toEqual([...times(asc)].sort());
    expect(times(desc)).toEqual([...times(desc)].sort().reverse());
    const bad = await request(ctx.app).get('/api/schedules/admin/list?order=acak').set(bearer(ctx.adminToken));
    expect(bad.status).toBe(422);
  });
});
