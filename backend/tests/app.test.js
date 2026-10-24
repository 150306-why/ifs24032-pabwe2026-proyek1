const request = require('supertest');
const { createTestContext, bearer, releaseContext } = require('./helpers');
const { env } = require('../src/config/env');

describe('App (infrastruktur HTTP)', () => {
  let ctx;
  beforeAll(async () => { ctx = await createTestContext(); });
  afterAll(() => { releaseContext(ctx); });

  it('GET /api/health -> ok', async () => {
    const res = await request(ctx.app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ok' }, message: 'OK' });
  });

  it('endpoint tidak dikenal -> 404 JSON', async () => {
    const res = await request(ctx.app).get('/api/tidak-ada');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'Endpoint tidak ditemukan' });
  });

  it('JSON rusak -> 400', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{rusak');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Format JSON tidak valid');
  });

  it('body lebih dari 10kb -> 413', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: 'a@b.co', password: 'x'.repeat(11000) });
    expect(res.status).toBe(413);
    expect(res.body.message).toBe('Ukuran data terlalu besar');
  });

  it('header keamanan helmet aktif dan X-Powered-By disembunyikan', async () => {
    const res = await request(ctx.app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('CORS hanya mengizinkan origin yang dikonfigurasi', async () => {
    const res = await request(ctx.app).get('/api/health').set('Origin', env.corsOrigin);
    expect(res.headers['access-control-allow-origin']).toBe(env.corsOrigin);
  });
});

describe('Auth (kasus tambahan)', () => {
  let ctx;
  beforeAll(async () => { ctx = await createTestContext(); });
  afterAll(() => { releaseContext(ctx); });

  it('login email tidak terdaftar -> 401 dengan pesan generik', async () => {
    const res = await request(ctx.app).post('/api/auth/login').send({ email: 'tidak@ada.com', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Email atau password salah');
  });

  it('login tanpa body -> 422', async () => {
    const res = await request(ctx.app).post('/api/auth/login').send({});
    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('email');
    expect(res.body.errors).toHaveProperty('password');
  });

  it('login admin seed mengembalikan role admin tanpa password_hash', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.user.password_hash).toBeUndefined();
    expect(res.body.message).toBe('Login berhasil');
  });

  it('/me untuk user yang sudah dihapus -> 401', async () => {
    const reg = await request(ctx.app)
      .post('/api/auth/register')
      .send({ name: 'Hapus Saya', email: 'hapus@test.com', password: 'password123' });
    expect(reg.status).toBe(201);
    ctx.db.prepare('DELETE FROM users WHERE email = ?').run('hapus@test.com');
    const me = await request(ctx.app).get('/api/auth/me').set(bearer(reg.body.data.token));
    expect(me.status).toBe(401);
  });
});
