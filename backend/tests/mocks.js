/** Objek res Express tiruan: status() dan json() bisa dirantai dan diperiksa. */
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

/** Menjalankan fn dan memastikan melempar HttpError dengan status (dan pesan) tertentu. */
function expectHttpError(fn, status, message) {
  let error;
  try {
    fn();
  } catch (e) {
    error = e;
  }
  expect(error).toBeDefined();
  expect(error.status).toBe(status);
  if (message) expect(error.message).toBe(message);
}

module.exports = { mockRes, expectHttpError };
