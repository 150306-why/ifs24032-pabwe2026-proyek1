// Dijalankan sebelum modul aplikasi dimuat (jest setupFiles).
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'rahasia-khusus-test-minimal-16';
process.env.RATE_LIMIT_MAX = '1000';
process.env.SEED_ADMIN_EMAIL = 'admin@tobatix.test';
process.env.SEED_ADMIN_PASSWORD = 'AdminTest123';
process.env.SEED_CUSTOMER_EMAIL = 'customer@tobatix.test';
process.env.SEED_CUSTOMER_PASSWORD = 'CustomerTest123';
