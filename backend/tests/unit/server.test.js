const { createDb } = require('../../src/config/db');

const ORIGINAL_ENV = { ...process.env };

describe('server.js', () => {
  let testDb;
  let consoleLog;
  let consoleError;

  beforeEach(() => {
    testDb = createDb(':memory:');
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.dontMock('dotenv');
    jest.dontMock('../../src/config/db');
    jest.dontMock('../../src/app');
    jest.resetModules();
    consoleLog.mockRestore();
    consoleError.mockRestore();
    if (testDb.open) testDb.close();
    Object.keys(process.env).forEach((key) => {
      if (!(key in ORIGINAL_ENV)) delete process.env[key];
    });
    Object.assign(process.env, ORIGINAL_ENV);
  });

  /** Memuat server.js dengan app.listen dan createDb dipalsukan (tidak membuka port sungguhan). */
  function loadServer() {
    const listen = jest.fn((port, callback) => callback());
    jest.isolateModules(() => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      jest.doMock('../../src/config/db', () => ({ createDb: () => testDb }));
      jest.doMock('../../src/app', () => ({ createApp: jest.fn(() => ({ listen })) }));
      require('../../src/server');
    });
    return listen;
  }

  it('menyiapkan skema, seed, lalu listen pada port env', () => {
    jest.useFakeTimers();
    const listen = loadServer();

    expect(listen).toHaveBeenCalledWith(Number(process.env.PORT) || 3000, expect.any(Function));
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Toba Tix API berjalan'));
    expect(testDb.prepare('SELECT COUNT(*) AS n FROM ports').get().n).toBe(3);
  });

  it('job interval membatalkan booking pending yang kadaluarsa', () => {
    jest.useFakeTimers();
    loadServer();

    const old = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    testDb.prepare(
      "INSERT INTO bookings (code, user_id, schedule_id, total, status, created_at) VALUES ('TT-LAMA', 2, 1, 0, 'pending', ?)",
    ).run(old);

    jest.advanceTimersByTime(60 * 1000);

    const row = testDb.prepare("SELECT status FROM bookings WHERE code = 'TT-LAMA'").get();
    expect(row.status).toBe('cancelled');
  });

  it('error pada job interval dicatat, proses tidak berhenti', () => {
    jest.useFakeTimers();
    loadServer();
    testDb.close();

    expect(() => jest.advanceTimersByTime(60 * 1000)).not.toThrow();
    expect(consoleError).toHaveBeenCalledWith('Gagal expire booking', expect.anything());
  });

  it('gagal start jika JWT_SECRET tidak valid', () => {
    process.env.JWT_SECRET = 'pendek';
    expect(() => loadServer()).toThrow(/JWT_SECRET/);
  });
});
