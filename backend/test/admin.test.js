const request = require('supertest');
const {
  createTestContext, releaseContext, bearer, createSchedule, book, adults,
} = require('./helpers');

describe('Admin: statistik, booking, pengguna', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
    const schedule = await createSchedule(ctx, { capacity: 10 });
    const paid = await book(ctx, ctx.customerToken, schedule.id, adults(2));
    await request(ctx.app).post(`/api/bookings/${paid.body.data.code}/pay`).set(bearer(ctx.customerToken));
    await book(ctx, ctx.customerToken, schedule.id, adults(1)); // tetap pending
  });
  afterAll(() => { releaseContext(ctx); });

  it('semua endpoint admin menolak tanpa token (401) dan customer (403)', async () => {
    const paths = ['/api/admin/stats', '/api/admin/bookings', '/api/admin/users'];
    for (const path of paths) {
      expect((await request(ctx.app).get(path)).status).toBe(401);
      expect((await request(ctx.app).get(path).set(bearer(ctx.customerToken))).status).toBe(403);
    }
  });

  it('stats menghitung booking, pendapatan, tiket, dan 7 hari pendapatan', async () => {
    const res = await request(ctx.app).get('/api/admin/stats').set(bearer(ctx.adminToken));
    expect(res.status).toBe(200);
    const { totals, bookings_by_status: byStatus, revenue_by_day: days, top_routes: top } = res.body.data;
    expect(byStatus).toEqual({ pending: 1, paid: 1, cancelled: 0 });
    expect(totals).toMatchObject({ customers: 1, bookings: 2, revenue: 40000, tickets_sold: 2 });
    expect(totals.upcoming_schedules).toBeGreaterThan(0);
    expect(days).toHaveLength(7);
    expect(days[6].total).toBe(40000);
    expect(top[0]).toMatchObject({ origin: 'Ajibata', destination: 'Tomok', tickets: 2, revenue: 40000 });
  });

  it('daftar booking admin memuat semua pelanggan, bisa difilter status dan dicari', async () => {
    const all = await request(ctx.app).get('/api/admin/bookings').set(bearer(ctx.adminToken));
    expect(all.status).toBe(200);
    expect(all.body.data.pagination.total).toBe(2);
    expect(all.body.data.items[0].customer.email).toBe('customer@tobatix.test');

    const paid = await request(ctx.app).get('/api/admin/bookings?status=paid').set(bearer(ctx.adminToken));
    expect(paid.body.data.items).toHaveLength(1);
    expect(paid.body.data.items[0].status).toBe('paid');

    const code = paid.body.data.items[0].code;
    const byCode = await request(ctx.app).get(`/api/admin/bookings?q=${code.slice(0, 6)}`).set(bearer(ctx.adminToken));
    expect(byCode.body.data.items.map((b) => b.code)).toContain(code);

    const none = await request(ctx.app).get('/api/admin/bookings?q=tidak-ada-ini').set(bearer(ctx.adminToken));
    expect(none.body.data.items).toHaveLength(0);
  });

  it('karakter wildcard pada pencarian diperlakukan sebagai teks biasa', async () => {
    const res = await request(ctx.app).get('/api/admin/bookings?q=%25').set(bearer(ctx.adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
  });

  it('query tidak valid -> 422', async () => {
    const res = await request(ctx.app).get('/api/admin/bookings?status=aneh').set(bearer(ctx.adminToken));
    expect(res.status).toBe(422);
  });

  it('daftar pengguna tanpa password_hash, dengan jumlah booking dan total belanja', async () => {
    const res = await request(ctx.app).get('/api/admin/users').set(bearer(ctx.adminToken));
    expect(res.status).toBe(200);
    const customer = res.body.data.items.find((u) => u.role === 'customer');
    expect(customer).toMatchObject({ email: 'customer@tobatix.test', bookings: 2, spent: 40000 });
    expect(JSON.stringify(res.body)).not.toContain('password_hash');

    const filtered = await request(ctx.app).get('/api/admin/users?role=admin&q=admin').set(bearer(ctx.adminToken));
    expect(filtered.body.data.items).toHaveLength(1);
    expect(filtered.body.data.items[0].role).toBe('admin');
  });
});

describe('Auth: profil dan ganti password', () => {
  let ctx;
  beforeAll(async () => { ctx = await createTestContext(); });
  afterAll(() => { releaseContext(ctx); });

  it('mengubah nama profil', async () => {
    const res = await request(ctx.app).put('/api/auth/profile').set(bearer(ctx.customerToken)).send({ name: '  Nama Baru  ' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'Nama Baru', email: 'customer@tobatix.test' });
    const bad = await request(ctx.app).put('/api/auth/profile').set(bearer(ctx.customerToken)).send({ name: 'x' });
    expect(bad.status).toBe(422);
    expect((await request(ctx.app).put('/api/auth/profile').send({ name: 'Tanpa Token' })).status).toBe(401);
  });

  it('ganti password: salah/sama/pendek ditolak, benar berhasil dan login memakai password baru', async () => {
    const put = (body) => request(ctx.app).put('/api/auth/password').set(bearer(ctx.customerToken)).send(body);
    const wrong = await put({ current_password: 'salah-salah', new_password: 'PasswordBaru123' });
    expect(wrong.status).toBe(422);
    expect(wrong.body.errors).toHaveProperty('current_password');

    const same = await put({ current_password: 'CustomerTest123', new_password: 'CustomerTest123' });
    expect(same.status).toBe(422);
    expect(same.body.errors).toHaveProperty('new_password');

    expect((await put({ current_password: 'CustomerTest123', new_password: 'pendek' })).status).toBe(422);

    expect((await put({ current_password: 'CustomerTest123', new_password: 'PasswordBaru123' })).status).toBe(200);
    const old = await request(ctx.app).post('/api/auth/login').send({ email: 'customer@tobatix.test', password: 'CustomerTest123' });
    expect(old.status).toBe(401);
    const fresh = await request(ctx.app).post('/api/auth/login').send({ email: 'customer@tobatix.test', password: 'PasswordBaru123' });
    expect(fresh.status).toBe(200);
  });

  it('user yang sudah dihapus tidak bisa ganti password (401)', async () => {
    ctx.db.prepare("DELETE FROM users WHERE email = 'customer@tobatix.test'").run();
    const res = await request(ctx.app).put('/api/auth/password').set(bearer(ctx.customerToken))
      .send({ current_password: 'x', new_password: 'PasswordBaru123' });
    expect(res.status).toBe(401);
  });
});
