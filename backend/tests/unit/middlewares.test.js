const jwt = require('jsonwebtoken');
const { z } = require('zod');
const auth = require('../../src/middlewares/auth');
const requireRole = require('../../src/middlewares/requireRole');
const validate = require('../../src/middlewares/validate');
const { errorHandler, notFoundHandler } = require('../../src/middlewares/errorHandler');
const { env } = require('../../src/config/env');
const HttpError = require('../../src/utils/httpError');
const { mockRes } = require('../mocks');

const sign = (payload = {}, options = {}) => jwt.sign({ role: 'admin', ...payload }, env.jwtSecret, {
  subject: '5',
  algorithm: 'HS256',
  expiresIn: '1h',
  ...options,
});

describe('middleware auth', () => {
  it('token valid mengisi req.user', () => {
    const req = { headers: { authorization: `Bearer ${sign()}` } };
    const next = jest.fn();
    auth(req, {}, next);
    expect(req.user).toEqual({ id: 5, role: 'admin' });
    expect(next).toHaveBeenCalledWith();
  });

  it('tanpa header -> 401', () => {
    const next = jest.fn();
    auth({ headers: {} }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401, message: 'Autentikasi diperlukan' });
  });

  it('skema bukan Bearer -> 401', () => {
    const next = jest.fn();
    auth({ headers: { authorization: 'Basic abc' } }, {}, next);
    expect(next.mock.calls[0][0].status).toBe(401);
  });

  it('Bearer tanpa token -> 401', () => {
    const next = jest.fn();
    auth({ headers: { authorization: 'Bearer' } }, {}, next);
    expect(next.mock.calls[0][0].status).toBe(401);
  });

  it('token rusak -> 401', () => {
    const next = jest.fn();
    auth({ headers: { authorization: 'Bearer bukan.token.valid' } }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401, message: 'Token tidak valid atau kadaluarsa' });
  });

  it('token kadaluarsa -> 401', () => {
    const expired = jwt.sign(
      { role: 'admin', sub: '5', exp: Math.floor(Date.now() / 1000) - 60 },
      env.jwtSecret,
      { algorithm: 'HS256' },
    );
    const next = jest.fn();
    auth({ headers: { authorization: `Bearer ${expired}` } }, {}, next);
    expect(next.mock.calls[0][0].status).toBe(401);
  });

  it('algoritma selain HS256 ditolak', () => {
    const token = sign({}, { algorithm: 'HS512' });
    const next = jest.fn();
    auth({ headers: { authorization: `Bearer ${token}` } }, {}, next);
    expect(next.mock.calls[0][0].status).toBe(401);
  });

  it('secret berbeda ditolak', () => {
    const token = jwt.sign({ role: 'admin' }, 'secret-lain-yang-cukup-panjang', { subject: '5' });
    const next = jest.fn();
    auth({ headers: { authorization: `Bearer ${token}` } }, {}, next);
    expect(next.mock.calls[0][0].status).toBe(401);
  });
});

describe('middleware requireRole', () => {
  it('tanpa req.user -> 401', () => {
    const next = jest.fn();
    requireRole('admin')({}, {}, next);
    expect(next.mock.calls[0][0].status).toBe(401);
  });

  it('role tidak cocok -> 403', () => {
    const next = jest.fn();
    requireRole('admin')({ user: { role: 'customer' } }, {}, next);
    expect(next.mock.calls[0][0].status).toBe(403);
  });

  it('role cocok -> lanjut', () => {
    const next = jest.fn();
    requireRole('admin', 'customer')({ user: { role: 'customer' } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });
});

describe('middleware validate', () => {
  const schema = z.object({ n: z.coerce.number().int() });

  it('menyimpan hasil parse ke req.valid[source]', () => {
    const req = { body: { n: '5' }, valid: { query: { page: 1 } } };
    const next = jest.fn();
    validate(schema)(req, {}, next);
    expect(req.valid).toEqual({ query: { page: 1 }, body: { n: 5 } });
    expect(next).toHaveBeenCalledWith();
  });

  it('source lain (params)', () => {
    const req = { params: { n: '9' } };
    const next = jest.fn();
    validate(schema, 'params')(req, {}, next);
    expect(req.valid.params).toEqual({ n: 9 });
  });

  it('gagal -> next(ZodError) dan req.valid tidak terisi', () => {
    const req = { body: { n: 'abc' } };
    const next = jest.fn();
    validate(schema)(req, {}, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(z.ZodError);
    expect(req.valid).toBeUndefined();
  });
});

describe('errorHandler', () => {
  let consoleError;
  beforeEach(() => { consoleError = jest.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => { consoleError.mockRestore(); });

  const handle = (err) => {
    const res = mockRes();
    errorHandler(err, {}, res, jest.fn());
    return res;
  };

  it('ZodError -> 422 dengan detail per field', () => {
    const { error } = z.object({ email: z.string().email('Email tidak valid') }).safeParse({ email: 'x' });
    const res = handle(error);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ message: 'Data tidak valid', errors: { email: 'Email tidak valid' } });
  });

  it('ZodError tanpa path memakai kunci _', () => {
    const { error } = z.string().safeParse(1);
    const res = handle(error);
    expect(res.json.mock.calls[0][0].errors).toHaveProperty('_');
  });

  it('SQLITE UNIQUE dan PRIMARYKEY -> 409 Data sudah ada', () => {
    ['SQLITE_CONSTRAINT_UNIQUE', 'SQLITE_CONSTRAINT_PRIMARYKEY'].forEach((code) => {
      const res = handle(Object.assign(new Error('x'), { code }));
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Data sudah ada' });
    });
  });

  it('SQLITE FOREIGNKEY -> 409', () => {
    const res = handle(Object.assign(new Error('x'), { code: 'SQLITE_CONSTRAINT_FOREIGNKEY' }));
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].message).toMatch(/masih dipakai/);
  });

  it('SQLITE constraint lain (CHECK) -> 422', () => {
    const res = handle(Object.assign(new Error('x'), { code: 'SQLITE_CONSTRAINT_CHECK' }));
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('HttpError tanpa dan dengan errors', () => {
    const plain = handle(HttpError.notFound('hilang'));
    expect(plain.status).toHaveBeenCalledWith(404);
    expect(plain.json).toHaveBeenCalledWith({ message: 'hilang' });

    const detailed = handle(HttpError.unprocessable('salah', { f: 'x' }));
    expect(detailed.status).toHaveBeenCalledWith(422);
    expect(detailed.json).toHaveBeenCalledWith({ message: 'salah', errors: { f: 'x' } });
  });

  it('JSON rusak -> 400', () => {
    const res = handle(Object.assign(new Error('x'), { type: 'entity.parse.failed' }));
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Format JSON tidak valid' });
  });

  it('body terlalu besar -> 413', () => {
    const res = handle(Object.assign(new Error('x'), { type: 'entity.too.large' }));
    expect(res.status).toHaveBeenCalledWith(413);
  });

  it('error tak dikenal -> 500 tanpa detail internal', () => {
    const res = handle(new Error('rahasia internal'));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Terjadi kesalahan pada server' });
    expect(consoleError).toHaveBeenCalled();
  });
});

describe('notFoundHandler', () => {
  it('membalas 404', () => {
    const res = mockRes();
    notFoundHandler({}, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Endpoint tidak ditemukan' });
  });
});
