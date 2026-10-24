CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin'))
);

CREATE TABLE IF NOT EXISTS ports (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS boats (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name     TEXT NOT NULL,
  type     TEXT NOT NULL CHECK (type IN ('ferry', 'speedboat', 'wisata')),
  capacity INTEGER NOT NULL CHECK (capacity > 0)
);

CREATE TABLE IF NOT EXISTS routes (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  origin_port_id      INTEGER NOT NULL REFERENCES ports(id),
  destination_port_id INTEGER NOT NULL REFERENCES ports(id),
  duration_min        INTEGER NOT NULL CHECK (duration_min > 0),
  UNIQUE (origin_port_id, destination_port_id),
  CHECK (origin_port_id <> destination_port_id)
);

CREATE TABLE IF NOT EXISTS fares (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('dewasa', 'anak')),
  price    INTEGER NOT NULL CHECK (price >= 0),
  UNIQUE (route_id, category)
);

CREATE TABLE IF NOT EXISTS schedules (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id     INTEGER NOT NULL REFERENCES routes(id),
  boat_id      INTEGER NOT NULL REFERENCES boats(id),
  departure_at TEXT NOT NULL, -- ISO 8601 UTC, contoh 2026-10-25T01:00:00.000Z
  capacity     INTEGER NOT NULL,
  booked       INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  CHECK (booked BETWEEN 0 AND capacity)
);
CREATE INDEX IF NOT EXISTS idx_schedules_route_departure ON schedules (route_id, departure_at);

CREATE TABLE IF NOT EXISTS bookings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT NOT NULL UNIQUE,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  schedule_id INTEGER NOT NULL REFERENCES schedules(id),
  total       INTEGER NOT NULL CHECK (total >= 0),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings (user_id);

CREATE TABLE IF NOT EXISTS tickets (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id      INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  passenger_name  TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('dewasa', 'anak')),
  price           INTEGER NOT NULL CHECK (price >= 0),
  code            TEXT NOT NULL UNIQUE,
  checked_in_at   TEXT
);
CREATE INDEX IF NOT EXISTS idx_tickets_booking ON tickets (booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status_created ON bookings (status, created_at);
