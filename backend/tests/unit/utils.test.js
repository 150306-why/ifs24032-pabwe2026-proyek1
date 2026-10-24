const asyncHandler = require('../../src/utils/asyncHandler');
const { generateCode } = require('../../src/utils/codeGenerator');
const { createCrudController } = require('../../src/utils/crudController');
const { wibDate, wibDayRangeUtc } = require('../../src/utils/date');
const HttpError = require('../../src/utils/httpError');
const { mockRes } = require('../mocks');

describe('asyncHandler', () => {
  it('tidak memanggil next jika handler berhasil', async () => {
    const next = jest.fn();
    const handler = jest.fn().mockResolvedValue('ok');
    await asyncHandler(handler)({ a: 1 }, {}, next);
    expect(handler).toHaveBeenCalledWith({ a: 1 }, {}, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('meneruskan error dari handler async ke next', async () => {
    const error = new Error('gagal');
    const next = jest.fn();
    await asyncHandler(async () => { throw error; })({}, {}, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('generateCode', () => {
  it('memakai awalan dan panjang hex default 10 karakter', () => {
    expect(generateCode('TT')).toMatch(/^TT-[0-9A-F]{10}$/);
  });

  it('mengikuti jumlah byte yang diminta', () => {
    expect(generateCode('TK', 6)).toMatch(/^TK-[0-9A-F]{12}$/);
  });

  it('menghasilkan kode yang berbeda', () => {
    expect(generateCode('TT', 6)).not.toBe(generateCode('TT', 6));
  });
});

describe('createCrudController', () => {
  const db = { nama: 'db-tiruan' };
  const req = { app: { locals: { db } }, valid: { params: { id: 7 }, body: { name: 'Baru' } } };
  let service;
  let controller;

  beforeEach(() => {
    service = {
      list: jest.fn().mockReturnValue([{ id: 1 }]),
      getById: jest.fn().mockReturnValue({ id: 7 }),
      create: jest.fn().mockReturnValue({ id: 8 }),
      update: jest.fn().mockReturnValue({ id: 7, name: 'Baru' }),
      remove: jest.fn(),
    };
    controller = createCrudController(service, 'Kapal');
  });

  it('list', () => {
    const res = mockRes();
    controller.list(req, res);
    expect(service.list).toHaveBeenCalledWith(db);
    expect(res.json).toHaveBeenCalledWith({ data: [{ id: 1 }], message: 'OK' });
  });

  it('get', () => {
    const res = mockRes();
    controller.get(req, res);
    expect(service.getById).toHaveBeenCalledWith(db, 7);
    expect(res.json).toHaveBeenCalledWith({ data: { id: 7 }, message: 'OK' });
  });

  it('create -> 201', () => {
    const res = mockRes();
    controller.create(req, res);
    expect(service.create).toHaveBeenCalledWith(db, { name: 'Baru' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ data: { id: 8 }, message: 'Kapal berhasil dibuat' });
  });

  it('update', () => {
    const res = mockRes();
    controller.update(req, res);
    expect(service.update).toHaveBeenCalledWith(db, 7, { name: 'Baru' });
    expect(res.json).toHaveBeenCalledWith({ data: { id: 7, name: 'Baru' }, message: 'Kapal berhasil diperbarui' });
  });

  it('remove', () => {
    const res = mockRes();
    controller.remove(req, res);
    expect(service.remove).toHaveBeenCalledWith(db, 7);
    expect(res.json).toHaveBeenCalledWith({ data: null, message: 'Kapal berhasil dihapus' });
  });
});

describe('date', () => {
  it('wibDate memakai zona UTC+7', () => {
    expect(wibDate('2026-10-24T16:59:59.000Z')).toBe('2026-10-24');
    expect(wibDate('2026-10-24T17:00:00.000Z')).toBe('2026-10-25');
  });

  it('wibDate menerima objek Date', () => {
    expect(wibDate(new Date('2026-01-01T00:00:00.000Z'))).toBe('2026-01-01');
  });

  it('wibDayRangeUtc mengembalikan rentang satu hari WIB dalam UTC', () => {
    expect(wibDayRangeUtc('2026-10-25')).toEqual([
      '2026-10-24T17:00:00.000Z',
      '2026-10-25T17:00:00.000Z',
    ]);
  });
});

describe('HttpError', () => {
  it('menyimpan status, pesan, dan detail field', () => {
    const err = new HttpError(418, 'teko', { a: 'b' });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('HttpError');
    expect(err.status).toBe(418);
    expect(err.message).toBe('teko');
    expect(err.errors).toEqual({ a: 'b' });
  });

  it.each([
    ['badRequest', 400, 'salah'],
    ['conflict', 409, 'bentrok'],
    ['unprocessable', 422, 'tidak valid'],
  ])('%s memakai status %i', (factory, status, msg) => {
    const err = HttpError[factory](msg);
    expect(err.status).toBe(status);
    expect(err.message).toBe(msg);
  });

  it('pabrik dengan pesan bawaan', () => {
    expect(HttpError.unauthorized()).toMatchObject({ status: 401, message: 'Autentikasi diperlukan' });
    expect(HttpError.forbidden()).toMatchObject({ status: 403, message: 'Akses ditolak' });
    expect(HttpError.notFound()).toMatchObject({ status: 404, message: 'Data tidak ditemukan' });
  });

  it('badRequest dan unprocessable membawa errors', () => {
    expect(HttpError.badRequest('x', { f: 1 }).errors).toEqual({ f: 1 });
    expect(HttpError.unprocessable('x', { f: 2 }).errors).toEqual({ f: 2 });
  });
});
