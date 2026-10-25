const fs = require('fs');
const os = require('os');
const path = require('path');
const { createDb } = require('../../src/config/db');
const { initDb } = require('../../src/db/init');
const { seedIfEmpty } = require('../../src/db/seed');
const { collectGarbage } = require('../gc');

const ORIGINAL_ENV = { ...process.env };

function restoreEnv() {
  Object.keys(process.env).forEach((key) => {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  });
  Object.assign(process.env, ORIGINAL_ENV);
}

/** Memuat modul env baru dengan variabel tertentu (undefined = dihapus). dotenv dimatikan agar .env lokal tidak ikut. */
function loadEnv(overrides = {}) {
  Object.entries(overrides).forEach(([key, value]) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  });
  let mod;
  jest.isolateModules(() => {
    jest.doMock('dotenv', () => ({ config: jest.fn() }));
    mod = require('../../src/config/env');
  });
  return mod;
}

afterAll(() => { collectGarbage(); });

afterEach(() => {
  restoreEnv();
  jest.dontMock('dotenv');
  jest.resetModules();
});

describe('config/env', () => {
  it('memakai nilai bawaan jika variabel tidak diset', () => {
    const { env } = loadEnv({
      NODE_ENV: undefined,
      PORT: undefined,
      DB_PATH: undefined,
      JWT_EXPIRES_IN: undefined,
      CORS_ORIGIN: undefined,
      SEED_ADMIN_EMAIL: undefined,
      SEED_CUSTOMER_EMAIL: undefined,
    });
    expect(env.nodeEnv).toBe('development');
    expect(env.port).toBe(3000);
    expect(env.dbPath).toBe('./data/tobatix.db');
    expect(env.jwtExpiresIn).toBe('2h');
    expect(env.corsOrigin).toBe('http://localhost:5173');
    expect(env.seed.adminEmail).toBe('admin@tobatix.test');
    expect(env.seed.customerEmail).toBe('customer@tobatix.test');
  });

  it('membaca nilai dari environment', () => {
    const { env } = loadEnv({
      NODE_ENV: 'production',
      PORT: '4000',
      DB_PATH: '/tmp/x.db',
      JWT_EXPIRES_IN: '30m',
      CORS_ORIGIN: 'https://contoh.test',
      SEED_ADMIN_PASSWORD: 'rahasia-admin',
    });
    expect(env.nodeEnv).toBe('production');
    expect(env.port).toBe(4000);
    expect(env.dbPath).toBe('/tmp/x.db');
    expect(env.jwtExpiresIn).toBe('30m');
    expect(env.corsOrigin).toBe('https://contoh.test');
    expect(env.seed.adminPassword).toBe('rahasia-admin');
  });

  describe('assertRequiredEnv', () => {
    it('melempar error jika JWT_SECRET kosong', () => {
      const { assertRequiredEnv } = loadEnv({ JWT_SECRET: undefined });
      expect(() => assertRequiredEnv()).toThrow(/JWT_SECRET/);
    });

    it('melempar error jika JWT_SECRET kurang dari 16 karakter', () => {
      const { assertRequiredEnv } = loadEnv({ JWT_SECRET: 'pendek' });
      expect(() => assertRequiredEnv()).toThrow(/minimal 16/);
    });

    it('lolos jika JWT_SECRET cukup panjang', () => {
      const { assertRequiredEnv } = loadEnv({ JWT_SECRET: 'secret-yang-cukup-panjang' });
      expect(() => assertRequiredEnv()).not.toThrow();
    });
  });
});

describe('config/db', () => {
  it('membuka DB in-memory dengan foreign key aktif', () => {
    const db = createDb(':memory:');
    try {
      expect(db.open).toBe(true);
      expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
    } finally {
      db.close();
    }
  });

  it('membuat folder dan file DB dengan mode WAL', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tobatix-'));
    const file = path.join(dir, 'sub', 'uji.db');
    const db = createDb(file);
    try {
      expect(fs.existsSync(file)).toBe(true);
      expect(String(db.pragma('journal_mode', { simple: true })).toLowerCase()).toBe('wal');
    } finally {
      db.close();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('db/init', () => {
  it('membuat semua tabel dan aman dipanggil berulang', () => {
    const db = createDb(':memory:');
    try {
      initDb(db);
      expect(() => initDb(db)).not.toThrow();
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((t) => t.name);
      ['users', 'ports', 'boats', 'routes', 'fares', 'schedules', 'bookings', 'tickets']
        .forEach((name) => expect(tables).toContain(name));
    } finally {
      db.close();
    }
  });
});

describe('db/seed', () => {
  let db;
  beforeEach(() => {
    db = createDb(':memory:');
    initDb(db);
  });
  afterEach(() => { db.close(); });
  afterAll(() => { db = null; });

  const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;

  it('mengisi akun, katalog, dan jadwal 7 hari', () => {
    expect(seedIfEmpty(db)).toBe(true);
    expect(count('users')).toBe(2);
    expect(count('ports')).toBe(3);
    expect(count('boats')).toBe(2);
    expect(count('routes')).toBe(3);
    expect(count('fares')).toBe(6);
    expect(count('schedules')).toBe(3 * 7 * 3);
    const roles = db.prepare('SELECT role FROM users ORDER BY id').all().map((u) => u.role);
    expect(roles).toEqual(['admin', 'customer']);
  });

  it('idempoten: panggilan kedua tidak menambah data', () => {
    expect(seedIfEmpty(db)).toBe(true);
    expect(seedIfEmpty(db)).toBe(false);
    expect(count('ports')).toBe(3);
    expect(count('users')).toBe(2);
  });

  it('password hash tidak sama dengan password mentah', () => {
    seedIfEmpty(db);
    const { password_hash: hash } = db.prepare("SELECT password_hash FROM users WHERE role = 'admin'").get();
    expect(hash).not.toBe(process.env.SEED_ADMIN_PASSWORD);
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('melempar error jika password seed tidak diisi', () => {
    delete process.env.SEED_ADMIN_PASSWORD;
    delete process.env.SEED_CUSTOMER_PASSWORD;
    let seedModule;
    jest.isolateModules(() => {
      jest.doMock('dotenv', () => ({ config: jest.fn() }));
      // Hindari memuat better-sqlite3 untuk kedua kalinya: db sudah disuntikkan dari luar.
      jest.doMock('../../src/config/db', () => ({ createDb: jest.fn() }));
      seedModule = require('../../src/db/seed');
    });
    expect(() => seedModule.seedIfEmpty(db)).toThrow(/SEED_ADMIN_PASSWORD/);
    expect(count('users')).toBe(0); // transaksi dibatalkan
    jest.dontMock('../../src/config/db');
  });
});
