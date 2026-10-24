const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Tanggal (YYYY-MM-DD) dalam zona WIB untuk sebuah waktu ISO/Date. */
function wibDate(value) {
  return new Date(new Date(value).getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

/** Rentang [awal, akhir) satu hari WIB dalam ISO UTC, untuk filter departure_at. */
function wibDayRangeUtc(dateStr) {
  const start = new Date(`${dateStr}T00:00:00+07:00`);
  return [start.toISOString(), new Date(start.getTime() + DAY_MS).toISOString()];
}

module.exports = { wibDate, wibDayRangeUtc };
