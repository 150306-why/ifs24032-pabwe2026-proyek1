const request = require('supertest');
const { createTestContext, bearer } = require('./helpers');

describe('Auth', () => {
  let ctx;
  beforeAll(async () => { ctx = await createTestContext(); });

  it('register berhasil dan role selalu customer', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/register')
      .send({ name: 'Budi', email: 'Budi@Test.com', password: 'password123', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ email: 'budi@test.com', role: 'customer' });
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.password_hash).toBeUndefined();
  });

  it('register email duplikat -> 409', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/register')
      .send({ name: 'Budi 2', email: 'budi@test.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  it('register input tidak valid -> 422 dengan detail field', async () => {
    const res = await request(ctx.app).post('/api/auth/register').send({ name: 'B', email: 'x', password: '1' });
    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('email');
    expect(res.body.errors).toHaveProperty('password');
  });

  it('login benar -> token; /me mengembalikan profil', async () => {
    const login = await request(ctx.app).post('/api/auth/login').send({ email: 'budi@test.com', password: 'password123' });
    expect(login.status).toBe(200);
    const me = await request(ctx.app).get('/api/auth/me').set(bearer(login.body.data.token));
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe('budi@test.com');
  });

  it('login password salah -> 401 generik', async () => {
    const res = await request(ctx.app).post('/api/auth/login').send({ email: 'budi@test.com', password: 'salah-banget' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Email atau password salah');
  });

  it('akses tanpa token atau token palsu -> 401', async () => {
    expect((await request(ctx.app).get('/api/auth/me')).status).toBe(401);
    expect((await request(ctx.app).get('/api/auth/me').set(bearer('token.palsu.xyz'))).status).toBe(401);
  });
});
